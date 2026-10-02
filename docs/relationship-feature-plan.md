# Relationship feature ("Between us"): research and implementation plan

Status: **phases 1 to 4 are built** (1 October 2026; see the "Between us" section of the README for what shipped). They follow this plan with the recommended defaults: any pair, "Between us", birth date plus nickname, no score. Phase 2 first shipped without the optional `pair.moment` bridge lines, and they have since been added: 45 draft snippets, one per pair of day numbers, shown on Day by day. Phase 3 shipped as planned (names, a kind-of-relationship picker that only changes questions, a circle of up to five) with 18 more snippets and no pair-to-pair readings between two people who are not you. Phase 4 shipped as planned: a nine by nine index and 45 static pair pages with no personal data, in the sitemap, plus a dates-only way into the tool; the only addition is a link from each number's page to its nine pairs. Written for the Ninefold codebase at commit `46158d3`.

The original plan listed compatibility as out of scope for v1 and set a guardrail of "no relationship verdicts". Adding this feature is a scope change. The guardrail stays; the feature is designed around it.

---

## 1. Recommendation in one page

**Build a "Between us" view that shows two people's numbers side by side and the arithmetic that links them, with conversation prompts. Do not build a compatibility score.**

| Question | Recommendation |
| --- | --- |
| Name | **Between us** (placeholder, like "Ninefold"). Not "Compatibility" and not "Love". |
| Who is it for | Any two people: partners, friends, parents and children, colleagues. Neutral wording, no romance-only copy. |
| Score or "match"? | **No.** No percentage, no stars, no "compatible / incompatible". Reasons in section 2. |
| What it shows | (1) the two life paths side by side with what each number tends to bring, (2) how the two meet, where each may stretch, and questions to talk about, (3) **your two cycles**: a fixed gap between your personal-year, month and day numbers, with the math shown. |
| What the second person gives | A **birth date and an optional nickname**. No full name in v1. Kept in the tab's memory only, like the first person. |
| New writing needed | **154 snippets, about 7,000 words** for phase 1 (the existing bank has 2,091). Small enough that the owner reads all of it. |
| Effort | Phase 1 about 13 developer-days plus about 1.5 days of owner review. Phases 2 to 4 are optional add-ons (section 9). |
| Biggest risk | Visitors expect a score. The answer is to be the site that says what the numbers do and do not tell you, and to give them the cycles view as a satisfying result (section 10). |

The feature that fits this site is the one **no compatibility calculator has**: the gap between two people's cycles is constant, provable, and shown step by step. I checked it against the real engine (section 4).

---

## 2. What the research says, and what it means for the design

I searched for how compatibility is done in numerology, what the evidence says about predicting how well two people get on, what harms come from "match" products, what competitors collect, and what the law asks when you handle someone else's data.

How much I read: items marked **(read)** I opened and read; **(snippet)** I only saw an abstract or search result and the claim should be re-checked before it is quoted on the site.

### 2.1 How numerology compatibility is done today

- Most pages compare two **life path numbers** and return a score or a short text. One calculator, for example, publishes a 9 by 9 chart of scores from 45 to 95 out of 100, symmetric, with master numbers reduced to 2, 4 and 6 for scoring. It states no formula for the scores, and its own page says the scores "do not establish attraction, trust or consent" and are "conversation prompts" **(read)** [numerology.pardesco.com](https://numerology.pardesco.com/decode/compatibility/chart/). So even the scoring sites disclaim their scores.
- Books cover "every possible pairing" of life paths, for example Hans Decoz's *Love and Numbers* (2025) **(snippet)**.
- Some traditions also compare the name numbers (soul urge, expression) of the two people.

**Consequence:** the market norm is a number out of 100. That is also what the evidence below argues against. We can still serve the same search intent ("what do our numbers say together?") without the score.

### 2.2 Can birth dates or traits predict how a relationship goes?

| Finding | Source | Read | What it means for the design |
| --- | --- | --- | --- |
| In a double-blind test, astrologers matched 40 of 116 birth charts to the right personality profile, which is chance level, and their confidence did not help | Carlson, *Nature*, 1985, [summary](https://en.wikipedia.org/wiki/Shawn_Carlson) | snippet | Birth-date systems have not shown predictive power when tested blind. Say so plainly. Claim "reflection", never "prediction". (This was astrology, not numerology. I did not find a numerology-specific controlled study. Before publishing any claim about numerology itself, run a proper search of the literature.) |
| Across 43 longitudinal datasets of 11,196 couples from 29 labs, the best predictors of relationship quality were **relationship-specific**: perceived partner commitment, appreciation, sexual satisfaction, perceived partner satisfaction, conflict. Individual traits (life satisfaction, negative emotion, depression, attachment) also predicted, but added nothing beyond a person's own perceptions of the relationship; the partner's own ratings added nothing either, and change over time was largely unpredictable | Joel et al., *PNAS*, 2020, [preprint full text](https://eprints-gro.gold.ac.uk/29101) (re-checked against the text when the Method page was written) | read | What predicts a good relationship is what the two people do and feel, not a pairing of numbers. The `talk` prompts should point at appreciation, commitment, how conflict is handled. |
| In samples of 5,278 (Australia), 6,554 (UK) and 11,418 (Germany), couples' personality similarity showed **no consistent effect** beyond each person's own and their partner's traits | Dyrenforth, Kashy, Donnellan and Lucas, *JPSP*, 2010, [record](https://worlddatabaseofhappiness.eur.nl/publications/predicting-relationship-and-life-satisfaction-from-personality-in-nationally-representative-samples-from-three-countries-the-relative-importance-of-actor-partner-and-similarity-effects-7931/) | snippet | "Same numbers means a good match, opposite numbers means a bad one" has no support. Do not write "you are alike so you will click" or "you are opposite so you will clash". |
| Believing a relationship is "meant to be" (destiny belief) predicts less effort to maintain it and more disengagement under stress; believing relationships grow with work predicts more maintenance | Knee, 1998 and later work, e.g. [SAGE](https://journals.sagepub.com/doi/10.1177/0265407518768079) | snippet | A "soulmate" or "doomed" verdict is not only unproven, it can do harm. Frame everything as **growth and conversation**. |
| People who know their sign's description rate it as more accurate for themselves, and sign-personality links vanish among people who do not know the descriptions | Mayo, White and Eysenck, 1978 and replications, [meta-analysis summary](https://astrology-and-science.com/d-meta2.htm) | snippet | What we write about a pair can shape how two people see each other. Describe what a number *stands for*, never what the other person *is*. |
| Structured, mutual self-disclosure questions raised closeness between strangers | Aron et al., *PSPB*, 1997 (the "36 questions") | snippet | A good result is a set of **questions each person answers about themselves**, which is also exactly what the guardrails require. |
| Statements that sound personal but fit nearly everyone are accepted as accurate | Forer, 1949 (the Barnum effect, background knowledge) | not searched | Pair text can slide into this. Every snippet needs a concrete behavior, and the near-duplicate lint matters more here. |

### 2.3 Harms from match-based products

- Horoscope matching in some regions (kundli or "guna" matching) is reported to delay or block marriages and to discriminate **(snippet: an Indian news article and a journal abstract)**. A numeric match score can be used the same way: as pressure.
- The destiny-belief research above says a verdict can also undermine effort.
- The original plan already bans relationship verdicts. For this feature the guardrail has to be made **stricter and more specific** (section 5).

### 2.4 What competitors do with the second person's data

- **Co-Star** lets you add friends by phone contacts or Facebook and shows basic chart compatibility; a 2025 Surfshark study found it collects 8 data types including contacts and location **(read)** [Surfshark](https://surfshark.com/research/chart/astrology-apps-privacy). **The Pattern** has "Run Bond", which builds a profile of another person from their birth details.
- The same study found half of the astrology apps it examined track users for ads or data brokers, and averaged 5 of 35 data types.

**Consequence:** our privacy design is a real differentiator. The second person is a name-free date, in the tab's memory only, never transmitted. A visitor can add a friend without handing over a contact list.

### 2.5 Law and ethics of entering someone else's data

- The "household exemption" in GDPR protects a person's own private use, not the website that provides the tool. Our design means the site operator **receives nothing**, so there is nothing to process server-side. That is the strongest position, and the privacy tests prove it.
- GDPR Article 8 sets 16 (member states may lower to 13) for a child's consent to online services; see [Art. 8](https://gdpr-info.eu/art-8-gdpr/). The site already blocks analytics under 16. For this feature the rule has to cover **either person** being under 16, since a parent will often add a child.
- None of this is legal advice. The README already lists legal review as a human task; this feature adds items to that list (section 6).

---

## 3. Product definition

### 3.1 Principles (from the research)

1. **No verdicts.** No score, grade, ranking, "match", "compatible", "good for you". The same two numbers read the same in either order.
2. **Describe numbers, not people.** "A 7 tends to need quiet to think", never "your partner is secretive". The other person did not consent to being described.
3. **Growth framing.** Differences are "where each may stretch", never "problems".
4. **Show the math.** The one piece of real structure in a pair is the cycle gap. Make it visible and explain why it never changes.
5. **Questions, not conclusions.** Every section set ends on prompts each person answers about themselves.
6. **Neutral to relationship type.** No "partner", "husband", "girlfriend". It has to read right for two friends or a parent and child.
7. **Privacy equal to the first person.** Memory only. Nothing in the URL. Nothing in storage. Nothing in analytics.

### 3.2 What the visitor sees

Entry: a seventh tab in the reading, **Between us**, next to Snapshot, Grid, Timeline, Year, Month, Day.

```
┌ Between us ─────────────────────────────────────────────────────┐
│  Add someone. Their details stay in this tab, like yours.        │
│  Nickname (optional)  [ Sam          ]                           │
│  Birth date           [ 02 ][ 11 ][ 1988 ]                       │
│  Ask them first if you can.            [ Show us side by side ]  │
└──────────────────────────────────────────────────────────────────┘

You and Sam                              Life path   3        7
                                         (each chip has the "why this number" panel)

How each number tends to relate        ← existing life path "relationships" text, both people
  3: ...                7: ...

Where you meet          ← new, pair-specific
Where each may stretch  ← new, pair-specific
Talk about this         ← new, ends on a question

Your two cycles
   ( ring with two markers )      Your years are 4 steps apart.
                                  In 4 years Sam is where you are now.
                                  In 5 years you are where Sam is now.
   Year   2026  2027  2028 ...  (a real table, you and Sam, nine years)
   Why this never changes  ▸  8 − 4 = 4. The year cancels out, so the gap holds.

[safety lines]  [disclaimer]   [Share numbers only]  [Print]
```

Without an entered person the tab shows only the form. "Forget" in the reading header clears both people.

### 3.3 Scope options (decision for the owner)

| Option | Description | My view |
| --- | --- | --- |
| **A. Between us, any pair (recommended)** | Neutral copy, no relationship-type selector. | Lowest risk, fits the guardrails, covers parent and child, friends, colleagues. |
| B. Romantic only | "Love and compatibility", partner-specific language. | Larger search interest, but invites verdict-seeking and the harms in 2.3. Needs stricter review. |
| C. A, plus a relationship-type picker later | A selector that only changes the `talk` prompts (four small banks). | A natural phase 3 if A works. |

---

## 4. The math, checked against the engine

Nothing here is a claim from a book. It is arithmetic the site already uses, and I tested it on the real engine.

### 4.1 The cycle gap

For a person born on month *m*, day *d*, the personal year is the digital root of *m* + *d* + the year, and the personal month and day add the month and day on top. Two people's numbers therefore differ by the same amount on every day, because the year, month and day terms **cancel**:

> your number minus their number, mod 9, = (your birth month + day) minus (their birth month + day), mod 9

I ran this against the engine (`personalDayNumber`, `personalYear`) with a seeded generator:

| Check | Result |
| --- | --- |
| 300 random pairs, every day from 2024 to 2027 (about 1,460 days each), calendar mode: day-number gap is one constant and equals the formula | **0 of 300 failed** |
| Personal-year gap for 200 random pairs by 21 years, under each of the four date rules (A2, A, B, C): equals the formula | **0 of 16,800 failed** |
| Birthday-cycle mode, one calendar year | gap takes **two adjacent values** (changes by 1 at a birthday) for 298 of 300 pairs; one value for the 2 pairs sharing a birthday |
| How often each of the nine gaps occurs among random pairs | between 10.7% and 11.4% each, so no gap is rare |
| One sample pair (born 14 March 1990 and 2 November 1988), every day of 2026 | always the nine pairs (x, x+4); each combination on 39 to 42 days |
| Life path values reachable under the default date rule | 1 to 9, 11, 22: **11 values, 66 unordered pairs** (45 pairs of single digits, 21 involving a master) |

Worked example, to show in the "why" panel: born 14 March 1990 gives 3 + 14 = 17, reduced to 8. Born 2 November 1988 gives 11 + 2 = 13, reduced to 4. 8 minus 4 is 4. So whenever one is in a 2 year, the other is in a 7 year, and 4 years later the second person reaches the first person's current number.

This becomes a permanent property test (section 8), not a one-off script.

### 4.2 Why it makes a good feature

- **Honest**: a true statement about the method, not a prediction about the relationship.
- **Visible**: a ring with two markers and a nine-year table.
- **Personal**: nine possible gaps, in two directions, times the life path pair, so no two readings feel stamped from one template.
- **Cheap to write**: only five distances (0 to 4, the shorter way round) need text.

### 4.3 What is deliberately not offered

- "Good days together" or "best day to meet": that is a score by another name. The two-person day view shows both numbers and nothing more.
- A shared calendar file (.ics): same reason, and it would put the other person's dates into a file.

---

## 5. Content design

### 5.1 New families (phase 1: 154 snippets)

| Family | Keys | Sections | Count | Words each | Notes |
| --- | --- | --- | --- | --- | --- |
| `pair.core` | 45 unordered pairs of single digits, "1-1" to "9-9" | `meet`, `stretch`, `talk` | 135 | 30 to 70 | `talk` must end on a question. Written about the numbers, so it works in either order. |
| `pair.master` | `11`, `22`, `33`, `both` | one line each | 4 | 25 to 60 | A master number uses its root's pair text plus this overlay, the same pattern as the personal-year overtone. |
| `pair.rhythm` | distance 0, 1, 2, 3, 4 | `meaning`, `use`, `talk` | 15 | 25 to 60 | Direction and counts ("in 4 years") come from templates, not the bank. |

**Reused with no new writing:** each person's existing `life.core.lifePath.<n>.relationships` text. One catch found in the data: **5 of the 12 existing texts mention partner or romantic wording**, so for a neutral "any pair" feature they need a short neutral rewrite first. (If the owner picks scope B, they stay as they are.)

A 154-snippet bank is small enough that the owner reads every word, which is better than the sampling the 2,091-snippet bank needs.

### 5.2 Rules for the pair text (new lint group)

The lint gets a new **opt-in** rule mechanism: a family can name extra rule groups that apply only to it, so the existing 2,091 snippets are not disturbed. Pair families opt in to a `pairVerdict` group that bans:

- Verdict and score words: compatible, incompatible, compatibility, match, mismatch, soulmate, twin flame, meant to be, made for each other, destined, perfect or ideal or best or worst (match, partner, pair), doomed, toxic, red flag, "good for / bad for each other", "right person", "wrong person", "will never work", "will always fight", and any percentage, "out of 10" or rating.
- Claims about the other person as a fact: partner, husband, wife, boyfriend, girlfriend, spouse, lover, ex, he, she, him, her (neutral wording only).
- Diagnosing: narcissist, abusive, controlling, manipulative as labels.
- Predicting feelings: attract, attracted, "fall in love".

The existing certainty (will, never, always), fear and relationship (leave, marry, break up, soulmate) groups still apply. Pair snippets also have to carry a **tendency word** ("tends to", "may", "often") and a concrete behavior, like the cautions do, to fight the Barnum effect.

`talk` prompts follow the research on mutual disclosure: each question is something a person answers **about themselves or about what they would like to try**, never "why do you always..." or a question that casts the other as the problem.

### 5.3 Fixed safety lines

Two lines, shown on every Between us screen, fixed in `manifest.ts` (not in the bank), with a test that they are identical for every pair and contain no digit, as for the cautions:

1. "Numbers can't tell you whether to begin, stay or leave. That is for you to decide."
2. "If you ever feel unsafe with someone, talk to a person you trust or a local support service."

Plus the existing disclaimer, which already names relationships.

### 5.4 Drafting and approval

- New `meaning-sheets/pairs.md` and a voice-guide addendum (how to describe two numbers without describing two people). **Gate P1: the owner approves both before any pair text is drafted**, as Gate 1 does for the main bank.
- A `pair-draft.ts` prompt builder, like `caution-draft.ts`, carries the ban list and the question rule.
- All 154 snippets go through the review sheet; Gate P2 asks for **100% owner-approved** (the main bank's gate allows a sampled threshold).

---

## 6. Privacy and safety design

| Concern | Design |
| --- | --- |
| Second person's data | Held in React state next to the first person's, never in storage, cookies, IndexedDB, the URL fragment, a request, or analytics. `forget()` clears both. A reload clears both. |
| What is asked | A **birth date** and an **optional nickname** (max 30 characters, shown as plain text, never put in images, links or analytics). No full name in v1, which also removes the biggest privacy cost. |
| Under 16 | `blockAnalytics()` fires if **either** person is under 16. A notice appears on the Between us tab. |
| Consent | A one-line note at the entry ("Their details stay in this tab, like yours. Ask them first if you can."). No checkbox gate, because nothing leaves the device. |
| Sharing | The share image carries numbers only, **never the nickname**: for example "3 and 7, 4 steps apart". The URL fragment never carries anything about the second person. The existing `who` fragment key is a *name selector* for the first person and is not reused. |
| Pages without personal data | The optional static pair pages (phase 4) only carry numbers. |
| Copy | `/privacy` and `/terms` get a sentence each: another person's details are treated exactly like yours; the site does not store or send them. |
| Human tasks added | Legal review of the second-person wording; decision on the audience (the original plan's open question about Muslim-majority audiences matters more here, because matching and marriage content is where religious and cultural sensitivity is highest). |

The privacy e2e test (it already types a distinctive name and date and fails on any leak) is extended with a second distinctive date and nickname.

---

## 7. Technical design, by package

### 7.1 `packages/engine`

New `src/pair.ts` (pure, no dependencies, same style as `cycles.ts`):

- `pairKey(a, b)`: canonical sorted key such as `"3-7"` for two roots.
- `lifePathPair(birthA, birthB, c)`: both life path results, root pair key, master flags (reusing `lifePath`).
- `cycleGap(birthA, birthB, onDate, c)`: `{ gap: 0..8, forward: [g, 9 - g], distance: 0..4, steps }`, where `steps` are the visible arithmetic lines (digit sums, difference, "the year cancels").
- `cycleGapTimeline(birthA, birthB, fromYear, toYear, c)`: in birthday mode, the segments where the gap changes; in calendar mode, one segment.
- `cycleYearStrip(birthA, birthB, startYear, n, c)`: the numbers for each of `n` years, for the nine-year table.

Add an independent implementation in `tests/reference` and a golden-vector file `tests/golden/pair.json` (the sample pair above plus hand-worked edge cases).

### 7.2 `packages/content`

- `manifest.ts`: `Layer` gains `'pair'`; add `PAIR_KEYS` (45), `PAIR_SECTIONS`, `RHYTHM_DISTANCES`, `RHYTHM_SECTIONS`, `PAIR_SAFETY_LINES`; families `pair.core`, `pair.master`, `pair.rhythm`; `expectedCount()` rises from 2,091 to 2,245.
- `bank.ts`: `PairLayer` type; `ReleaseManifest.layers` includes `pair`.
- `rules.ts`: opt-in groups (`Family.also?: string[]`) and the `pairVerdict` group.
- `data/pair/*.json`, schema generated from the manifest as for other layers.
- `meaning-sheets/pairs.md`, voice-guide addendum.

### 7.3 `packages/composer`

New `src/pair.ts`:

- `composePair(bank, birthA, birthB, c)` returns the life path pair (both numbers, each side's existing `relationships` text, the three pair sections, the master overlay, steps) and the rhythm (gap, the two forward counts, three rhythm sections, the nine-year strip, a birthday-mode note, the "why" lines).
- Direction and counts are **templates** in `format.ts` with plural handling ("1 step", "4 steps"), tested.
- `composePair(a, b)` and `composePair(b, a)` give the same bank text; only the "you" and "them" labels and the forward counts swap.
- Snapshots: add a `pairs` set (30 pairs by the three conventions that matter) with the same blast-radius diff, so editing one pair snippet shows exactly which readings change.

### 7.4 `tools/content-pipeline`

`load.ts` reads `data/pair`; `build.ts` and `release.ts` write `pair.json` and its hash into `current.json`; `lint.ts` supports opt-in groups; `sheet.ts` exports pair rows; `draft.ts` and a new `pair-draft.ts`; `gate.ts` adds Gates P1 to P4.

### 7.5 `apps/web`

| Area | Change |
| --- | --- |
| Context | `profile-context.tsx`: add `partner: { label: string; birth: YMD } \| null`, `setPartner`, `clearPartner`; `forget()` clears it; `under16` becomes "either person". Keep `who` as is. |
| Layer loading | `content-context.ts`: `LayerName` gains `'pair'`, loaded on demand (roughly 45 KB before compression), so Between us costs nothing for visitors who never open it. |
| Route | `app/reading/between/page.tsx`; a seventh entry in `TABS` in `app/reading/layout.tsx` (the nav already scrolls horizontally on phones). |
| Components | `pair-form.tsx` (reuse the date fields: extract a `DateFields` from `profile-form.tsx`, which is 271 lines), `pair-header.tsx`, `rhythm-duo.tsx` (extend `RhythmRing` to two markers, with a text alternative that names both), `cycle-strip.tsx` (a real `<table>`), `pair-sections.tsx`, and move `SafetyLines` from `caution-panel.tsx` to a shared file. |
| Share and print | `share-image.ts` gets a pair spec (numbers only); print stylesheet for the page; the credit line stays. |
| Copy | `messages/en.json` keys `between.*`. Include UI strings in the banned-word test, because a "Compatibility" heading would undo the design. |
| Method page | New short section on `/method`: **"What numbers can't tell you about a relationship"**, citing section 2.2 (after the literature check in 2.2 is done). This turns the limitation into the site's selling point. |
| Home page | One line and link under the existing relationships mention. |
| Analytics | One cookieless event with no properties (`between_open`); blocked under 16 for either person. |
| Security | No change to CSP or headers: no new origin. |

---

## 8. Testing plan

| Layer | Tests |
| --- | --- |
| Engine | Property tests (fast-check): gap constant over every day of ±N years in calendar mode, for all four date rules; `gap(a,b) + gap(b,a) ≡ 0`; distance symmetric; birthday mode yields at most two adjacent gaps per cycle; leap-day birthdays; same birthday gives gap 0. Golden vectors. Cross-check of 200 random pairs against the independent reference implementation. |
| Content | Every pair slot filled; the new lint group triggers on each banned phrase (one test per phrase family); the two safety lines are identical across pairs and digit-free; near-duplicate check across the 45 pairs (watch the same-number pairs); `talk` snippets end on a question. |
| Composer | Symmetry of bank text; master overlay selection (11 with 3 uses the 2-3 pair plus overlay; 33 under date rule A); template plurals; nine-year strip wraps 9 to 1; birthday-mode note appears only when the gap changes. |
| Web unit | Context: partner cleared by `forget()`, `under16` true when either is under 16. |
| End to end | Add a person, read every section, change a convention, forget clears both; the under-16 notice for the partner; reload returns to the start; keyboard-only use; phone width; print. |
| Privacy | Extend `privacy.spec.ts` with a second distinctive date and nickname: neither appears in any request URL, header, body, storage or the share image's file name. |
| Accessibility | axe on every state of Between us (empty, filled, under 16, masters, birthday mode); the ring has a text alternative; the cycle strip is a table with headers; light-only contrast checks. |
| Language guard | A test that fails if the rendered page or any pair string contains the banned words. |
| Performance | `composePair` is a few arithmetic steps; add it to the Gate 4 phone-timing note. |

---

## 9. Phases, effort and gates

Estimates are working days for one developer, plus owner time shown separately. The code and drafts can go faster with Claude doing the build, but the owner's review time does not shrink.

| Phase | Scope | Dev days | Owner review |
| --- | --- | --- | --- |
| **0. Decisions and sheets** | Section 11 decisions; `meaning-sheets/pairs.md`; voice addendum; neutral rewrite of the 5 partner-worded texts; literature check for the `/method` claim. | 1 | 1 day |
| **1. Between us (MVP)** | Engine pair module; content families and lint; 154 snippets; composer; entry form; life path pair view; two-cycles view with math; safety lines; privacy and a11y tests; README. | 13 | 1.5 days |
| **2. Side by side over time** | Both people's year, month and day cards next to each other (reuses the existing composers); two-person timeline overlay (pinnacles and challenges, existing snippets); a short `pair.moment` bridge line per pair of day numbers (45 snippets, optional); print report; share image. | 6 | 0.5 day |
| **3. Names and more people** | Optional name pair (soul urge and expression, reusing the pair bank with a one-line lens frame); a relationship-type picker that only changes `talk` prompts (scope C); a small "circle" of up to five people. | 4 to 9 | 1 day |
| **4. Public pair pages** | `/between` index (a 9 by 9 grid of links, coloured only by each number's hue, so it cannot read as a score heat-map) and `/between/[pair]` for the 45 pairs, built statically, in the sitemap, no personal data. Possibly a dates-only entry so these pages can lead into the tool without a name. | 3 | 0.5 day |

Gates (modelled on the plan's gates):

- **P1:** owner approves `pairs.md` and the voice addendum before drafting.
- **P2:** lint clean with the pair group, **every** pair snippet owner-approved.
- **P3:** privacy, accessibility and language-guard tests green; reviewed on a phone.
- **P4 (usability check, qualitative):** show it to 5 to 8 people, in pairs, and ask "What did the site say about whether you two are right for each other?" The target answer is that it did not say, and the prompts gave them something to talk about. If most read it as a verdict, change the copy before launch. This is too small to be statistics; it is a check for the specific harm in 2.3.

---

## 10. Risks and how the plan answers them

| Risk | Answer |
| --- | --- |
| Visitors expect a percentage and leave | The cycles view gives a concrete, shareable result, and the `/method` section explains why there is no score. Honest limits are consistent with a site named for showing its math. |
| Pair text becomes generic (Barnum) | Concrete behaviors required, tendency words enforced, near-duplicate lint, and a 100% owner read of 154 snippets. |
| Text read as a verdict, or used to pressure someone | Banned-word group, growth framing, two fixed safety lines, gate P4. |
| Describing someone who did not agree | Texts describe numbers, not people; neutral pronouns; the consent note; nothing stored. |
| Under-16 data | Analytics blocked if either person is under 16; no storage; legal review item. |
| Scope creep (names, circles, types) | Phases 3 and 4 are separate decisions after phase 1 ships. |
| Same-number pairs look near-duplicate | The lint threshold applies; the nine `x-x` pairs get extra review. |
| A master number makes a pair feel "extra special" | The overlay is short and uses the same neutral voice; no master pair gets a longer text than another. |
| Existing relationships text says "partner" | Phase 0 rewrite of 5 snippets, tracked in the snapshot diff. |
| Cultural and religious sensitivity of matching | Neutral scope A, no marriage language, audience decision made explicit. |
| Research claims rest on summaries | Section 2 marks what was read; re-check before publishing anything on `/method`. |

---

## 11. Decisions needed from you

| # | Decision | My recommendation |
| --- | --- | --- |
| 1 | Scope: any pair (A), romantic only (B), or A now and a type picker later (C) | **A** |
| 2 | Name of the feature | **Between us** |
| 3 | No score or meter anywhere | **Agree** (a "closeness" meter would be a score by another name) |
| 4 | Second person: birth date and optional nickname only in v1 | **Agree**; names in phase 3 if wanted |
| 5 | How far to go first | **Phases 0 and 1**, then decide on 2 to 4 |
| 6 | Who writes the text | Same as before: Claude drafts from approved sheets, you approve every pair snippet |
| 7 | Add the "what numbers can't tell you about relationships" section to `/method` | **Yes**, after the literature check |
| 8 | Public pair pages for search traffic (phase 4) | **Yes, later**, if phase 1 works |

---

## 12. Sources

Read in full: Joel et al. 2020 (full text); the Pardesco compatibility chart page; the Surfshark astrology-app privacy study (summary page).

Seen as abstracts or search results only (re-check before quoting): Carlson 1985; Dyrenforth et al. 2010; Knee 1998 and follow-ups; Mayo, White and Eysenck 1978 and the meta-analysis summary; Aron et al. 1997; Decoz, *Love and Numbers*; reporting on kundli matching; GDPR Article 8 and the household exemption.

- Joel et al. (2020), "Machine learning uncovers the most robust self-report predictors of relationship quality across 43 longitudinal couples studies", *PNAS*: <https://eprints-gro.gold.ac.uk/29101>
- Dyrenforth, Kashy, Donnellan and Lucas (2010), *Journal of Personality and Social Psychology* 99(4): <https://worlddatabaseofhappiness.eur.nl/publications/predicting-relationship-and-life-satisfaction-from-personality-in-nationally-representative-samples-from-three-countries-the-relative-importance-of-actor-partner-and-similarity-effects-7931/>
- Carlson (1985), *Nature* 318: <https://en.wikipedia.org/wiki/Shawn_Carlson>
- Knee and later destiny-belief work: <https://journals.sagepub.com/doi/10.1177/0265407518768079>
- Self-attribution meta-analysis summary: <https://astrology-and-science.com/d-meta2.htm>
- Aron et al. (1997), *Personality and Social Psychology Bulletin* 23(4): 363 to 377
- Surfshark, astrology apps and privacy (20 May 2025): <https://surfshark.com/research/chart/astrology-apps-privacy>
- Pardesco numerology compatibility chart: <https://numerology.pardesco.com/decode/compatibility/chart/>
- GDPR Article 8: <https://gdpr-info.eu/art-8-gdpr/>
