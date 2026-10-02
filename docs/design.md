# Design: a printed worksheet

The one idea in this product is that it **shows its working**. The design follows from that: the site is typeset like a worksheet or an almanac, not styled like an app. This page records the rules, so the look does not drift back to a template.

## What it replaced, and why

The first look was the stock template: a lavender wash with soft radial gradients, a violet italic phrase in the headline, white rounded cards with a tinted shadow, a checkmark bullet list, pill chips, pastel candy tints for the nine numbers, staggered fade-up entrances, and a mono uppercase label over every section. Nothing in it came from the product. It is gone.

## The rules

| | Rule |
| --- | --- |
| Surface | One flat paper, `#f3f3ee`, a warm-neutral grey (not cream, not tinted). No gradients, no blurs, no textures. |
| Ink | Near-black. Body `#1b1b18`, headings `#0d0d0b`, secondary `#4a4a44`. Links are underlined or set in ink, never a brand colour. |
| Structure | Ruled lines. A heavy 2px ink rule under the masthead, over each major section and over the footer; hairlines between rows. A boxed slip (1px ink) is for a thing you act on; a hairline box is for what sits beside the text. |
| Marks | Two, each with a job. **Highlighter yellow** `#ffe83d` marks what is *current*: the tab you are on, today, the period you are in, the result of a calculation. **Signal red** `#c62d0c` marks *the other person* when two people sit side by side, and errors. Nothing else is coloured. |
| The nine numbers | Told apart by their digit, never by a colour. The `--n1`..`--n9` and `--d1`..`--d9` tokens still exist so charts resolve, but they are one value. |
| Corners and depth | Square. No shadows. `rounded-full` is kept only for true circles. |
| Motion | None on load. No entrance animation, no hover growth. Colour changes only, in 120ms. Loading placeholders may pulse. |
| Type | IBM Plex, three cuts. **Serif** for headings and for reading text (`.reading`), set at a book's measure (62ch). **Mono** for the working: sums, dates, labels, tags. **Sans** for controls and short interface text. Figures are lining. |
| Tags | A small label in a hard box, never a pill. |
| Icons | Used sparingly, only where they carry meaning (a lock, an arrow, a plus). No decorative icons, no icon-in-a-circle. |
| Copy | Plain. No "Elevate", no "Seamless", no section called "Straight talk". The product's claim is demonstrated, not announced: the home page opens with a real calculation. |

## Contrast

Every text pair is computed, not eyeballed:

- ink on paper 16.9, secondary on paper 8.0, signal red on paper 5.0
- white on signal red 5.6, ink on highlighter 15.1
- control borders (`#8a8a80`) 3.1 against paper

Signal red text is never set on the highlighter (4.46, just under AA). axe runs on every screen in the end-to-end suite.

## How it is held in place

`tests/e2e/theme.spec.ts` fails if any page gains a gradient or background image, a box shadow, a rounded corner (other than a true circle) or an entrance animation; if a number picks up a colour of its own; if the highlighter or signal red stop meaning what they mean; or if the three type cuts change. `a11y.spec.ts` checks nothing animates on load.

## Where it lives

- Tokens, components and print rules: `apps/web/src/app/globals.css` (one file)
- Fonts: `apps/web/src/app/layout.tsx` (`next/font`, downloaded at build time and served from this site)
- The share image uses the same paper, ink and rules: `apps/web/src/lib/share-image.ts`

## Changing it

To bring back a colour for the numbers, change the `--n` and `--d` tokens in `globals.css`; every chart and cell reads them. To change the two marks, change `--mark` and `--accent`, then rerun `node` against the contrast table at the top of `globals.css` before shipping.
