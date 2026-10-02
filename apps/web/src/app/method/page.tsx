import type { Metadata } from 'next';
import Link from '@/components/link';

export const metadata: Metadata = {
  title: 'Method: how every number is worked out',
  description: 'The formulas, the four date rules that published sources disagree on, and how often each choice changes the result.',
};

const LIFE_PATH_FLIPS = [
  ['A vs A2', '3.9%', '4.5%'],
  ['A vs B', '13.8%', '9.1%'],
  ['A vs C', '10.5%', '9.7%'],
  ['A2 vs B', '13.8%', '9.8%'],
  ['A2 vs C', '9.3%', '9.4%'],
  ['B vs C', '17.5%', '10.1%'],
];

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-16 mb-4 text-3xl">
      {children}
    </h2>
  );
}

export default function MethodPage() {
  return (
    <article className="reading mx-auto max-w-3xl px-5 py-14 text-[1.05rem] leading-relaxed">
      <p className="eyebrow mb-4">Method</p>
      <h1 className="text-5xl">How every number is worked out</h1>
      <p className="mt-6 text-lg text-muted">
        Published sources disagree on the same inputs, and not rarely: between 4% and 18% of results change depending on the convention. So this site shows the convention next to every
        number, lets you switch it under Advanced, and shows the arithmetic with a click.
      </p>

      <H2 id="reducing">Reducing a number</H2>
      <p>
        Add the digits until one is left. For dates, stop early at 11 and 22. For names, stop at 11, 22 and 33. A master number is always shown with its root, so 11 appears as 11/2 and
        19 reduces through 10 to 1.
      </p>

      <H2 id="date-rule">The four date rules</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-medium text-ink-strong">A2 (default).</strong> Day, month and year are each cut to a single digit, added, then reduced with 11 and 22 kept. It matches the
          published pinnacle example and keeps life path, pinnacles and cycles consistent with each other.
        </li>
        <li>
          <strong className="font-medium text-ink-strong">A.</strong> Each part is reduced but keeps 11, 22 and 33, then the parts are added and reduced with masters kept.
        </li>
        <li>
          <strong className="font-medium text-ink-strong">B.</strong> Every digit of the date is added in one flat sum, masters kept. It inflates masters: life path 33 appears for 5.8% of birthdays
          under B, 0.9% under A and never under A2.
        </li>
        <li>
          <strong className="font-medium text-ink-strong">C.</strong> Always a single digit.
        </li>
      </ul>
      <p className="mt-5">
        How often the answer changes between two rules, measured over all 25,933 birthdays from 1 January 1940 to 31 December 2010 (life path) and over 366 birthdays across 2020 to
        2040 (personal year, masters kept):
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-[0.95rem]">
          <caption className="sr-only">How often two date rules disagree</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-4 font-normal">
                Rule pair
              </th>
              <th scope="col" className="py-2 pr-4 font-normal">
                Life path differs
              </th>
              <th scope="col" className="py-2 font-normal">
                Personal year differs
              </th>
            </tr>
          </thead>
          <tbody>
            {LIFE_PATH_FLIPS.map(([pair, lp, py]) => (
              <tr key={pair} className="border-b border-line">
                <th scope="row" className="py-2 pr-4 font-mono text-sm font-normal text-ink-strong">
                  {pair}
                </th>
                <td className="py-2 pr-4">{lp}</td>
                <td className="py-2">{py}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-5">
        Same birthday, opposite meanings: 7 January 1940 is a 4 carrying karmic debt 13/4 under A, A2 and C, and a master 22 under B. 5 January 1940 is 11 under A and A2, and 2 under B and C.
      </p>

      <H2 id="names">Names</H2>
      <ul className="list-disc space-y-2 pl-5">
        <li>The birth name drives the core numbers. The name you go by now gets its own set.</li>
        <li>Letters are Pythagorean: A to I are 1 to 9, then the pattern repeats. A Chaldean table is built and tested, but it ships later, because the two systems disagree (JOHN is 2 and 9, DAVID is 22 and 7).</li>
        <li>
          Per part (default): reduce each name part, add the results, then reduce. Whole name: add every letter and reduce once. For Amelia Rose Carter the soul urge is 6 per part and 33 for the whole name.
        </li>
        <li>Accents are stripped (José becomes JOSE), apostrophes and punctuation are dropped, and hyphens act as spaces. Names in other scripts are not transliterated, because two spellings give two numbers.</li>
        <li>Y is a consonant by default, or a vowel when it is the only vowel in its word. Particles such as bin, binti, a/l and van are counted as written, with a switch to ignore them. Nobody settles either, so the choice is yours.</li>
        <li>Karmic lessons are the digits 1 to 9 missing from the name. Hidden passion is the digit or digits that appear most often. Subconscious self is 9 minus the number of missing digits.</li>
      </ul>

      <H2 id="karmic">Karmic debt</H2>
      <p>
        A total of 13, 14, 16 or 19 on the way to a single digit is flagged: 13/4, 14/5, 16/7 and 19/1. Some versions of the tradition explain a karmic debt as a lesson carried over from earlier. Whatever
        you think of that, read it as a recurring theme.
      </p>

      <H2 id="periods">Pinnacles and challenges</H2>
      <p>
        With month, day and year each cut to a single digit: the first pinnacle is month plus day, the second is day plus year, the third is the first plus the second, and the fourth is month plus year.
        The challenges are the differences: month minus day, day minus year, the difference of those two, and month minus year. A challenge of 0 is meaningful.
      </p>
      <p className="mt-3">
        The first pinnacle runs from birth to age 36 minus the single-digit life path. The second and third last nine years each, and the fourth is the rest. For a master life path, 11 counts as 2, 22 as 4 and 33 as 6; that last step is an assumption.
      </p>

      <H2 id="cycles">Personal year, month and day</H2>
      <p>
        Personal year: birth month plus birth day plus the year, under the date rule. Personal month: the personal year plus the calendar month, cut to a single digit. Personal day: the personal month plus the day of the
        month, cut to a single digit. The single digit drives the reading. When a personal year adds up to 11, 22 or 33, it shows as an overtone note, or you can keep the master or ignore it.
      </p>
      <p className="mt-3">
        The year can run January to December (default) or birthday to birthday. The two pick a different year on about half of all days, because the number moves by one each year and they disagree between 1 January and the
        birthday. For 29 February births the birthday is counted on 28 February in common years, with a switch for 1 March.
      </p>

      <H2 id="carry">What the numbers actually carry</H2>
      <p>
        Not much. On any given day every possible birthday lands on one of nine personal-day numbers, so about a ninth of all visitors share yours. Year, month and day are each 1 to 9, which makes 729 combinations, and all of them
        turn up within nine years. Specific-sounding text from so few inputs is what the Forer effect runs on: people rate generic statements about themselves as highly accurate. We found no credible controlled test showing
        that numerology predicts anything.
      </p>
      <p className="mt-3">
        So the readings here describe themes, name a shadow side and end on a question. The long timeline, the name grid and the visible arithmetic are the point. The nine-day rhythm is shown as a ring, so you can see exactly
        why a number comes back.
      </p>

      <H2 id="between">Between us: two people, side by side</H2>
      <p>
        Between us sets two people&apos;s life paths next to each other and shows the gap between their cycles. A pair of life paths is the two single-digit roots, smaller first, so a 3 and a 7 read the same in either order.
        A master number (11, 22 or 33) uses its root and adds one short note. The pages under Two numbers show this pair text for each of the 45 pairs, with no dates entered.
      </p>
      <p className="mt-3">
        The gap is plain arithmetic. A personal year is the birth month plus the birth day plus the year, cut to a single digit, and the personal month and day add the same month and day for both people. The year, the month and the
        day cancel in a difference, so two people&apos;s numbers stay the same number of steps apart, and that gap depends only on their birth months and days. For example, a birthday on 14 March gives 3 + 14 = 17, cut to 8, and a
        birthday on 2 November gives 11 + 2 = 13, cut to 4. The difference is 8 − 4 = 4, so whenever the first person is in a 2 year the second is in a 7 year (2 − 4 = −2, and −2 + 9 = 7). If you count cycles from birthdays instead of
        calendar years, the gap moves by one step between the two birthdays and then returns.
      </p>
      <p className="mt-3">
        It gives no score and no verdict. In a 2020 analysis of 43 studies and 11,196 couples (Joel and colleagues, in <em>PNAS</em>), the best predictors of how happy people were in a relationship were their own perceptions of
        the relationship itself, such as how committed their partner seemed, how appreciative they felt and how conflict went. Personality traits and the partner&apos;s own answers added no predictive information beyond that, and
        nothing predicted which relationships would improve or worsen. That study did not test numerology, and we found no credible controlled test showing that birth numbers predict how well two people get on. So Between us
        offers things to talk about, and says so. What it describes is what a number tends to stand for, never the person you add. See the Privacy page for how their details are handled.
      </p>

      <H2 id="dates">Dates and time zones</H2>
      <p>
        Dates are stored as three whole numbers, never as a JavaScript date, so a birth date cannot slip by a day across a time zone. Today is your own calendar date, read from your device, and the personal day changes at your local
        midnight.
      </p>

      <p className="mt-14">
        <Link href="/" className="btn">
          Work out my numbers
        </Link>
      </p>
    </article>
  );
}
