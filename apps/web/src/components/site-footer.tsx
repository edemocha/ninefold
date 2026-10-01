import Link from '@/components/link';
import { Disclaimer } from './disclaimer';
import { Icon } from './icon';
import { CREDIT } from '@/lib/site';
import { t } from '@/lib/t';

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 border-t border-line">
      <div className="mx-auto grid max-w-5xl gap-6 px-5 py-10 md:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-ink-strong">
            <Icon name="lock" size={16} className="text-primary" />
            {t('privacy.line')}
          </p>
          <Disclaimer className="max-w-prose" />
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-start gap-x-5 gap-y-2 text-sm text-muted">
          <Link href="/numbers" className="hover:text-ink-strong">
            {t('nav.numbers')}
          </Link>
          <Link href="/method" className="hover:text-ink-strong">
            {t('nav.methods')}
          </Link>
          <Link href="/privacy" className="hover:text-ink-strong">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink-strong">
            Terms
          </Link>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-5xl px-5 py-4 text-xs text-muted" data-testid="credit">
          <span className="font-serif text-sm italic text-primary">{CREDIT}</span>
        </p>
      </div>
    </footer>
  );
}
