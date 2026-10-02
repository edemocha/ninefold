'use client';

import { scaleLinear } from 'd3-scale';
import { useEffect, useRef } from 'react';
import type { PairLife, PairLifeSide, PeriodReading } from '@numerology/composer';
import { t } from '@/lib/t';

const W = 960;
const PAD = 28;
const MIN_WIDTH = 860;

const rootOf = (value: number) => (value === 11 ? 2 : value === 22 ? 4 : value === 33 ? 6 : value);

type Row = { side: PairLifeSide; kind: 'pinnacle' | 'challenge'; y: number; h: number };

/**
 * Both people's pinnacles and challenges on one calendar-year axis, so you can
 * see where each of you is in life. It is a picture of what the tables under
 * each person say, so it is hidden from assistive technology behind a plain
 * description.
 */
export function PairLifeChart({ life }: { life: PairLife }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { axis, today } = life;
  const X = scaleLinear()
    .domain([axis.from, axis.to + 1])
    .range([PAD, W - PAD]);
  const nowX = X(today.year + (today.month - 1) / 12);

  // On a narrow screen the chart scrolls sideways: start with "now" in view.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (nowX / W) * el.scrollWidth - el.clientWidth / 2;
  }, [nowX]);

  const [a, b] = life.sides;
  const rows: Row[] = [
    { side: a, kind: 'pinnacle', y: 44, h: 42 },
    { side: a, kind: 'challenge', y: 94, h: 26 },
    { side: b, kind: 'pinnacle', y: 170, h: 42 },
    { side: b, kind: 'challenge', y: 220, h: 26 },
  ];
  const AXIS = 280;

  const span = (side: PairLifeSide, p: PeriodReading): [number, number] => {
    const from = side.birthYear + p.ageFrom;
    const to = p.ageTo === null ? side.birthYear + 101 : side.birthYear + p.ageTo + 1;
    return [X(from), X(to)];
  };
  const isCurrent = (side: PairLifeSide, kind: Row['kind'], p: PeriodReading) => p.n === (kind === 'pinnacle' ? side.current.pinnacle.n : side.current.challenge.n);

  // Decade ticks.
  const firstTick = Math.ceil(axis.from / 10) * 10;
  const ticks: number[] = [];
  for (let y = firstTick; y <= axis.to; y += 10) ticks.push(y);

  return (
    <div ref={scrollerRef} className="-mx-5 overflow-x-auto px-5 pb-2" data-testid="pair-life-chart">
      <svg
        viewBox={`0 0 ${W} 330`}
        role="img"
        aria-label={t('between.life.chartLabel')}
        className="block w-full"
        style={{ minWidth: MIN_WIDTH }}
      >
        {rows.map(({ side, kind, y, h }) => {
          const periods = kind === 'pinnacle' ? side.pinnacles : side.challenges;
          return (
            <g key={`${side.who}-${kind}`}>
              {kind === 'pinnacle' ? (
                <text x={PAD} y={y - 10} className="fill-[var(--muted)] font-mono text-[11px] uppercase tracking-widest">
                  {side.label} · pinnacles and challenges
                </text>
              ) : null}
              {periods.map((p) => {
                const [x0, x1] = span(side, p);
                const active = isCurrent(side, kind, p);
                const digit = kind === 'pinnacle' ? rootOf(p.value) : p.value;
                return (
                  <g key={p.n}>
                    <rect
                      x={x0}
                      y={y}
                      width={Math.max(2, x1 - x0 - 2)}
                      height={h}
                      rx={6}
                      style={{ fill: kind === 'pinnacle' ? `var(--n${digit})` : 'var(--n0)', stroke: active ? 'var(--primary)' : 'var(--line)', strokeWidth: active ? 2.5 : 1 }}
                    />
                    <text x={x0 + 10} y={y + (kind === 'pinnacle' ? 30 : 20)} style={{ fill: `var(--d${digit})` }} className={`font-serif ${kind === 'pinnacle' ? 'text-[24px]' : 'text-[18px]'}`}>
                      {kind === 'pinnacle' ? p.display : p.value}
                    </text>
                    <text x={Math.max(x0 + 40, x1 - 12)} y={y + 14} textAnchor="end" className="fill-[var(--muted)] font-mono text-[10px]">
                      {kind === 'pinnacle' ? 'P' : 'C'}
                      {p.n}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        <line x1={PAD} x2={W - PAD} y1={AXIS} y2={AXIS} stroke="var(--line-strong)" />
        {ticks.map((year) => (
          <g key={year}>
            <line x1={X(year)} x2={X(year)} y1={AXIS} y2={AXIS + 6} stroke="var(--line-strong)" />
            <text x={X(year)} y={AXIS + 22} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[11px]">
              {year}
            </text>
          </g>
        ))}

        <g aria-hidden="true" data-testid="pair-life-now">
          <line x1={nowX} x2={nowX} y1={26} y2={AXIS} stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="3 3" />
          <rect x={nowX - 20} y={4} width={40} height={20} rx={5} style={{ fill: 'var(--primary)' }} />
          <text x={nowX} y={19} textAnchor="middle" style={{ fill: '#ffffff' }} className="font-mono text-[11px] uppercase tracking-widest">
            now
          </text>
        </g>
      </svg>
    </div>
  );
}
