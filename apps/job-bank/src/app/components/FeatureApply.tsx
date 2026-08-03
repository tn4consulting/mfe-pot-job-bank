// See App.tsx's own comment on this same import -- required for the
// federated build's classic JSX transform.
import * as React from 'react';
import { useEffect, useState } from 'react';
import type { JobApplication, JobBankApiClient, JobPosting } from 'job-bank-data-access';
import { getStoredSession } from '@tn4consulting/shared-auth/core';

export function FeatureApply({ apiClient }: { apiClient: JobBankApiClient }) {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<JobApplication | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getPostings()
      .then((result) => {
        if (cancelled) {
          return;
        }
        setPostings(result);
        setSelectedJobId(result[0]?.id ?? '');
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

  async function submit() {
    const session = getStoredSession();
    if (!session || !selectedJobId) {
      return;
    }
    setSubmitting(true);
    try {
      setConfirmation(await apiClient.apply(selectedJobId, session.sub));
    } catch (err) {
      console.error('Failed to submit job application', err);
      setLoadError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="job-apply">
      <h2>Apply for a job</h2>
      {confirmation ? (
        <p role="status">
          Application {confirmation.id} submitted — status: {confirmation.status}.
        </p>
      ) : loadError ? (
        <p role="alert">Job applications are temporarily unavailable.</p>
      ) : (
        <>
          <label htmlFor="job-apply-select">Choose a posting</label>
          <select
            id="job-apply-select"
            name="jobId"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            {postings.map((posting) => (
              <option key={posting.id} value={posting.id}>
                {posting.title} — {posting.employer}
              </option>
            ))}
          </select>
          <button type="button" disabled={submitting || !selectedJobId} onClick={submit}>
            Apply now
          </button>
        </>
      )}
    </section>
  );
}
