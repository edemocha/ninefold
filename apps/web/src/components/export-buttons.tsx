'use client';

import Link from '@/components/link';
import { useState } from 'react';
import {
  composeHeadlines,
  composeYear,
  yearMonthDates,
  type Bank,
} from '@numerology/composer';
import { addDays, birthdayIn, personalMonthOn, type Conventions, type YMD } from '@numerology/engine';
import { Icon } from './icon';
import { track } from '@/lib/analytics';
import { buildIcs, downloadText, type IcsEvent } from '@/lib/ics';
import { canvasToPng, downloadBlob, drawShareImage, type ShareSpec } from '@/lib/share-image';
import { t } from '@/lib/t';

const NOTE = 'Numerology is a symbolic tradition, for reflection or fun.';

/** The first and last day of a personal-year cycle. */
export function cycleRange(birth: YMD, year: number, c: Conventions): { from: YMD; to: YMD } {
  if (c.cycleYear === 'calendar') return { from: { year, month: 1, day: 1 }, to: { year, month: 12, day: 31 } };
  return { from: birthdayIn(birth, year, c), to: addDays(birthdayIn(birth, year + 1, c), -1) };
}

/** Month themes as an iCalendar file: 12 all-day events. */
export function monthEvents(bank: Bank, birth: YMD, year: number, c: Conventions): IcsEvent[] {
  const reading = composeYear(bank, birth, year, c);
  const dates = yearMonthDates(birth, year, c);
  const month = bank.month;
  return dates.map((date, i) => {
    const tile = reading.months[i]!;
    const pm = personalMonthOn(birth, date, c);
    const theme = month?.personalMonth[String(pm.value)]?.theme ?? '';
    return {
      date,
      summary: `Personal month ${tile.value}: ${tile.tile}`,
      description: `${theme} ${NOTE}`.trim(),
    };
  });
}

/** One event per day with the day's headline. */
export function dayEvents(bank: Bank, birth: YMD, year: number, c: Conventions): IcsEvent[] {
  const { from, to } = cycleRange(birth, year, c);
  return composeHeadlines(bank, birth, from, to, c).map((row) => ({
    date: row.date,
    summary: `Day ${row.personalDay}: ${row.headline}`,
    description: NOTE,
  }));
}

export function ExportPanel({
  bank,
  birth,
  year,
  conventions,
  pdfHref,
}: {
  bank: Bank;
  birth: YMD;
  year: number;
  conventions: Conventions;
  pdfHref: string;
}) {
  const [busy, setBusy] = useState(false);

  const run = (kind: 'months' | 'days') => {
    setBusy(true);
    // Let the button repaint before the year of days is composed.
    setTimeout(() => {
      const events = kind === 'months' ? monthEvents(bank, birth, year, conventions) : dayEvents(bank, birth, year, conventions);
      const name = kind === 'months' ? `personal-months-${year}.ics` : `personal-days-${year}.ics`;
      downloadText(name, buildIcs(events, kind === 'months' ? `Personal months ${year}` : `Personal days ${year}`));
      track('export_ics');
      setBusy(false);
    }, 20);
  };

  return (
    <section aria-labelledby="export-title" className="card-flat space-y-4 p-6 no-print">
      <h2 id="export-title" className="section-title">
        {t('reading.exports')}
      </h2>
      <div className="flex flex-wrap gap-3">
        <Link href={pdfHref} className="btn-quiet" onClick={() => track('export_pdf')}>
          <Icon name="print" size={16} />
          {t('reading.exportPdf')}
        </Link>
        <button type="button" className="btn-quiet" disabled={busy} onClick={() => run('months')}>
          <Icon name="calendar" size={16} />
          {t('reading.exportIcsMonths')}
        </button>
        <button type="button" className="btn-quiet" disabled={busy} onClick={() => run('days')}>
          <Icon name="calendar" size={16} />
          {t('reading.exportIcsDays')}
        </button>
      </div>
      <p className="text-sm text-muted">{t('reading.exportNote')}</p>
    </section>
  );
}

/** Draws a numbers-only card in the browser and hands it over as a PNG. */
export function ShareImageButton({ spec, filename }: { spec: ShareSpec; filename: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn-quiet"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await document.fonts?.ready;
          const canvas = document.createElement('canvas');
          drawShareImage(canvas, spec);
          downloadBlob(filename, await canvasToPng(canvas));
          track('export_image');
        } finally {
          setBusy(false);
        }
      }}
    >
      <Icon name="image" size={16} />
      {t('reading.exportImage')}
    </button>
  );
}
