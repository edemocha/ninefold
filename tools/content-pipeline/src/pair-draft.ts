import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mustEndOnQuestion, PAIR_SAFETY_LINES, wordCount, type Family } from '@numerology/content';
import { parseId } from './edit';
import { loadFamilies, loadStatus, statusOf } from './load';

/*
 * The drafting prompt for Between us. A pair is two numbers, not two people, so
 * the brief is stricter than the main bank's: no scores, no verdicts, no
 * relationship types, no "he" or "she". A human edits and approves every piece.
 */

export const PAIR_SYSTEM = `You are drafting short pieces of text for "Between us", a feature of a numerology
website that sets two people's numbers side by side. Numerology is a symbolic
tradition offered for reflection and conversation, never prediction. The text is
about what two NUMBERS tend to bring and where they meet. It never describes or
judges two people.

HOW TO WRITE IT
- Write about "a 3 and a 7", "the two of you", "each of you". It must read right
  for any two people: friends, family, colleagues, partners. Never name a
  relationship type, and never use "he", "she", "him" or "her".
- Describe each number from the meaning sheets, then where the two tend to meet.
  Give a concrete behavior, not a flattering adjective. Real observations have a
  cost as well as a benefit.
- Differences are "where each may stretch", never "problems". Say what each
  side could try, in plain words.
- Hedge: "tends to", "may", "can", "often". No certainty words, no predictions
  about what two people will feel or do.
- Talk prompts are questions each person answers ABOUT THEMSELVES or about what
  they would like to try ("What do you need before...?"), never about what the
  other person is doing wrong, never "why do you always...".
- Plain words, short sentences, reading grade under 10. The text reads the same
  in either order, so never refer to "the first" or "the second" person.

HARD RULES (any violation means rewrite)
- No score, rating, percentage, ranking or "match". No "compatible" or
  "incompatible". No "soulmate", "twin flame", "meant to be", "perfect" or "ideal".
- Never say whether two people should begin, stay together or part. No marriage,
  divorce, break up, cheating or affairs.
- Never label a person (narcissist, controlling, abusive, toxic). Never predict
  attraction, falling in love or a "spark".
- No health, money, legal or medical content.
- Master numbers (11, 22, 33) are themes, not ranks: never say they make a
  pair special, rarer or better.

SAFETY LINES (separate, fixed, shown on every screen and never tied to a pair)
${PAIR_SAFETY_LINES.map((l) => `"${l}"`).join('\n')}`;

function readIfExists(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export type PairRequest = {
  system: string;
  user: string;
  tool: { name: string; description: string; input_schema: Record<string, unknown> };
};

const TYPE_QUESTION =
  'One question for the two people to answer about themselves, written for this kind of relationship. It never rules on the relationship. It must end on a question.';

/** What each section is for, so a draft is written to the right job. */
const SECTION_BRIEF: Record<string, string> = {
  meet: 'Where these two numbers tend to meet easily: shared ground and what each can offer the other.',
  stretch: 'Where each number may need to stretch toward the other. Frame friction as growth. Say what each side could try.',
  talk: 'Two or three questions the two people can answer about themselves and about what they would like to try. It must end on a question.',
  meaning: 'What it means that two cycles sit this many steps apart on the nine-number cycle. Plain arithmetic first, then what it can mean for two people.',
  use: 'One practical way two people can use the gap: share experience, plan around it, be curious. Not advice about the relationship.',
  q1: TYPE_QUESTION,
  q2: TYPE_QUESTION,
  q3: TYPE_QUESTION,
  q4: TYPE_QUESTION,
};

export function buildPairRequest(id: string, bannedList: string, contentRoot: string): PairRequest {
  const parsed = parseId(id);
  if (!parsed || parsed.family.layer !== 'pair') throw new Error(`${id} is not a Between us slot`);
  const family: Family = parsed.family;
  const [min, max] = family.words;
  const [first, section] = parsed.keys as [string, string | undefined];

  const numbers =
    family.id === 'pair.core' || family.id === 'pair.moment'
      ? first.split('-')
      : family.id === 'pair.master' && /^\d+$/.test(first)
        ? [first]
        : [];
  const sheets = numbers
    .map((n) => readIfExists(join(contentRoot, 'meaning-sheets', `${n}.md`)))
    .filter(Boolean)
    .join('\n---\n');
  const addendum = readIfExists(join(contentRoot, 'meaning-sheets', 'pairs.md'));
  const voice = readIfExists(join(contentRoot, 'voice-guide.md'));

  const loaded = loadFamilies(join(contentRoot, 'data')).find((l) => l.family.id === family.id);
  const status = loadStatus(join(contentRoot, 'status.json'));
  const siblings = (loaded?.snippets ?? []).filter((s) => s.id !== id);
  const examples = [...siblings.filter((s) => statusOf(status, s.id) === 'approved'), ...siblings].slice(0, 3);

  const subject =
    family.id === 'pair.core'
      ? `the pair of numbers ${first.replace('-', ' and ')}, section "${section}"`
      : family.id === 'pair.master'
        ? `the note for ${first === 'both' ? 'two master numbers' : `a master ${first}`} in a pair`
        : family.id === 'pair.moment'
          ? `the bridge line for two personal-day numbers, ${first.replace('-', ' and ')}, on the same date: start "A day ${first.split('-')[0]} beside a day ${first.split('-')[1]}:" (or "Two day ${first.split('-')[0]}s on the same date:" when they are the same), say what the two day themes tend to bring together, and give one small thing the two of you could try. Not a question, and not a prediction about the day`
          : family.id === 'pair.lens'
          ? `the one-line frame for reading a pair through ${first === 'soulUrge' ? 'soul urge' : first}: what that number is about, in plain words, and that the pair text below is read as a prompt, not a verdict`
          : family.id === 'pair.type'
            ? `question ${section?.replace('q', '')} of 4 for two people who are ${first === 'couple' ? 'a couple' : first}`
            : `a gap of ${first} ${first === '1' ? 'step' : 'steps'} between two cycles (${first === '0' ? 'the same number' : 'the shorter way round the nine'}), section "${section}"`;

  const user = [
    `Write the text for the slot ${id}: ${subject}.`,
    `Length: ${min} to ${max} words.`,
    section && SECTION_BRIEF[section] ? `Job of this section: ${SECTION_BRIEF[section]}` : '',
    mustEndOnQuestion(family, parsed.keys) ? 'This snippet must end on a question.' : '',
    '',
    'Notes on writing about pairs:',
    addendum || '(no pair notes yet)',
    '',
    'Meaning sheets for the numbers involved:',
    sheets || '(none for this slot)',
    '',
    'Examples from the same family, for voice and length:',
    ...examples.map((e) => `- (${e.id}, ${wordCount(e.text)} words) ${e.text}`),
    '',
    'Return the result with the submit_snippet tool.',
  ].join('\n');

  const system = [PAIR_SYSTEM, '', voice, '', 'Banned and flagged words (the lint fails the draft if any appear):', bannedList].join('\n');

  return {
    system,
    user,
    tool: {
      name: 'submit_snippet',
      description: 'Submit the drafted snippet.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'layer', 'key', 'facet', 'variant', 'text'],
        properties: {
          id: { type: 'string', const: id },
          layer: { type: 'string', const: 'pair' },
          key: { type: 'string', description: 'The pair, overlay or distance this snippet is about.' },
          facet: { type: 'string', description: 'The section name, or an empty string.' },
          variant: { type: 'integer', description: 'Always 0: pair snippets have no variants.' },
          text: { type: 'string', description: `Plain text, ${min} to ${max} words.` },
        },
      },
    },
  };
}
