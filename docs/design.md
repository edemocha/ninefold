# Design: nine numbers, nine colours

The product shows its working, and the design shows the numbers. Each of the nine numbers owns one colour and keeps it on every screen, so colour on this site always means a number. Everything else is a white page and one ink. This page records the rules so the look does not drift into a template.

## What it replaced, and why

1. A lavender template: soft gradient wash, a violet italic phrase in the headline, white shadowed cards, pastel tints and staggered fade-ups. Nothing in it came from the product.
2. A printed worksheet: grey paper, ink, ruled lines, one yellow mark and one red mark, no colour at all for the numbers. It was honest, but the owner found it joyless and wanted colour.

The current look keeps what was right about both: colour is not decoration. It is a system with one meaning, and it is checked by tests.

## The rules

| | Rule |
| --- | --- |
| Page | White, `#ffffff`. Secondary surface `#f2f3f8` (a cool grey, never cream). No gradients, no textures, no background images. |
| Ink | One blue-black. Text `#15152b`, headings `#0b0b1e`, secondary `#50536b`. |
| The nine colours | Each number has three tones. **Bright** is a flat fill with ink on it (`--b1` to `--b9`). **Deep** is for text, strokes and fills with white text (`--d1` to `--d9`). **Tint** is a pale background that ink or the deep tone sits on (`--n1` to `--n9`). `.hue-N` points `bg-hue-b`, `bg-hue-n` and `text-hue-d` at one number. A master number takes the colour of its root: 11 is a 2, 22 a 4, 33 a 6. |
| Where colour appears | Only where a number does: tiles, rings, chart bands, calendar cells, the nine-colour logo and the bar above the footer. Pages describing a feature (the home cards) borrow the palette for variety but never put a colour on a number that is not its own. |
| Current | Marked with ink, never with a colour that could be a number: the page tab is a solid ink pill, today is a dark 3px frame, the current period in a chart is its bright fill with a heavy ink outline, the current row in a table is ink. |
| Two people | Told apart by position and a label (you on the left, them on the right), never by a colour that means something else. |
| Pairs are not ranked | In the pair grid every cell is the same grey. Colour appears only on the row and column headings, where it names the number. A test checks that all 81 cells look alike. |
| Shape | One rule. Things you act on (buttons, tabs, chips, links to a page) are pills. Containers are soft: panels 36px, cards 28px, tiles 18 to 22px. Fields are 14px. Nothing is square. |
| Depth | None. No shadows. Separation is by fill. |
| Type | **Bricolage Grotesque** for headings and the big numerals, set heavy and tight. **Geist** for everything you read. **Geist Mono** for the working (sums, dates, convention tags). No serif. Figures are lining. |
| Icons | Phosphor, bold weight, one set. No hand-drawn icons. The logo is the nine colours as a 3 by 3 block. |
| Motion | Hover lift on tiles (3px), a 1px press on buttons, colour changes in 140ms. No entrance animation. `prefers-reduced-motion` turns the lift off. |
| Copy | Plain. No dashes in visible text, no "Elevate" or "Seamless". The headline marks one phrase like a highlighter stroke, in the same face. |
| Home | Headline over two lines, the form beside a real worked example (17 June 1985 gives life path 1, each result chip in its own colour), the nine tiles, a bento of what it works out, an honest note. |

## Contrast

Every pair is computed, not eyeballed, and `tests/e2e/theme.spec.ts` recomputes them on every run:

- heading ink on a bright fill: 8.4 (number 9) to 14.6 (number 3)
- white on a deep tone: 5.2 to 5.5
- a deep tone on its own tint: 4.7 to 4.8
- a deep tone on white: 5.2 to 5.5
- body ink on white 17.9, secondary text on white 7.5 and on the grey surface 6.8, links and hover blue (`#3065cc`) on white 5.4, control borders (`#7f8399`) 3.7 on white

axe runs on every screen in the end-to-end suite.

## How it is held in place

`tests/e2e/theme.spec.ts` fails if: the page is not light and white; the nine colours are not nine different colours or any text pair drops under 4.5; a page gains a gradient, a shadow or an entrance animation; a button is not a pill or a container is square; the three type families change; a number changes colour between screens (index, its own page, the reading); the current tab or today stop being ink; or the pair grid starts to rank pairs. `a11y.spec.ts` checks nothing animates on load.

## Where it lives

- Tokens, components and print rules: `apps/web/src/app/globals.css` (one file)
- Fonts: `apps/web/src/app/layout.tsx` (`next/font`, downloaded at build time and served from this site, so a visit calls no font host)
- Icons and the logo: `apps/web/src/components/icon.tsx`; the nine-colour bar: `spectrum.tsx`
- The share image uses the same colours and fonts: `apps/web/src/lib/share-image.ts` (it reads the tokens from the page, so there is one source)

## Changing it

To change a number's colour, edit its three tokens in `globals.css` (`--bN`, `--dN`, `--nN`) and rerun the theme spec: it recomputes the contrast and fails if a pair drops under AA. The share image and every chart pick the change up by themselves.
