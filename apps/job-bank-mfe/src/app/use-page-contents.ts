import { useEffect, useState } from 'react';
import type { ContentClient, PageContent } from '@tn4consulting/shared-content-client';
import type { Locale } from '@tn4consulting/shared-i18n';

/**
 * React equivalent of the batch-fetch + re-fetch-on-locale-change pattern
 * every converted app's own App.tsx already uses for its single intro
 * block (see App.tsx), generalized to a component-local set of CMS keys.
 * CMS content isn't reactive by default, so this re-fetches whenever
 * `locale` changes.
 */
export function usePageContents(
  contentClient: ContentClient | null,
  keys: readonly string[],
  locale: Locale,
): Record<string, PageContent> {
  const [content, setContent] = useState<Record<string, PageContent>>({});

  useEffect(() => {
    if (!contentClient) {
      return;
    }
    let cancelled = false;
    contentClient
      .getPageContents([...keys], locale === 'fr' ? 'fr' : 'en')
      .then((result) => {
        if (!cancelled) {
          setContent(result);
        }
      })
      .catch((err) => {
        console.error('Failed to load page content', err);
      });
    return () => {
      cancelled = true;
    };
    // `keys` is deliberately omitted -- every call site passes a
    // module-level constant array, so including it would only add a
    // reference-identity footgun with no real effect.
  }, [contentClient, locale]);

  return content;
}
