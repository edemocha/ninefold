import en from '../../messages/en.json';

export type MessageKey = keyof typeof en;

/**
 * Looks up an interface string by its stable key. Translations map to keys, not
 * to text; swap this for next-intl when a second language arrives.
 */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const text: string = en[key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
