import { CORE_KEYS } from '@numerology/content';
import type { CoreKey } from '@numerology/engine';
import { NumberDetail } from '@/components/number-detail';

export const dynamicParams = false;

export function generateStaticParams() {
  return CORE_KEYS.map((key) => ({ key }));
}

export default async function NumberPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <NumberDetail coreKey={key as CoreKey} />;
}
