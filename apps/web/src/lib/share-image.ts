import { CREDIT } from './site';

export type ShareRow = { label: string; value: string };

export type ShareSpec = {
  title: string;
  subtitle?: string;
  rows: ShareRow[];
  footer: string;
};

export const SHARE_SIZE = { width: 1080, height: 1350 } as const;
const SHARE_CREDIT = CREDIT;

function family(variable: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  return raw ? `${raw}, ${fallback}` : fallback;
}

function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** The colour a value takes: its own number, with masters reduced to their root. Anything else is neutral. */
function hueOf(value: string): number {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 0;
  if (n === 11) return 2;
  if (n === 22) return 4;
  if (n === 33) return 6;
  return n > 9 ? 0 : n;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draws a share card on a canvas, in the browser. It is given numbers and
 * labels only, so the picture cannot carry a name or a birth date.
 */
export function drawShareImage(canvas: HTMLCanvasElement, spec: ShareSpec): void {
  const { width, height } = SHARE_SIZE;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const display = family('--font-bricolage', "'Helvetica Neue', Arial, sans-serif");
  const sans = family('--font-geist', "'Helvetica Neue', Arial, sans-serif");

  // The same look as the site: a white page, blue-black ink, each number on its own colour.
  const INK = token('--ink-strong', '#0b0b1e');
  const MUTED = token('--muted', '#50536b');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // The nine colours as nine bars along the top.
  for (let n = 1; n <= 9; n += 1) {
    ctx.fillStyle = token(`--b${n}`, '#cccccc');
    ctx.fillRect(((n - 1) * width) / 9, 0, width / 9 + 1, 28);
  }

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUTED;
  ctx.font = `600 30px ${sans}`;
  ctx.fillText(spec.title, 96, 140);

  if (spec.subtitle) {
    ctx.fillStyle = INK;
    ctx.font = `800 76px ${display}`;
    ctx.fillText(spec.subtitle, 96, 236);
  }

  const cols = 2;
  const gap = 24;
  const cellW = (width - 192 - gap) / cols;
  const cellH = 250;
  const top = spec.subtitle ? 290 : 190;
  spec.rows.forEach((row, i) => {
    const x = 96 + (i % cols) * (cellW + gap);
    const y = top + Math.floor(i / cols) * (cellH + gap);
    ctx.fillStyle = token(`--b${hueOf(row.value)}`, '#e3e5ef');
    roundedRect(ctx, x, y, cellW, cellH, 36);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.font = `600 28px ${sans}`;
    ctx.fillText(row.label, x + 36, y + 62);
    ctx.font = `800 128px ${display}`;
    ctx.fillText(row.value, x + 36, y + 200);
  });

  ctx.fillStyle = MUTED;
  ctx.font = `400 26px ${sans}`;
  ctx.fillText('Numerology is a symbolic tradition, for reflection or fun.', 96, height - 150);
  ctx.fillStyle = INK;
  ctx.font = `800 40px ${display}`;
  ctx.fillText(spec.footer, 96, height - 92);

  // The maker's credit, bottom right.
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${sans}`;
  ctx.textAlign = 'right';
  ctx.fillText(SHARE_CREDIT, width - 96, height - 92);
  ctx.textAlign = 'left';
}

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not make the image.'))), 'image/png');
  });
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
