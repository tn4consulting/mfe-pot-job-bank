// See App.tsx's own comment on this same import -- required for the
// federated build's classic JSX transform.
import * as React from 'react';
import { useEffect, useState } from 'react';
import type { JobBankApiClient, JobPosting } from 'job-bank-data-access';

export function FeatureSearch({ apiClient }: { apiClient: JobBankApiClient }) {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loadError, setLoadError] = useState(false);

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

  return (
    <section className="job-search">
      <h1>Job Bank — Job search</h1>
      {loadError ? (
        <p role="alert">Job postings are temporarily unavailable.</p>
      ) : (
        <ul>
          {postings.map((posting) => (
            <li key={posting.id}>
              <strong>{posting.title}</strong> — {posting.employer}, {posting.location} (posted{' '}
              {posting.postedDate})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
