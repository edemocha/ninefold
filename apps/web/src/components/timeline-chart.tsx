'use client';

import { scaleLinear } from 'd3-scale';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { PeriodReading, TimelineReading } from '@numerology/composer';
import { t } from '@/lib/t';

const W = 960;
const PAD = 28;
const X = scaleLinear().domain([0, 101]).range([PAD, W - PAD]);

const ROW = {
  pinnacle: { y: 50, h: 52 },
  challenge: { y: 138, h: 40 },
  years: { y: 218, h: 46 },
  axis: 290,
} as const;

const rootOf = (value: number) => (value === 11 ? 2 : value === 22 ? 4 : value === 33 ? 6 : value);

function bandEnd(p: PeriodReading): number {
  return p.ageTo === null ? 101 : p.ageTo + 1;
}

/**
 * The life timeline: four pinnacles and four challenges on an age axis, the
 * personal-year strip for ages 0 to 100, and a "you are here" marker you can
 * drag, or focus and move with the arrow keys.
 */
export function TimelineChart({
  timeline,
  age,
  onAge,
  currentAge,
}: {
  timeline: TimelineReading;
  age: number;
  onAge: (age: number) => void;
  currentAge: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // On a narrow screen the chart scrolls sideways: start with "you are here" in view.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    el.scrollLeft = (X(currentAge + 0.5) / W) * el.scrollWidth - el.clientWidth / 2;
  }, [currentAge]);

  const ageFromPointer = useCallback((clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    return Math.min(100, Math.max(0, Math.floor(X.invert(x))));
  }, []);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
    setDragging(true);
    onAge(ageFromPointer(e.clientX));
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging) onAge(ageFromPointer(e.clientX));
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -10, PageUp: 10 };
    if (e.key in step) {
      e.preventDefault();
      onAge(Math.min(100, Math.max(0, age + (step[e.key] as number))));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onAge(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onAge(100);
    }
  };

  const tick = timeline.years[age];
  const markerX = X(age + 0.5);
  const cell = X(1) - X(0);
  const valueText = tick
    ? `Age ${age}, ${tick.year}, personal year ${tick.display}`
    : `Age ${age}`;

  return (
    <div>
      <div ref={scrollerRef} className="-mx-5 overflow-x-auto px-5 pb-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} 372`}
          role="group"
          aria-label="Life timeline from age 0 to 100"
          className="block min-w-[860px] w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          data-testid="timeline-svg"
        >
          <text x={PAD} y={ROW.pinnacle.y - 12} className="fill-[var(--muted)] font-mono text-[11px] uppercase tracking-widest">
            Pinnacles
          </text>
          {timeline.pinnacles.map((p) => {
            const x0 = X(p.ageFrom);
            const x1 = X(bandEnd(p));
            const active = age >= p.ageFrom && (p.ageTo === null || age <= p.ageTo);
            return (
              <g key={`p${p.n}`}>
                <rect
                  x={x0}
                  y={ROW.pinnacle.y}
                  width={x1 - x0 - 2}
                  height={ROW.pinnacle.h}
                  style={{ fill: active ? 'var(--mark)' : `var(--n${rootOf(p.value)})`, stroke: active ? 'var(--ink-strong)' : 'var(--line-strong)', strokeWidth: active ? 2.5 : 1 }}
                />
                <text x={x0 + 10} y={ROW.pinnacle.y + 33} style={{ fill: `var(--d${rootOf(p.value)})` }} className="font-serif text-[26px]">
                  {p.display}
                </text>
                <text x={x1 - 12} y={ROW.pinnacle.y + 20} textAnchor="end" className="fill-[var(--muted)] font-mono text-[10px]">
                  P{p.n}
                </text>
              </g>
            );
          })}

          <text x={PAD} y={ROW.challenge.y - 12} className="fill-[var(--muted)] font-mono text-[11px] uppercase tracking-widest">
            Challenges
          </text>
          {timeline.challenges.map((p) => {
            const x0 = X(p.ageFrom);
            const x1 = X(bandEnd(p));
            const active = age >= p.ageFrom && (p.ageTo === null || age <= p.ageTo);
            return (
              <g key={`c${p.n}`}>
                <rect
                  x={x0}
                  y={ROW.challenge.y}
                  width={x1 - x0 - 2}
                  height={ROW.challenge.h}
                  style={{ fill: active ? 'var(--mark)' : 'var(--n0)', stroke: active ? 'var(--ink-strong)' : 'var(--line-strong)', strokeWidth: active ? 2.5 : 1 }}
                />
                <text x={x0 + 10} y={ROW.challenge.y + 27} style={{ fill: `var(--d${p.value})` }} className="font-serif text-[22px]">
                  {p.value}
                </text>
                <text x={x1 - 12} y={ROW.challenge.y + 16} textAnchor="end" className="fill-[var(--muted)] font-mono text-[10px]">
                  C{p.n}
                </text>
              </g>
            );
          })}

          <text x={PAD} y={ROW.years.y - 12} className="fill-[var(--muted)] font-mono text-[11px] uppercase tracking-widest">
            Personal year
          </text>
          {timeline.years.map((y) => {
            const digit = rootOf(y.value);
            return (
              <g key={y.age}>
                <rect
                  x={X(y.age)}
                  y={ROW.years.y}
                  width={Math.max(1, cell - 1)}
                  height={ROW.years.h}
                  style={{ fill: `var(--n${digit})` }}
                />
                <text
                  x={X(y.age) + cell / 2}
                  y={ROW.years.y + 28}
                  textAnchor="middle"
                  style={{ fill: `var(--d${digit})` }}
                  className="font-mono text-[9px]"
                >
                  {digit}
                </text>
              </g>
            );
          })}

          <line x1={PAD} x2={W - PAD} y1={ROW.axis} y2={ROW.axis} stroke="var(--line-strong)" />
          {Array.from({ length: 11 }, (_, i) => i * 10).map((a) => (
            <g key={a}>
              <line x1={X(a)} x2={X(a)} y1={ROW.axis} y2={ROW.axis + 6} stroke="var(--line-strong)" />
              <text x={X(a)} y={ROW.axis + 20} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[11px]">
                {a}
              </text>
              {timeline.years[a] ? (
                <text x={X(a)} y={ROW.axis + 36} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[10px] opacity-70">
                  {timeline.years[a]?.year}
                </text>
              ) : null}
            </g>
          ))}

          {currentAge >= 0 && currentAge <= 100 ? (
            <g aria-hidden="true" data-testid="you-are-here">
              <rect x={X(currentAge)} y={ROW.years.y + ROW.years.h} width={Math.max(1, cell - 1)} height={4} fill="var(--primary)" />
              <line x1={X(currentAge) + cell / 2} x2={X(currentAge) + cell / 2} y1={ROW.years.y + ROW.years.h + 4} y2={318} stroke="var(--primary)" strokeWidth={1} />
              <text x={X(currentAge) + cell / 2} y={338} textAnchor="middle" className="fill-[var(--primary)] font-mono text-[11px] uppercase tracking-widest">
                you are here
              </text>
            </g>
          ) : null}

          <g
            role="slider"
            tabIndex={0}
            aria-label={t('timeline.hint')}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={age}
            aria-valuetext={valueText}
            onKeyDown={onKeyDown}
            className="cursor-grab outline-none focus-visible:[&_.handle]:stroke-[var(--focus)] focus-visible:[&_.handle]:stroke-[3px]"
            data-testid="timeline-marker"
          >
            <line x1={markerX} x2={markerX} y1={30} y2={ROW.axis} stroke="var(--primary)" strokeWidth={1.5} strokeDasharray="3 3" />
            <rect x={markerX - 22} y={6} width={44} height={24} className="handle" style={{ fill: 'var(--primary)', stroke: 'var(--primary)' }} />
            <text x={markerX} y={22} textAnchor="middle" style={{ fill: '#ffffff' }} className="font-mono text-[12px]">
              {age}
            </text>
          </g>
        </svg>
      </div>
      <p className="mt-2 text-sm text-muted">{t('timeline.hint')}</p>
    </div>
  );
}
