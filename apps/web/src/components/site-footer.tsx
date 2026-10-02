import Link from '@/components/link';
import { Disclaimer } from './disclaimer';
import { Spectrum } from './spectrum';
import { CREDIT } from '@/lib/site';
import { t } from '@/lib/t';

export function SiteFooter() {
  return (
    <footer className="no-print mt-24">
      <Spectrum />
      <div className="bg-surface-2">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1fr_auto]">
          <div className="space-y-3">
            <p className="font-display text-xl font-bold tracking-tight text-ink-strong">{t('privacy.line')}</p>
            <Disclaimer className="max-w-prose" />
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-6 gap-y-2 text-[0.95rem] font-medium text-ink-strong">
            <Link href="/numbers" className="underline-offset-4 hover:underline">
              {t('nav.numbers')}
            </Link>
            <Link href="/method" className="underline-offset-4 hover:underline">
              {t('nav.methods')}
            </Link>
            <Link href="/privacy" className="underline-offset-4 hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="underline-offset-4 hover:underline">
              Terms
            </Link>
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-8 text-sm text-muted" data-testid="credit">
          <span className="font-semibold text-ink-strong">{CREDIT}</span>
        </p>
      </div>
    </footer>
  );
}
