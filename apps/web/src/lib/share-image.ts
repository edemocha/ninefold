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

  const serif = family('--font-plex-serif', "Georgia, 'Times New Roman', serif");
  const sans = family('--font-plex-sans', "'Helvetica Neue', Arial, sans-serif");
  const mono = family('--font-plex-mono', 'ui-monospace, Menlo, monospace');

  // The same worksheet as the site: paper, ink, hard rules, one mark.
  const PAPER = '#f3f3ee';
  const INK = '#0d0d0b';
  const MUTED = '#4a4a44';
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = MUTED;
  ctx.font = `400 26px ${mono}`;
  ctx.fillText(spec.title, 96, 140);

  // A heavy rule under the title, the way a ledger heads its columns.
  ctx.fillStyle = INK;
  ctx.fillRect(96, 160, width - 192, 6);

  if (spec.subtitle) {
    ctx.fillStyle = INK;
    ctx.font = `600 64px ${serif}`;
    ctx.fillText(spec.subtitle, 96, 250);
  }

  const cols = 2;
  const cellW = (width - 192) / cols;
  const cellH = 250;
  const top = spec.subtitle ? 300 : 220;
  spec.rows.forEach((row, i) => {
    const x = 96 + (i % cols) * cellW;
    const y = top + Math.floor(i / cols) * cellH;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellW - 24, cellH - 24);
    ctx.fillStyle = MUTED;
    ctx.font = `400 24px ${mono}`;
    ctx.fillText(row.label, x + 32, y + 56);
    ctx.fillStyle = INK;
    ctx.font = `500 120px ${serif}`;
    ctx.fillText(row.value, x + 32, y + 175);
  });

  ctx.fillStyle = MUTED;
  ctx.font = `400 24px ${sans}`;
  ctx.fillText('Numerology is a symbolic tradition, for reflection or fun.', 96, height - 150);
  ctx.fillStyle = INK;
  ctx.font = `600 30px ${serif}`;
  ctx.fillText(spec.footer, 96, height - 100);

  // The maker's credit, bottom right.
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 26px ${serif}`;
  ctx.textAlign = 'right';
  ctx.fillText(SHARE_CREDIT, width - 96, height - 100);
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
