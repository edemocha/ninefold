'use client';

import type { ReactNode } from 'react';
import type { Bank } from '@numerology/composer';
import { useLayers, type LayerName } from '@/lib/content-context';
import { t } from '@/lib/t';

/** Loads the content layers a screen needs, then renders it. */
export function LayerGate({ layers, children }: { layers: LayerName[]; children: (bank: Bank) => ReactNode }) {
  const { bank, error } = useLayers(layers);
  if (error) {
    return (
      <p role="alert" className="card-flat p-5 text-sm">
        {t('common.error')}
      </p>
    );
  }
  if (!bank) {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-3">
        <p className="sr-only">{t('common.loading')}</p>
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-surface-2" />
        <div className="h-28 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-28 animate-pulse rounded-xl bg-surface-2" />
      </div>
    );
  }
  return <>{children(bank)}</>;
}
