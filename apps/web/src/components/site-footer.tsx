import Link from '@/components/link';
import { Disclaimer } from './disclaimer';
import { CREDIT } from '@/lib/site';
import { t } from '@/lib/t';

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t-2 border-ink-strong">
      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-10 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink-strong">{t('privacy.line')}</p>
          <Disclaimer className="max-w-prose" />
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-5 gap-y-2 text-sm text-ink">
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
      <div className="border-t border-line">
        <p className="mx-auto max-w-5xl px-5 py-4 text-xs text-muted" data-testid="credit">
          <span className="font-serif text-sm italic text-ink-strong">{CREDIT}</span>
        </p>
      </div>
    </footer>
  );
}
