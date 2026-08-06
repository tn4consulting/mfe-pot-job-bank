// See App.tsx's own comment on this same import -- required for the
// federated build's classic JSX transform.
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { JobBankApiClient, JobPosting } from 'job-bank-data-access';
import type { ScdsListColumn } from '@tn4consulting/shared-ui-scds-core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import type { Locale } from '@tn4consulting/shared-i18n';
import { SEARCH_CONTENT_KEYS } from '../content-client';
import { usePageContents } from '../use-page-contents';
import '../../register-scds';

type ScdsMultiColumnListElement = HTMLElement & {
  items: unknown[];
  columns: ScdsListColumn[];
};

// Rendered until the CMS batch fetch resolves -- never blank, same bar
// StaticContentClient already meets as the no-CMS fallback.
const FALLBACK: Record<(typeof SEARCH_CONTENT_KEYS)[number], string> = {
  'job-bank.search.heading': 'Job Bank — Job search',
  'job-bank.search.error': 'Job postings are temporarily unavailable.',
  'job-bank.search.table.title': 'Job title',
  'job-bank.search.table.employer': 'Employer',
  'job-bank.search.table.location': 'Location',
  'job-bank.search.table.posted': 'Posted',
  'job-bank.search.list.emptyLabel': 'No job postings found.',
  'job-bank.search.list.label': 'Job postings',
};

export interface FeatureSearchProps {
  apiClient: JobBankApiClient;
  contentClient: ContentClient;
  locale: Locale;
}

export function FeatureSearch({ apiClient, contentClient, locale }: FeatureSearchProps) {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listElRef = useRef<ScdsMultiColumnListElement | null>(null);
  const content = usePageContents(contentClient, SEARCH_CONTENT_KEYS, locale);

  const label = useCallback(
    (key: (typeof SEARCH_CONTENT_KEYS)[number]): string => content[key]?.title ?? FALLBACK[key],
    [content],
  );

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getPostings()
      .then((result) => {
        if (!cancelled) {
          setPostings(result);
        }
      })
      .catch((err) => {
        console.error('Failed to load job postings', err);
        if (!cancelled) {
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  // scds-multi-column-list's `items`/`columns` are DOM properties (they're
  // non-primitive), not HTML attributes -- created and mounted imperatively
  // rather than via JSX, which sidesteps both that and the lack of any JSX
  // intrinsic-element typing for this custom element.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const list = document.createElement('scds-multi-column-list') as ScdsMultiColumnListElement;
    listElRef.current = list;
    container.appendChild(list);
    return () => {
      container.removeChild(list);
      listElRef.current = null;
    };
  }, []);

  // Re-set on every content/locale change too, not just when `postings`
  // loads: the column `cell` closures capture nothing stale (they read
  // straight off the posting), but the header labels themselves and the
  // empty/list labels need to track the current locale.
  useEffect(() => {
    const list = listElRef.current;
    if (!list) {
      return;
    }
    list.setAttribute('empty-label', label('job-bank.search.list.emptyLabel'));
    list.setAttribute('list-label', label('job-bank.search.list.label'));
    list.columns = [
      {
        id: 'title',
        header: label('job-bank.search.table.title'),
        cell: (item) => (item as JobPosting).title,
        priority: 'primary',
      },
      { id: 'employer', header: label('job-bank.search.table.employer'), cell: (item) => (item as JobPosting).employer },
      { id: 'location', header: label('job-bank.search.table.location'), cell: (item) => (item as JobPosting).location },
      {
        id: 'postedDate',
        header: label('job-bank.search.table.posted'),
        cell: (item) => (item as JobPosting).postedDate,
        priority: 'secondary',
      },
    ];
  }, [label]);

  useEffect(() => {
    if (listElRef.current) {
      listElRef.current.items = postings;
    }
  }, [postings]);

  return (
    <section className="job-search">
      <h1>{label('job-bank.search.heading')}</h1>
      {loadError ? <p role="alert">{label('job-bank.search.error')}</p> : <div ref={containerRef} />}
    </section>
  );
}
