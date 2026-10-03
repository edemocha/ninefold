# The Chaldean tradition, and the shadows in detail

The request was to use the ancient numerology, which is Chaldean, and to write the shadows in great detail. This page records what that means in the code, the calls that were made, and what a person still has to check.

## What shipped

- **Chaldean is the default tradition.** The form starts in it, and Pythagorean is one click away at the top (a radio pair, so it works with the keyboard and a screen reader). The choice sets the letter table and the three switches that belong to it; every switch is still under Advanced.
- **Compound numbers, 10 to 52.** Each has a traditional image, a reading, a shadow side and a practice, in the reading and on a public page at `/chaldean/N`.
- **Shadows in eleven parts** for every number, 1 to 9 and the three masters, in the reading (a Shadow tab), on every number page and, for each compound, on its own page.
- **The planets** Cheiro gives each digit, and an honest account of where the tradition comes from.

## The calls that were made

| Question | Call |
| --- | --- |
| Default or option? | **Default.** "Use the Chaldean" was read as what the project is, not a toggle in a menu. The old default is `PYTHAGOREAN_CONVENTIONS`, and the engine and composer tests that were written against it now name it explicitly. |
| What does the tradition set? | Letter table (eight groups, no 9), whole-name totals, rule D for dates (every digit in one flat sum), no masters in names, dates, pinnacles, maturity or cycles. Maturity, pinnacles and cycles keep their arithmetic; only the masters go. |
| Masters | **None.** In the tradition 11, 22 and 33 are compounds that reduce to 2, 4 and 6. The Pythagorean master notes stay in Pythagorean, and the pair pages still read a master through its root. |
| Karmic debt | Flagged only in Pythagorean. In Chaldean 13, 14, 16 and 19 are compounds with their own readings, and flagging them twice would mix the traditions. |
| Totals above 52 | Read at the next total down: 64 reads as 10, 99 as 18. A total of 53 reduces to 8, a single digit, so it has no compound. |
| The name that is read | The tradition reads the name a person is known by. If the visitor gave one, the reading starts on it (the existing "Name you use now" switch), and the form says why. |
| The name grid | Eight numbers, because no letter is worth 9. The 9 is shown as held back, karmic lessons and hidden passion run over 1 to 8, and subconscious self is not shown (it is "9 minus the missing" and a Chaldean name cannot carry a 9). |
| Numbers that Cheiro does not give an image | **Say so.** Cheiro wrote that many compounds carry the reading of an earlier one (33 like 24, 34 like 25, 49 like 31, 52 like 43). Those pages are titled "The Echo of N", say plainly that the tradition gives them no image of their own, link the original, and add the shade their two digits give. Nothing is invented to fill a gap. |
| Fear in the tradition | Many of the old readings are written in fear (the tower, fatality, ruin). The site's voice rules stand, so each shadow is a pattern that protects something and costs something, followed by a practice. The titles keep the traditional images; the text does not forecast. |
| Honesty about age | "Chaldean" points to Babylon, but no ancient text sets the system out. The version used today was written down in the early 1900s (Cheiro, Sepharial), and the pages say so. |

## Where it lives

| What | Where |
| --- | --- |
| Letter table, rule D, compound detection, no-masters switch | `packages/engine/src/names.ts`, `dates.ts`, `profile.ts`, `reduce.ts` |
| Tradition presets, `withTradition`, the chips | `packages/engine/src/conventions.ts` |
| Titles, echoes, planets, composing the compound and the shadow | `packages/composer/src/chaldean.ts` (and `composeNumber` in `life.ts`) |
| The text | `packages/content/data/life/compound.json`, `shadow.json`, `shadowLens.json`, `planets.json`; the slots are in `packages/content/src/manifest.ts` |
| The form, the Shadow tab, the compound and shadow cards | `apps/web/src/components/profile-form.tsx`, `app/reading/shadow/page.tsx`, `components/compound-card.tsx`, `shadow-detail.tsx` |
| The public pages | `apps/web/src/app/chaldean/page.tsx`, `chaldean/[n]/page.tsx`, and the shadow and compound sections of `numbers/[n]/page.tsx` |

## Writing rules for the new text

The new families answer to the same lint as the rest of the bank: no certainty words, fear hooks, health, money, legal or relationship verdicts, a word budget, and a reading level. Beyond that:

1. **A shadow is a tendency, not a flaw and not a forecast.** Name what it protects first, then what it costs, then what loosens it.
2. **Eleven parts, in order:** where it comes from, how it sounds inside (in the person's own words), at work, with people close to you, with time and energy, under pressure, early signals, what feeds it, what loosens it, the gift inside it, and a seven-day practice that ends on a question.
3. **A compound has three:** what the tradition says (the image first), the shadow side, and working with it (a question to end on).
4. **An echo says it is an echo**, in its first sentence.
5. **Name no relationship type** and rule on no one. The compound texts talk about "a close tie" and "people who rely on you".

## What is checked

- **Engine.** Letters, the 9 held back, compounds (including above 52), rule D, masters off, maturity, chips, presets (`packages/engine/test/chaldean.test.ts`), and the independent reference in `tests/reference` agreeing on names, compounds, grids and dates for 200 random profiles.
- **Content.** Every one of the 276 slots filled, lint clean, every compound's working and every shadow's practice ending on a question, at least 500 words of shadow for every number, and every echo pointing at a number that reads for itself.
- **The browser.** The default, the compound on every core number, the working, the number page, the name grid, the Shadow tab (one reading for each different number), the used name, the address carrying the tradition and no name or date, and all 43 compound pages; axe on every new screen.

## Still for a person

- Approve the 276 drafts and this page's rules in the voice guide.
- **Check the compound readings against a printed Cheiro.** Published sources differ on several of them (particularly 28, 29 and the numbers above 32), and this site follows the list in Cheiro's table as summarized by modern editors.
- Decide whether the Chaldean pages should cite sources by edition.
- The planets follow Cheiro's table (Uranus for 4, Neptune for 7). Some practitioners use the nodes of the Moon instead; the page says so.
