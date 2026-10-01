import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RULES, wordCount } from '@numerology/content';
import { buildCautionRequest } from './caution-draft';
import { parseId } from './edit';
import { CONTENT_ROOT, loadFamilies, loadStatus, statusOf } from './load';

/*
 * Drafting is done offline, one slot per call, as structured output, and a
 * human edits and approves every snippet. Nothing here runs when a visitor
 * uses the site: live model text would differ on refresh, cost scales with
 * users times days, and models invent rules.
 */

export const DRAFT_MODEL = 'claude-sonnet-5-5';

export type DraftRequest = {
  id: string;
  model: string;
  system: string;
  user: string;
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
  budget: readonly [number, number];
  /** The id the reply must carry, when it differs from the bank id (cautions use the brief's format). */
  expectId?: string;
};

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

/** The banned list, as readable words, straight from the lint rules. */
export function bannedList(): string {
  return RULES.map((g) => `${g.id}: ${g.patterns.map((p) => p.source.replace(/\\b/g, '').replace(/\\/g, '')).join(', ')}`).join('\n');
}

function describeSlot(id: string): { family: string; keys: string[]; variant?: number; layer: string; facet?: string } {
  const parsed = parseId(id);
  if (!parsed) throw new Error(`Unknown snippet id: ${id}`);
  const facetAxis = parsed.family.axes.length > 1 ? parsed.keys[parsed.keys.length - 1] : undefined;
  return { family: parsed.family.id, keys: parsed.keys, variant: parsed.variant, layer: parsed.family.layer, facet: facetAxis };
}

/**
 * The prompt carries the meaning-sheet entry, a word budget, the tone rules,
 * the banned list and three approved examples (or, before any are approved,
 * three existing snippets from the same family).
 */
export function buildDraftRequest(id: string, contentRoot = CONTENT_ROOT): DraftRequest {
  const slot = describeSlot(id);
  const parsed = parseId(id)!;
  if (parsed.family.caution) {
    const c = buildCautionRequest(id, contentRoot);
    return { id, model: DRAFT_MODEL, system: c.system, user: c.user, tool: c.tool, budget: parsed.family.words, expectId: c.expectId };
  }
  const loaded = loadFamilies(join(contentRoot, 'data')).find((l) => l.family.id === slot.family);
  const status = loadStatus(join(contentRoot, 'status.json'));
  const siblings = (loaded?.snippets ?? []).filter((s) => s.id !== id);
  const approved = siblings.filter((s) => statusOf(status, s.id) === 'approved');
  const examples = [...approved, ...siblings].slice(0, 3);

  const numbers = slot.keys.filter((k) => /^\d+$/.test(k));
  const sheets = numbers
    .map((n) => readIfExists(join(contentRoot, 'meaning-sheets', `${n}.md`)))
    .filter(Boolean)
    .join('\n---\n');
  const [min, max] = parsed.family.words;
  const voice = readIfExists(join(contentRoot, 'voice-guide.md'));

  const system = [
    'You draft short pieces of reflective numerology copy for a website. A human editor reviews every piece.',
    'Numerology here is a symbolic tradition offered for reflection and fun. Never predict, never claim certainty.',
    '',
    voice,
    '',
    'Banned and flagged words (the lint fails the draft if any appear):',
    bannedList(),
  ].join('\n');

  const user = [
    `Write the text for the slot ${id}.`,
    `Layer: ${slot.layer}. Family: ${slot.family}. Keys: ${slot.keys.join(' / ')}${slot.variant ? `. This is variant ${slot.variant}: make it clearly different from the others.` : '.'}`,
    `Length: ${min} to ${max} words.`,
    parsed.family.question && slot.keys[parsed.family.question.axis] === parsed.family.question.value
      ? 'This snippet ends the reading, so it must end on a reflection question.'
      : '',
    '',
    'Meaning sheet for the number or numbers involved:',
    sheets || '(none for this slot)',
    '',
    'Examples from the same family, for voice and length:',
    ...examples.map((e) => `- (${e.id}, ${wordCount(e.text)} words) ${e.text}`),
    '',
    'Return the result with the submit_snippet tool.',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  return {
    id,
    model: DRAFT_MODEL,
    system,
    user,
    budget: parsed.family.words,
    tool: {
      name: 'submit_snippet',
      description: 'Submit the drafted snippet.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'layer', 'key', 'facet', 'variant', 'text'],
        properties: {
          id: { type: 'string', const: id },
          layer: { type: 'string', const: slot.layer },
          key: { type: 'string', description: 'The number or key this snippet is about.' },
          facet: { type: 'string', description: 'The section or facet name, or an empty string.' },
          variant: { type: 'integer', description: 'Variant number, or 0 when there are no variants.' },
          text: { type: 'string', description: `Plain text, ${min} to ${max} words.` },
        },
      },
    },
  };
}

export type DraftResult = { id: string; text: string; fields?: Record<string, string> };

type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

/** Calls the Messages API with a forced tool call. Used by the offline draft command only. */
export async function callClaude(request: DraftRequest, apiKey: string, fetchImpl: FetchLike = fetch as unknown as FetchLike): Promise<DraftResult> {
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: request.model,
      max_tokens: 1024,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
      tools: [request.tool],
      tool_choice: { type: 'tool', name: request.tool.name },
    }),
  });
  if (!response.ok) throw new Error(`The API answered ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as {
    content?: { type: string; input?: { id?: string; text?: string; label?: string; headline?: string; body?: string; link_to_theme?: string } }[];
  };
  const input = body.content?.find((c) => c.type === 'tool_use')?.input;
  if (input?.id !== (request.expectId ?? request.id)) throw new Error('The reply did not contain the requested snippet.');
  if (request.expectId) {
    // A caution: label, headline, body and the shadow trait it comes from.
    if (!input?.label || !input.headline || !input.body || !input.link_to_theme) throw new Error('The reply did not contain the requested snippet.');
    return {
      id: request.id,
      text: input.body.trim(),
      fields: { label: input.label, headline: input.headline.trim(), body: input.body.trim(), link: input.link_to_theme.trim() },
    };
  }
  if (!input?.text) throw new Error('The reply did not contain the requested snippet.');
  return { id: request.id, text: input.text.trim() };
}
