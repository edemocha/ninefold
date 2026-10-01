import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono, Newsreader } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { analyticsDomain } from '@/lib/analytics';
import { AUTHOR, SITE_NAME, SITE_URL } from '@/lib/site';
import { t } from '@/lib/t';

// Fonts are downloaded at build time and served from this site, so a visit
// makes no request to a font host.
const serif = Newsreader({ subsets: ['latin'], variable: '--font-newsreader', style: ['normal', 'italic'], display: 'swap' });
const sans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' });
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME}: numerology that shows its math`, template: `%s · ${SITE_NAME}` },
  description: t('site.tagline'),
  authors: [{ name: AUTHOR }],
  creator: AUTHOR,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
  themeColor: '#faf7ff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter />
        </Providers>
        {analyticsDomain ? (
          <Script defer data-domain={analyticsDomain} src="https://plausible.io/js/script.manual.js" strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
