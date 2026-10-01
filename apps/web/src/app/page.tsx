import Link from '@/components/link';
import { ProfileForm } from '@/components/profile-form';
import { Icon } from '@/components/icon';
import { NineDots } from '@/components/nine-dots';
import { t } from '@/lib/t';

// Each card takes the hue of the number it is numbered with.
const OUTPUTS = [
  { n: '1', title: 'Core profile', text: 'Life path, expression, soul urge, personality, birth day and maturity, with karmic debt flags.' },
  { n: '2', title: 'Name grid', text: 'Your letters, vowels against consonants, the numbers your name lacks and the one it repeats.' },
  { n: '3', title: 'Life timeline', text: 'Four pinnacles and four challenges on an age axis. Drag the marker to any age from 0 to 100.' },
  { n: '4', title: 'Year, month and day', text: 'A personal year with twelve month tiles, a calendar of personal days and a short card for any date.' },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-5">
      <section className="grid gap-12 py-14 lg:grid-cols-[1fr_28rem] lg:items-start lg:py-20">
        <div className="rise lg:pt-6">
          <p className="eyebrow mb-5 !text-[color:var(--primary)]">Numerology in your browser</p>
          <h1 className="max-w-[16ch] text-5xl sm:text-6xl">
            {t('form.title').split(', ')[0]}, <span className="italic text-primary">{t('form.title').split(', ')[1]}</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted">{t('form.intro')}</p>
          <ul className="mt-8 space-y-3 text-[0.95rem] text-ink">
            <li className="flex gap-3">
              <Icon name="check" size={18} className="mt-1 shrink-0 text-primary" />
              Every number shows its arithmetic, one click away.
            </li>
            <li className="flex gap-3">
              <Icon name="check" size={18} className="mt-1 shrink-0 text-primary" />
              Your name and birth date stay on this page. They are not sent, saved or put in the address.
            </li>
            <li className="flex gap-3">
              <Icon name="check" size={18} className="mt-1 shrink-0 text-primary" />
              Published sources disagree on the rules, so you can see and change each one.
            </li>
          </ul>
          <div className="mt-10 hidden lg:block">
            <NineDots />
          </div>
        </div>
        <div className="rise" style={{ ['--i' as string]: 2 }}>
          <ProfileForm />
        </div>
      </section>

      <section className="border-t border-line py-16" aria-labelledby="outputs-title">
        <p className="eyebrow mb-3">What you get</p>
        <h2 id="outputs-title" className="max-w-[24ch] text-3xl sm:text-4xl">
          Layers, not word count
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {OUTPUTS.map((o, i) => (
            <article key={o.n} className={`card card-hue hue-${o.n} rise p-6`} style={{ ['--i' as string]: i }}>
              <p className={`numeral numeral-hue inline-flex size-12 items-center justify-center rounded-full text-3xl tint-${o.n}`}>{o.n}</p>
              <h3 className="mt-4 text-xl">{o.title}</h3>
              <p className="mt-2 text-[0.95rem] text-muted">{o.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-16" aria-labelledby="honest-title">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow mb-3">Straight talk</p>
            <h2 id="honest-title" className="text-3xl sm:text-4xl">
              What this is, and is not
            </h2>
          </div>
          <div className="space-y-4 text-[1.02rem] leading-relaxed text-ink">
            <p>
              Numerology is a symbolic tradition. The numbers carry very little information: on any given day, every birthday lands on one of nine personal-day numbers. People rate
              general statements about themselves as accurate whether or not they were written for them, so the readings here ask questions instead of making claims.
            </p>
            <p>
              There is no credible controlled evidence that numerology predicts anything. Use it to reflect, or for fun, and not to decide anything about health, money, legal matters or
              relationships.
            </p>
            <p>
              <Link href="/method" className="underline underline-offset-4 hover:text-ink-strong">
                See exactly how each number is worked out
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
