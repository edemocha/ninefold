import type { Metadata } from 'next';
import { Disclaimer } from '@/components/disclaimer';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'What this site is for, and what it is not.',
};

export default function TermsPage() {
  return (
    <article className="reading mx-auto max-w-3xl px-5 py-14 text-[1.05rem] leading-relaxed">
      <p className="eyebrow mb-4">Terms</p>
      <h1 className="text-5xl">What this site is for</h1>

      <Disclaimer className="mt-6 !text-base" />

      <h2 className="mt-12 mb-3 text-2xl">Use</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>The site is free and offered for reflection and entertainment. It makes no predictions about events in anyone&apos;s life.</li>
        <li>It does not give medical, financial, legal or relationship advice, and nothing on it should be used to decide those matters.</li>
        <li>Between us does not rate or rule on any pair, and it does not describe the person you add, who has not been asked. It says what the numbers tend to stand for and gives you things to talk about.</li>
        <li>The calculations follow published conventions that disagree with each other. Different conventions can give different numbers for the same person. The Method page shows exactly which one is in use.</li>
        <li>The site stores nothing about you, so there are no accounts to manage and no data to delete. See the Privacy page.</li>
        <li>The readings are provided as they are, without any promise that they are accurate, complete or suitable for a purpose.</li>
      </ul>

      <h2 className="mt-12 mb-3 text-2xl">Who it is for</h2>
      <p>
        Numerology is a symbolic tradition, and some people and religious traditions regard divination of any kind as inappropriate. If that includes you, this site is not for you.
      </p>
    </article>
  );
}
