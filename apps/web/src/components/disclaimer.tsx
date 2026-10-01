import { t } from '@/lib/t';

/** Shown on onboarding, under every reading and on the PDF, word for word. */
export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-sm leading-relaxed text-muted ${className}`} data-testid="disclaimer">
      {t('disclaimer')}
    </p>
  );
}
