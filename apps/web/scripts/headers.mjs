// Writes the hosting headers from one definition: Cloudflare Pages and Netlify
// (_headers), Vercel (vercel.json) and the local static server used by the
// end-to-end tests (serve.json). Run by `npm run build`.
//
// The Content-Security-Policy is the technical half of the privacy promise:
// connect-src 'self' means the page cannot send anything to another origin,
// even if a bug tried. Next's static export needs inline scripts and styles to
// boot, hence 'unsafe-inline' for those two and nothing else.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const analytics = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? 'https://plausible.io' : '';

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${analytics ? ` ${analytics}` : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${analytics ? ` ${analytics}` : ''}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const security = {
  'Content-Security-Policy': csp,
  // The address fragment never leaves the browser, and no page sends a Referer at all.
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const immutable = 'public, max-age=31536000, immutable';
const rules = [
  { source: '/(.*)', headers: security },
  // Released content is a new directory every time, so it can be cached for good.
  { source: '/content/v(.*)', headers: { 'Cache-Control': immutable } },
  { source: '/content/current.json', headers: { 'Cache-Control': 'public, max-age=300' } },
  { source: '/_next/static/(.*)', headers: { 'Cache-Control': immutable } },
];

const toLines = (headers) => Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`);

const underscoreHeaders = [
  '/*',
  ...toLines(security),
  '/content/v*',
  `  Cache-Control: ${immutable}`,
  '/content/current.json',
  '  Cache-Control: public, max-age=300',
  '/_next/static/*',
  `  Cache-Control: ${immutable}`,
  '',
].join('\n');

const asArray = (headers) => Object.entries(headers).map(([key, value]) => ({ key, value }));

mkdirSync(join(root, 'public'), { recursive: true });
writeFileSync(join(root, 'public', '_headers'), underscoreHeaders);
writeFileSync(
  join(root, 'public', 'serve.json'),
  `${JSON.stringify({ cleanUrls: true, headers: rules.map((r) => ({ source: r.source.replace('(.*)', '**'), headers: asArray(r.headers) })) }, null, 2)}\n`,
);
writeFileSync(
  join(root, 'vercel.json'),
  `${JSON.stringify({ headers: rules.map((r) => ({ source: r.source, headers: asArray(r.headers) })) }, null, 2)}\n`,
);
console.log('Wrote public/_headers, public/serve.json and vercel.json');
