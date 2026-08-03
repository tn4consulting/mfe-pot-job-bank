// See App.tsx's own comment on this same import -- required for the
// federated build's classic JSX transform.
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { JobBankApiClient, JobPosting } from 'job-bank-data-access';
import type { ScdsListColumn } from '@tn4consulting/shared-ui-scds-core';
import '../../register-scds';

type ScdsMultiColumnListElement = HTMLElement & {
  items: unknown[];
  columns: ScdsListColumn[];
};

const COLUMNS: ScdsListColumn[] = [
  { id: 'title', header: 'Job title', cell: (item) => (item as JobPosting).title, priority: 'primary' },
  { id: 'employer', header: 'Employer', cell: (item) => (item as JobPosting).employer },
  { id: 'location', header: 'Location', cell: (item) => (item as JobPosting).location },
  { id: 'postedDate', header: 'Posted', cell: (item) => (item as JobPosting).postedDate, priority: 'secondary' },
];

export function FeatureSearch({ apiClient }: { apiClient: JobBankApiClient }) {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listElRef = useRef<ScdsMultiColumnListElement | null>(null);

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
    list.setAttribute('empty-label', 'No job postings found.');
    list.setAttribute('list-label', 'Job postings');
    list.columns = COLUMNS;
    listElRef.current = list;
    container.appendChild(list);
    return () => {
      container.removeChild(list);
      listElRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (listElRef.current) {
      listElRef.current.items = postings;
    }
  }, [postings]);

  return (
    <section className="job-search">
      <h1>Job Bank — Job search</h1>
      {loadError ? <p role="alert">Job postings are temporarily unavailable.</p> : <div ref={containerRef} />}
    </section>
  );
}
