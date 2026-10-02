# Ninefold: numerology that shows its math

A numerology website built from `Numerology web implementation plan.pdf`. A pure TypeScript engine and a static content bank run **in the visitor's browser**, and a composer stitches them into life, year, month and day readings. The server never sees a name or a birth date.

Built by Danial Adam. The credit shows in the site footer, at the end of the printed year report and on the share image; it lives in one constant, `CREDIT` in `apps/web/src/lib/site.ts`.

"Ninefold" is a placeholder name. It lives in `apps/web/src/lib/site.ts` and `apps/web/messages/en.json`.

## Run it

```bash
npm install
npm run dev            # content is released first, then Next.js dev server
npm run verify         # typecheck, unit tests, content lint, production build, end-to-end tests
```

| Command | What it does |
| --- | --- |
| `npm test` | Vitest: golden vectors, 200-profile cross-check, properties, composer, pipeline, web helpers, the plan's flip rates |
| `npm run content:lint` | The guardrails: banned claims, certainty words, fear hooks, length, reading level, near-duplicates, reflection prompts, gaps |
| `npm run content:release` | Lint, validate against the JSON Schemas, write versioned static layers to `apps/web/public/content/` |
| `npm run content:snapshot` / `content:diff` | Save the 30-profile by 20-date composed readings; show which snippets changed and how many readings they touch |
| `npm run content:gate -- --level 3` | Check a launch gate from the plan |
| `npm run content:gate -- --pair --level 2` | Check a Between us gate (P1 to P3) |
| `npm run content:draft -- <id> [--run]` | Offline drafting prompt; `--run` calls the API when `ANTHROPIC_API_KEY` is set |
| `npm run content:sheet -- export` / `import` | Review spreadsheet with draft, edited, approved statuses |
| `npm run build` | Release content, then build the static site into `apps/web/out` |
| `npm run e2e` | Playwright against the built site: flows, privacy, axe, CSP, time zones |

## Layout

```
packages/engine      pure TypeScript, no dependencies, dates as three integers
packages/content     manifest of every slot, JSON Schemas, guardrails, meaning sheets, voice guide, authored snippets
packages/composer    engine output + content + variant index -> reading objects
apps/web             Next.js (App Router), static export, Tailwind, hand-built SVG with d3 scales
tools/content-pipeline  lint, release, snapshot/diff, gates, draft, review sheet
tests/golden         the plan's test vectors as JSON
tests/reference      a second, independent implementation of the arithmetic
tests/e2e            Playwright
```

## Design

Nine numbers, nine colours. Each number owns one hue (a bright fill, a deep tone and a pale tint) and keeps it on every screen, so colour on this site always means a number. The rest is a white page and one blue-black ink. Bricolage Grotesque for headings and the big numerals, Geist for text, Geist Mono for the working, Phosphor icons. Controls are pills, containers are soft, and there are no gradients, shadows or entrance animation. The rules, the contrast figures and how they are held in place are in [docs/design.md](docs/design.md); `tests/e2e/theme.spec.ts` fails if a page drifts back to a template look.

## The engine

Every function returns its intermediate steps for the "why this number" panel. Every default sits behind a switch under Advanced, and every result shows a chip naming the convention in use.

- **Verified against the plan, not just written from it.** All nine golden vectors pass. The engine reproduces every flip rate the plan measured: life path over all 25,933 birthdays from 1940 to 2010 (3.9%, 13.8%, 10.5%, 13.8%, 9.3%, 17.5%, plus the 33 and 2 shares) and personal year over 366 birthdays times 21 years (4.5%, 9.1%, 9.7%, 9.8%, 9.4%, 10.1%). The variety claim also reproduces: the shortest gap between identical headlines is 40 days at 6 variants and 89 at 12. See `tests/flip-rates.test.ts`.
- **Second implementation.** `tests/reference` is written from the formula table without importing the engine. 200 random profiles across every convention agree on every output.
- **Dates** are three integers, never a `Date`. "Today" is the visitor's local calendar date and flips at local midnight, tested from UTC+14 to UTC-12.
- Pythagorean ships. A Chaldean letter table is built and tested (JOHN, DAVID, MICHAEL, SARAH) but not offered.

Two readings the plan left open, so you know what the code does:

- Per-part names reduce each part with 11, 22 and 33 kept, then add and reduce. This is the only reading under which DAVID is 22 and Amelia Rose Carter's soul urge is 6 (per part) or 33 (whole name), as the plan's vectors require. A consequence: Carter (29, then 11) makes Amelia's expression pass through 19, so it carries karmic debt 19/1.
- Date rules A and B can total 33 for a personal year (the plan's flip rates only reproduce if they do). It shows as an overtone note, with its own snippet.

## The content bank

2,308 snippets, 66,600 words, every slot filled, lint clean. The structure follows the plan (life 421, year 165, month 108, day 587: 1,281 snippets and 34,215 words) plus 810 cautions and 217 for Between us (see below). **Every snippet is a draft.** I wrote them from the meaning sheets and the voice guide, and the plan is explicit that a human edits and approves the text.

- The plan-sized part is about 37% of the plan's 92,600-word sizing. The plan's own argument is that detail means layers and visible math, not word count, so I filled every slot at a shorter length instead of leaving any empty. Raising a family's word budget in `packages/content/src/manifest.ts` and drafting longer text is a normal editorial pass.
- `meaning-sheets/` (one page per number) and `voice-guide.md` are drafts for the owner's approval. Per Gate 1, nothing further should be drafted until they are approved.
- Statuses live in `packages/content/status.json` (empty: all draft). Release defaults to allowing drafts; set `CONTENT_MIN_STATUS=approved` for launch.

Gate 3 fails today, correctly: 0 of 2,308 snippets are approved. The variety condition passes.

### Cautions

A caution is a short, practical nudge about a behavior to watch, never a forecast. There are 810: 3 layers (year, month, day) by 9 numbers by 5 facets (money, work, relationships, energy, mind) by 6 variants. Each has a label (WATCH OUT, GO EASY ON or AVOID), a headline of at most 8 words, a body of at most 35 words, and the shadow trait it comes from. They follow the product owner's brief, which is also the drafting prompt for these slots (`npm run content:draft -- day.caution.8.energy.v2`).

- The lint enforces the brief: a tendency in the wording, AVOID only for behaviors (never a date, trip or activity), unique headlines, and the hard rules (no death, injury, illness, pregnancy or disaster, no certainty words, no fear hooks, no calorie or diet advice, no legal or relationship verdicts, no selling, investing or borrowing).
- **One call that differs from the plan's lint:** the plan bans "buy" and "purchase" everywhere, but the brief's own example ("Big buys on a whim") uses both. They are now allowed in the money facet only, as a nudge to pause, and still banned in every other snippet. That is one entry in `packages/content/src/rules.ts` if you want it reversed.
- Two safety lines show on every caution card, whatever the number: "Never drive tired, upset or impaired, on any day." and "For health, money or legal decisions, talk to a qualified person, not a number." They are fixed text in `manifest.ts`, not in the bank, and a test checks that they are identical on different numbers and contain no digit.
- A day shows one caution (the facet rotates each time the same number comes round and the variant moves on every fifth, so none repeats for about nine months). A year or month shows five, one per facet.

### Between us

A tab in the reading that sets two people side by side. It works for any two people (friend, parent, colleague, someone you love) and it **never scores or rules on a pair**. The research and the plan behind it are in [docs/relationship-feature-plan.md](docs/relationship-feature-plan.md); phases 1 to 4 of that plan are built.

- **What the visitor adds:** a birth date and an optional nickname. No full name. It is held in memory next to the first person, and "Forget my details" clears both.
- **Life paths side by side.** Each person's life path with its arithmetic, each number's existing "relationships" text, then three pair sections: where you meet, where each may stretch, and questions to talk about. Text is about the *numbers* ("a 3 and a 7"), reads the same in either order, and names no relationship type.
- **Your two cycles.** Two people's personal year, month and day numbers sit a fixed number of steps apart, because the year, month and day terms cancel. The page shows that with a ring, the arithmetic, a nine-year table, and a short text for the gap (0 to 4 steps the shorter way round). Under birthday cycles the gap moves by one step between the two birthdays, and the page says so.
- **Verified, not assumed.** The gap rule is a property test (every day, all four date rules), is cross-checked against the independent reference implementation on 200 random pairs, and has hand-worked golden vectors in `tests/golden/pair.json`.
- **Over time (phase 2).** Four sections under the tab: Overview (the above), **Day by day**, **Month** and **Life stages**. Day by day sets each person's own personal day for any date side by side, with the ring showing both and the gap, and one **bridge line** for the two day numbers together (45 of them, one for each pair of numbers, the same words in either order, starting "A day 7 beside a day 8:" or "Two day 3s on the same date:"). Month shows both personal months, a calendar with both numbers on every date (each date opens both days), and the twelve months of the year at a glance. Life stages draws both people's pinnacles and challenges on one calendar-year axis, says where each person is now, and lists every period in a table. Apart from the bridge line, all of it is the main bank's own text for each person's own number, so these screens add no other text to approve, only labels and the gap sentence. Date, month and year being explored are kept in memory with the other explored dates, never in the address.
- **Names, kinds of relationship and a circle (phase 3).** All optional.
  - **Names.** If the other person's full name is given (Latin letters, kept in memory like everything else), a fifth section reads the **expression** and **soul urge** of the two of you as a pair, with the same pair text as the life paths under a one-line frame saying what each name number is about. The arithmetic shows its letters, as it does for yours; the name appears nowhere else, and never in an image, a link or a request. The section only exists once both names can be read.
  - **Kind of relationship.** A picker (no choice, friends, family, colleagues, a couple) that changes **only the four questions** shown on the Overview. It never changes what is said about the numbers, and "no choice" is the default.
  - **A circle.** You and up to four others, one selected at a time (a switch at the top). With two or more others a **Circle** section puts everyone's personal-year number on one ring and tabulates how many steps apart each pair sits. Any gap equals the two gaps going round, which a property test checks. It says nothing about a pair beyond where they sit; each pair view says the rest.
- **Public pair pages (phase 4).** Under **Two numbers** in the header: `/between` is a nine by nine grid (every cell a link, every cell alike, so it cannot read as a map of better and worse pairs), and `/between/3-7` and its 44 siblings are static pages, one per pair of single digits, smaller number first, so a pair is a page in only one order. A page gives each number's relationships text, the three pair sections, the master-number notes that apply, a short honest account of what it cannot tell you with a link to the research on the Method page, a grid to move to another pair, and a canonical link and description. They are in the sitemap (46 new entries), robots does not block them, and each number's page now links to its nine pairs. They carry no dates and no personal data.
- **A dates-only way in.** The index and every pair page have a form for two birth dates and an optional nickname, with no name, which builds the same in-memory profile and second person and opens Between us. It starts afresh if anyone was already entered in this tab. With no name the name numbers simply are not there (the Snapshot says so, and there is no Names section).
- **217 snippets** in a `pair` content layer, loaded only on this tab: 45 pairs of single digits by 3 sections, 4 master-number notes, 15 for the five gap distances, 2 name-lens frames, 45 bridge lines and 16 questions for the four kinds of relationship. They are drafts. The notes for writing them are `packages/content/meaning-sheets/pairs.md` and the "Between us" section of the voice guide.
- **A stricter lint, opt-in per family.** The pair families also ban scores and verdicts (compatible, match, soulmate, perfect, rating, percent), relationship types and gendered pronouns (partner, husband, he, she), labels for a person (narcissist, abusive) and predicted feelings (attracted, fall in love). The rest of the bank is not held to them. A rendered-page test checks the same words across 300 random pairs and in the browser.
- **Two fixed safety lines** on every Between us screen, outside the bank: numbers cannot say whether to begin, stay or leave, and what to do if someone feels unsafe.
- **Gates P1 to P3** (`npm run content:gate -- --pair --level N`): P2 needs every pair snippet owner-approved. The page is also meant to be shown to 5 to 8 people in pairs before launch, asking what it said about whether they are right for each other.

## Privacy, and how it is proved

- Nothing typed is stored: not in storage, cookies, IndexedDB or the address. A reload clears it, by design.
- The address fragment holds only conventions. The date, year and month being explored are kept in memory, not in the address, because a date someone explores could be their own birthday. (The privacy test caught exactly that, and it is fixed.)
- Everyone added on Between us is held exactly like the first person: never in storage, the address, a request, an export or the share image, which carries numbers only and never a nickname or a name. `tests/e2e/between.spec.ts` and `between-more.spec.ts` check that with distinctive names, nicknames and dates for two people added, and analytics stay off if anyone added is under 16.
- `tests/e2e/privacy.spec.ts` types a distinctive name and birth date, visits every screen and export, and fails the build if either appears in any request URL, header or body or in any browser storage. It also asserts every request goes to this origin.
- A Content-Security-Policy with `connect-src 'self'` (written by `apps/web/scripts/headers.mjs` for Cloudflare Pages/Netlify, Vercel and the test server) makes the browser itself refuse requests to other origins. `tests/e2e/csp.spec.ts` checks that, and that the whole app runs under it.
- Analytics are off unless `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set; they are cookieless, event-allowlisted, carry no properties, and stop for under-16s.
- Fonts are downloaded at build time and served from the site.

## Differences from the plan

- UI strings use a keyed `messages/en.json` and a tiny `t()` rather than `next-intl`. The keys are stable, so `next-intl` is a drop-in when a second language arrives.
- The day card puts the life-path overlay and life stage before the six facets, so every reading ends on the reflection prompt, as the guardrails require. The plan's sample put them after.
- `Link` prefetching is off: some static hosts do not serve Next's per-segment prefetch files.
- Between us is added. The plan listed compatibility as out of scope; this is not a compatibility score, and the guardrail of no relationship verdicts stands.
- `vitest.config.ts` leaves half the logical cores free, and the two wall-clock speed tests take the best of five runs, so heavy test files running beside them on a laptop do not make them flaky.
- The Next/Tailwind/Vitest versions are current as of this build (Next 16, Tailwind 4, Vitest 5, TypeScript 5.9).

## Not done, and needs a person

- **Approve the text** (Gate 2 and 3) and the meaning sheets and voice guide (Gate 1).
- **The six decisions** are set to the plan's defaults: global English, Pythagorean only, per-part names, you write the sheet and an LLM drafts, free with no accounts, English first. The audience decision (whether Malaysian Muslims are a target audience) is a business decision the code cannot make.
- **Legal review.** The privacy and terms pages say only what is true of this build. They are not legal advice. Check the US children threshold, any PDPA obligations if accounts are added, and fortune-telling laws before charging for anything.
- **Speed on a mid-range phone.** The composer builds a year of day cards in a few milliseconds on a desktop; the plan's target of 50 ms on a phone still needs measuring there (Gate 4).
- **A real host and domain** (`NEXT_PUBLIC_SITE_URL`), and a name. On Vercel, keep the project's Root Directory as `apps/web`: its `vercel.json` (written by `scripts/headers.mjs`) installs and builds from the repository root, because TypeScript, the workspaces and the content release (`public/content` is not committed) all live there. Leave the project's Output Directory unset: the Next.js preset finds the static export itself, and pointing it at `out` fails with "routes-manifest.json couldn't be found". Set `NEXT_PUBLIC_SITE_URL` in the project's environment variables. The site is a static export, so any static host works the same way: run `npm ci` and `npm run build` at the root and serve `apps/web/out` with the headers in `public/_headers`.
- **Between us:** approve `pairs.md`, the voice-guide addendum and the 217 snippets (Gates P1 and P2); get the second-person wording reviewed (the privacy and terms text, and under-16 handling for someone you add); run the 5 to 8 person check in gate P3; and check the Method page's research claim against a fuller literature search. The Joel et al. (2020) finding it cites was checked against the paper's text; the claim that no controlled test links birth numbers to how two people get on rests on the same limited search as the existing Method text.
- The pair pages need `NEXT_PUBLIC_SITE_URL` set for their canonical links and the sitemap, like the rest of the site, and the host should serve `/between/3-7` as a static page. Phase 3 also leaves out the circle's pair-to-pair readings between two people who are not you, and a personality-number lens. See the plan.
- Out of scope for v1, as in the plan: Chaldean toggle, compatibility scores, accounts, daily email or push, Malay translation, live LLM text.
