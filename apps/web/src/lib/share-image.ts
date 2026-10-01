export type ShareRow = { label: string; value: string };

export type ShareSpec = {
  title: string;
  subtitle?: string;
  rows: ShareRow[];
  footer: string;
};

export const SHARE_SIZE = { width: 1080, height: 1350 } as const;

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

  const serif = family('--font-newsreader', "Georgia, 'Times New Roman', serif");
  const sans = family('--font-geist-sans', "'Helvetica Neue', Arial, sans-serif");
  const mono = family('--font-geist-mono', 'ui-monospace, Menlo, monospace');

  ctx.fillStyle = '#faf7ff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#e6def4';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, width - 96, height - 96);

  ctx.fillStyle = '#5b21b6';
  ctx.font = `500 26px ${mono}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(spec.title.toUpperCase().split('').join(String.fromCharCode(8202)), 96, 140);

  if (spec.subtitle) {
    ctx.fillStyle = '#1f1640';
    ctx.font = `500 64px ${serif}`;
    ctx.fillText(spec.subtitle, 96, 230);
  }

  const cols = 2;
  const cellW = (width - 192) / cols;
  const cellH = 250;
  const top = spec.subtitle ? 300 : 230;
  const tints = ['#ffd9e0', '#cfebfa', '#fff0b3', '#ddf3c9', '#e3d9ff', '#ffddbf'];
  const deep = ['#be123c', '#0369a1', '#a16207', '#4d7c0f', '#6d28d9', '#c2410c'];
  spec.rows.forEach((row, i) => {
    const x = 96 + (i % cols) * cellW;
    const y = top + Math.floor(i / cols) * cellH;
    ctx.fillStyle = tints[i % tints.length] as string;
    ctx.fillRect(x, y, cellW - 24, cellH - 24);
    ctx.strokeStyle = deep[i % deep.length] as string;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, cellW - 24, cellH - 24);
    ctx.lineWidth = 2;
    ctx.fillStyle = '#5b5275';
    ctx.font = `500 22px ${mono}`;
    ctx.fillText(row.label.toUpperCase(), x + 32, y + 56);
    ctx.fillStyle = deep[i % deep.length] as string;
    ctx.font = `500 120px ${serif}`;
    ctx.fillText(row.value, x + 32, y + 175);
  });

  ctx.fillStyle = '#5b5275';
  ctx.font = `400 24px ${sans}`;
  ctx.fillText('Numerology is a symbolic tradition, for reflection or fun.', 96, height - 150);
  ctx.fillStyle = '#5b21b6';
  ctx.font = `500 30px ${serif}`;
  ctx.fillText(spec.footer, 96, height - 100);
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
