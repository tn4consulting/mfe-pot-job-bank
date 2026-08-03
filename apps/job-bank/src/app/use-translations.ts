import { useEffect, useState } from 'react';
import { Locale } from '@tn4consulting/shared-locale-sync';

type Translations = Record<string, string>;

function flatten(obj: Record<string, unknown>, prefix = ''): Translations {
  const result: Translations = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (value && typeof value === 'object') {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    }
  }
  return result;
}

/**
 * Deliberately not i18next/react-i18next -- job-bank has exactly one real
 * translated string today (`auth.signInRequired`), same scope as the
 * Angular version's Transloco usage (most feature-component text is still
 * hardcoded English, a pre-existing gap this port doesn't fix). Fetches
 * this app's own `assets/i18n/<locale>.json` relative to `assetBaseUrl`
 * (its own origin, not the shell's -- see App.tsx's `getAssetBaseUrl`),
 * the same URL shape Transloco's own loader uses.
 */
export function useTranslations(assetBaseUrl: string, locale: Locale) {
  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    let cancelled = false;
    fetch(new URL(`assets/i18n/${locale}.json`, assetBaseUrl).href)
      .then((res) => res.json())
      .then((json: Record<string, unknown>) => {
        if (!cancelled) {
          setTranslations(flatten(json));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslations({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [assetBaseUrl, locale]);

  return { t: (key: string): string => translations[key] ?? key };
}
