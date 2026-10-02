import type { ComponentType } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarBlank,
  DownloadSimple,
  Image as ImageIcon,
  LockSimple,
  Minus,
  Plus,
  Printer,
  X,
} from '@phosphor-icons/react/dist/ssr';

const ICONS = {
  left: ArrowLeft,
  right: ArrowRight,
  plus: Plus,
  minus: Minus,
  download: DownloadSimple,
  print: Printer,
  close: X,
  calendar: CalendarBlank,
  image: ImageIcon,
  lock: LockSimple,
} as const;

export type IconName = keyof typeof ICONS;

/** Phosphor icons, bold weight throughout, so every glyph has the same stroke. */
export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  const Glyph: ComponentType<{ size?: number; weight?: 'bold'; className?: string; 'aria-hidden'?: boolean }> = ICONS[name];
  return <Glyph size={size} weight="bold" className={className} aria-hidden />;
}

/** The nine colours of the nine numbers, as a 3 by 3 block. It is the logo. */
export function Mark({ size = 28 }: { size?: number }) {
  const cell = size / 3;
  const gap = Math.max(1.5, size * 0.07);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
      {Array.from({ length: 9 }, (_, i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        return <rect key={i} x={c * cell + gap / 2} y={r * cell + gap / 2} width={cell - gap} height={cell - gap} rx={cell * 0.28} style={{ fill: `var(--b${i + 1})` }} />;
      })}
    </svg>
  );
}
