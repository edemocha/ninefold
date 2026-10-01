import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAUTION_LABELS, CAUTION_SAFETY_LINES } from '@numerology/content';
import { parseId } from './edit';
import { loadFamilies } from './load';

/*
 * The drafting prompt for caution snippets. It is the brief from the product
 * owner, filled in per slot: a short, practical nudge about a behavior to
 * watch, never a forecast. The id the model returns uses the owner's format,
 * {layer}-{number}-{facet}-caution-{variant}, which maps one to one onto the
 * bank's own ids (for example day.caution.8.energy.v1).
 */

export const CAUTION_SYSTEM = `You are writing "caution" snippets for a numerology website. Numerology is
presented as a symbolic tradition for reflection, not prediction. Your job is
to turn a number's theme into a short, practical nudge about a behavior to
watch, never a forecast of what will happen.

HOW TO WRITE IT
- Start from the number's SHADOW side and name a behavior the reader controls
  (impulse buys, overcommitting, snapping at people, skipping rest, avoiding a talk).
- Write it as a tendency: "tends to", "you may notice", "easy to slip into".
- Give one concrete small action: "sleep on it", "set a stop time", "say it plainly".
- "AVOID" applies only to a behavior, never to a date or an activity in general.
  Good: "AVOID deciding big things while angry". Bad: "AVOID travel this month".
- Headline: at most 8 words. Body: at most 35 words. The label is shown beside the headline, so do not repeat it.
- link_to_theme: one clause naming the shadow trait this comes from.

HARD RULES (any violation means rewrite)
- Never mention or imply death, injury, accidents, illness, pregnancy, surgery
  or disasters, even as a possibility.
- Never say anything WILL happen. Banned words: will, guaranteed, destined, fate,
  doomed, cursed, danger, deadly, fatal, warning sign, bad luck.
- No money moves (sell, invest, borrow), no legal outcomes, no relationship
  verdicts (leave, marry, divorce), no medical or diet advice. No calorie or
  food-amount guidance; "eating" may only appear as "notice if you reach for
  comfort food when stressed", nothing prescriptive. "Buy" and "purchase" are
  allowed only in the money facet, as a nudge to pause, never a tip about what to buy.
- No fear hooks or urgency. The reader should feel more in control, not scared.
- Do not repeat another variant's headline or action.

SAFETY LINES (separate, fixed, not generated per number)
These show on every caution card no matter the number, and must never be tied to a number:
${CAUTION_SAFETY_LINES.map((l) => `"${l}"`).join('\n')}

EXAMPLES
number 5, year, money, GO EASY ON:
 headline: "Big buys on a whim"
 body: "A 5 year pulls toward novelty and quick exits. Before any purchase over
 your usual, wait 48 hours and see if you still want it."
number 8, day, energy, WATCH OUT:
 headline: "Pushing past your limit"
 body: "8 days lean on effort and control. Pick a stop time this morning and
 keep it, even if the list isn't done."
REJECTED: "AVOID driving today, your 4 energy brings accidents." (predicts injury)`;

/** The brief's own id format. */
export function cautionDraftId(layer: string, number: string, facet: string, variant: number): string {
  return `${layer}-${number}-${facet}-caution-${variant}`;
}

export type CautionRequest = {
  /** The bank id this fills, e.g. day.caution.8.energy.v1. */
  id: string;
  /** The id the model must return, in the brief's format. */
  expectId: string;
  system: string;
  user: string;
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
};

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export function buildCautionRequest(id: string, contentRoot: string): CautionRequest {
  const parsed = parseId(id);
  if (!parsed || !parsed.family.caution || parsed.variant === undefined) throw new Error(`${id} is not a caution slot`);
  const [number, facet] = parsed.keys as [string, string];
  const layer = parsed.family.layer;
  const expectId = cautionDraftId(layer, number, facet, parsed.variant);
  const sheet = readIfExists(join(contentRoot, 'meaning-sheets', `${number}.md`));

  // The other variants of this slot, so the model does not repeat a headline or an action.
  const loaded = loadFamilies(join(contentRoot, 'data')).find((l) => l.family.id === parsed.family.id);
  const others = (loaded?.snippets ?? []).filter(
    (s) => s.keys[0] === number && s.keys[1] === facet && s.variant !== parsed.variant && s.fields,
  );

  const user = [
    'INPUT',
    `- layer: ${layer}`,
    `- number: ${number}`,
    `- theme sheet for this number:\n${sheet || '(no sheet found)'}`,
    `- facet: ${facet}`,
    `- variant: ${parsed.variant}`,
    '',
    others.length > 0 ? 'Already written for this number, layer and facet (do not repeat a headline or an action):' : '',
    ...others.map((s) => `- [${s.fields?.label}] ${s.fields?.headline}: ${s.fields?.body}`),
    '',
    `Return JSON only, with id "${expectId}", using the submit_caution tool.`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  return {
    id,
    expectId,
    system: CAUTION_SYSTEM,
    user,
    tool: {
      name: 'submit_caution',
      description: 'Submit the drafted caution.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'label', 'headline', 'body', 'link_to_theme'],
        properties: {
          id: { type: 'string', const: expectId },
          label: { type: 'string', enum: [...CAUTION_LABELS] },
          headline: { type: 'string', description: 'At most 8 words.' },
          body: { type: 'string', description: 'At most 35 words.' },
          link_to_theme: { type: 'string', description: 'One clause naming the shadow trait this comes from.' },
        },
      },
    },
  };
}
