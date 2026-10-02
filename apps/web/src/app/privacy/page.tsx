import type { Metadata } from 'next';
import { t } from '@/lib/t';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'Everything is calculated in your browser. Nothing you type is sent or saved.',
};

export default function PrivacyPage() {
  return (
    <article className="reading mx-auto max-w-3xl px-5 py-14 text-[1.05rem] leading-relaxed">
      <p className="eyebrow mb-4">Privacy</p>
      <h1 className="text-5xl">Your details stay on your device</h1>
      <p className="mt-6 text-lg text-muted">{t('privacy.line')}</p>

      <h2 className="mt-14 mb-3 text-2xl">What happens to what you type</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Your name and birth date are used by code running in your browser. They are not sent to a server, not saved on your device and not placed in the page address.</li>
        <li>They live in the memory of the open tab. Reloading the page or pressing &ldquo;Forget my details&rdquo; clears them.</li>
        <li>The page address after the # holds only your view and the conventions you chose, such as the date rule. It never holds a name or a birth date, and the part after # is not sent to a server.</li>
        <li>No cookies, local storage or similar are used to remember you.</li>
        <li>
          If you add someone on Between us (up to four people), their birth date and nickname, and their full name if you choose to give it, are treated exactly like yours: they stay in the memory of the open tab, and they are not sent, saved, put in the page address or put in the share image. The Names screen shows the letters of a name in its arithmetic, as it does for yours.
          &ldquo;Forget my details&rdquo; clears both of you. Only add details you are comfortable using, and ask the person first if you can.
        </li>
      </ul>

      <h2 className="mt-12 mb-3 text-2xl">What is loaded</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>The page, its fonts and its readings are static files served from this site. Fetching them does not involve anything you typed.</li>
        <li>Exports (the year report, calendar files and share image) are made in your browser and carry numbers only. They do not contain your name or birth date.</li>
        <li>The Two numbers pages are static files with no personal data in them. Their form for two birth dates, with no name, works like the main one: what you type stays in the tab.</li>
      </ul>

      <h2 className="mt-12 mb-3 text-2xl">Counting visits</h2>
      <p>
        If counts are switched on, they come from a cookieless tool that records page views and a short list of events, such as that a calculation was run. Events carry no details, and the page address is sent without
        anything after the #. If your birth date, or the birth date of anyone you add, shows that someone is under 16, nothing more is sent.
      </p>

      <h2 className="mt-12 mb-3 text-2xl">The host</h2>
      <p>
        Like any website, the service that delivers these files can see that a page was requested, with the time and the visitor&apos;s network address. It never receives your name or birth date, because they are never sent.
      </p>
    </article>
  );
}
