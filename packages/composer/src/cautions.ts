import { CAUTION_FACETS, CAUTION_SAFETY_LINES, CAUTION_VARIANTS, type CautionFacet, type CautionLabel, type CautionTable } from '@numerology/content';

/** One caution, ready to show. `source` is the snippet id, for the snapshot's blast radius. */
export type CautionCard = {
  facet: CautionFacet;
  label: CautionLabel;
  headline: string;
  body: string;
  /** The shadow trait the caution comes from, as a short clause. */
  link: string;
  source: string;
};

/**
 * The same two lines on every caution card, whatever the number. They are not
 * generated and they are never tied to a number.
 */
export const SAFETY_LINES: readonly string[] = CAUTION_SAFETY_LINES;

const FACET_COUNT = CAUTION_FACETS.length;
/** Five facets by six variants: a day caution repeats only after 30 occurrences of the same number. */
export const DAY_CAUTION_LOOP = FACET_COUNT * CAUTION_VARIANTS;

/**
 * Which facet and variant a day gets. `index` counts earlier days with the same
 * personal day number, so the facet rotates every occurrence and the variant
 * moves on every fifth, and nothing repeats for about nine months.
 */
export function dayCautionPick(index: number): { facet: CautionFacet; variant: number } {
  const k = ((index % DAY_CAUTION_LOOP) + DAY_CAUTION_LOOP) % DAY_CAUTION_LOOP;
  const f = k % FACET_COUNT;
  // Each facet starts one variant further along, so five days in a row do not all carry the same label.
  // For a fixed facet the variant still steps through all six, so all 30 pairs appear once per loop.
  return { facet: CAUTION_FACETS[f] as CautionFacet, variant: (Math.floor(k / FACET_COUNT) + f) % CAUTION_VARIANTS };
}

function card(
  table: CautionTable | undefined,
  layer: 'year' | 'month' | 'day',
  number: number,
  facet: CautionFacet,
  variant: number,
): CautionCard | undefined {
  const list = table?.[String(number)]?.[facet];
  const entry = list?.[variant];
  if (!entry) return undefined;
  return { facet, ...entry, source: `${layer}.caution.${number}.${facet}.v${variant + 1}` };
}

/** The one caution for a day. */
export function composeDayCaution(table: CautionTable | undefined, personalDay: number, index: number): CautionCard | undefined {
  const { facet, variant } = dayCautionPick(index);
  return card(table, 'day', personalDay, facet, variant);
}

/**
 * All five facets for a year or a month. The variant rotates with the count of
 * earlier occurrences of the same number, and each facet starts one step
 * further along, so the five cards show a mix of labels, not five of a kind.
 */
export function composeCautions(
  table: CautionTable | undefined,
  layer: 'year' | 'month',
  number: number,
  index: number,
): CautionCard[] {
  return CAUTION_FACETS.map((facet, f) => {
    const variant = (((index + f) % CAUTION_VARIANTS) + CAUTION_VARIANTS) % CAUTION_VARIANTS;
    return card(table, layer, number, facet, variant);
  }).filter((c): c is CautionCard => c !== undefined);
}
