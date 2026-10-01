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

2,091 snippets, 58,000 words, every slot filled, lint clean. The structure follows the plan (life 421, year 165, month 108, day 587: 1,281 snippets and 34,215 words) plus 810 cautions (see below). **Every snippet is a draft.** I wrote them from the meaning sheets and the voice guide, and the plan is explicit that a human edits and approves the text.

- The plan-sized part is about 37% of the plan's 92,600-word sizing. The plan's own argument is that detail means layers and visible math, not word count, so I filled every slot at a shorter length instead of leaving any empty. Raising a family's word budget in `packages/content/src/manifest.ts` and drafting longer text is a normal editorial pass.
- `meaning-sheets/` (one page per number) and `voice-guide.md` are drafts for the owner's approval. Per Gate 1, nothing further should be drafted until they are approved.
- Statuses live in `packages/content/status.json` (empty: all draft). Release defaults to allowing drafts; set `CONTENT_MIN_STATUS=approved` for launch.

Gate 3 fails today, correctly: 0 of 2,091 snippets are approved. The variety condition passes.

### Cautions

A caution is a short, practical nudge about a behavior to watch, never a forecast. There are 810: 3 layers (year, month, day) by 9 numbers by 5 facets (money, work, relationships, energy, mind) by 6 variants. Each has a label (WATCH OUT, GO EASY ON or AVOID), a headline of at most 8 words, a body of at most 35 words, and the shadow trait it comes from. They follow the product owner's brief, which is also the drafting prompt for these slots (`npm run content:draft -- day.caution.8.energy.v2`).

- The lint enforces the brief: a tendency in the wording, AVOID only for behaviors (never a date, trip or activity), unique headlines, and the hard rules (no death, injury, illness, pregnancy or disaster, no certainty words, no fear hooks, no calorie or diet advice, no legal or relationship verdicts, no selling, investing or borrowing).
- **One call that differs from the plan's lint:** the plan bans "buy" and "purchase" everywhere, but the brief's own example ("Big buys on a whim") uses both. They are now allowed in the money facet only, as a nudge to pause, and still banned in every other snippet. That is one entry in `packages/content/src/rules.ts` if you want it reversed.
- Two safety lines show on every caution card, whatever the number: "Never drive tired, upset or impaired, on any day." and "For health, money or legal decisions, talk to a qualified person, not a number." They are fixed text in `manifest.ts`, not in the bank, and a test checks that they are identical on different numbers and contain no digit.
- A day shows one caution (the facet rotates each time the same number comes round and the variant moves on every fifth, so none repeats for about nine months). A year or month shows five, one per facet.

## Privacy, and how it is proved

- Nothing typed is stored: not in storage, cookies, IndexedDB or the address. A reload clears it, by design.
- The address fragment holds only conventions. The date, year and month being explored are kept in memory, not in the address, because a date someone explores could be their own birthday. (The privacy test caught exactly that, and it is fixed.)
- `tests/e2e/privacy.spec.ts` types a distinctive name and birth date, visits every screen and export, and fails the build if either appears in any request URL, header or body or in any browser storage. It also asserts every request goes to this origin.
- A Content-Security-Policy with `connect-src 'self'` (written by `apps/web/scripts/headers.mjs` for Cloudflare Pages/Netlify, Vercel and the test server) makes the browser itself refuse requests to other origins. `tests/e2e/csp.spec.ts` checks that, and that the whole app runs under it.
- Analytics are off unless `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set; they are cookieless, event-allowlisted, carry no properties, and stop for under-16s.
- Fonts are downloaded at build time and served from the site.

## Differences from the plan

- UI strings use a keyed `messages/en.json` and a tiny `t()` rather than `next-intl`. The keys are stable, so `next-intl` is a drop-in when a second language arrives.
- The day card puts the life-path overlay and life stage before the six facets, so every reading ends on the reflection prompt, as the guardrails require. The plan's sample put them after.
- `Link` prefetching is off: some static hosts do not serve Next's per-segment prefetch files.
- The Next/Tailwind/Vitest versions are current as of this build (Next 16, Tailwind 4, Vitest 5, TypeScript 5.9).

## Not done, and needs a person

- **Approve the text** (Gate 2 and 3) and the meaning sheets and voice guide (Gate 1).
- **The six decisions** are set to the plan's defaults: global English, Pythagorean only, per-part names, you write the sheet and an LLM drafts, free with no accounts, English first. The audience decision (whether Malaysian Muslims are a target audience) is a business decision the code cannot make.
- **Legal review.** The privacy and terms pages say only what is true of this build. They are not legal advice. Check the US children threshold, any PDPA obligations if accounts are added, and fortune-telling laws before charging for anything.
- **Speed on a mid-range phone.** The composer builds a year of day cards in a few milliseconds on a desktop; the plan's target of 50 ms on a phone still needs measuring there (Gate 4).
- **A real host and domain** (`NEXT_PUBLIC_SITE_URL`), and a name.
- Out of scope for v1, as in the plan: Chaldean toggle, compatibility, accounts, daily email or push, Malay translation, live LLM text.
