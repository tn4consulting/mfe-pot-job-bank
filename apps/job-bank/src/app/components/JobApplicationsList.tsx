// See App.tsx's own comment on this same import -- required for the
// federated build's classic JSX transform.
import * as React from 'react';
import { useEffect, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { JobApplication } from 'job-bank-data-access';
import { HttpJobBankApiClient } from 'job-bank-data-access';
import { loadRuntimeConfig } from '../../runtime-config';
import { assetBaseUrl } from '../asset-base-url';
import { useLocale } from '../use-locale';
import { useTranslations } from '../use-translations';

const STATUS_PILL_STYLE: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.15rem 0.6rem',
  borderRadius: '1rem',
  fontSize: '0.85rem',
  backgroundColor: '#d8e8fb',
  color: '#26374a',
};

/**
 * Exposed as a federated widget (see federation.config.mjs's
 * './JobApplicationsWidget') for dashboard to embed via the
 * shell-mediated JOB_APPLICATIONS_WIDGET_LOADER token, rather than
 * dashboard-bff proxying this data on job-bank's behalf. Does its own
 * setup entirely, with no props -- same reasoning as `App`, see its own
 * comment: a React widget mounted via `REACT_MOUNTER` has no
 * host-provided `REMOTE_PROVIDERS` equivalent to receive props from.
 *
 * Styled with inline styles rather than a CSS class: apps/job-bank/src/
 * styles.css is an unwired placeholder (not imported by index.html or any
 * component today), and wiring it up properly is a separate, pre-existing
 * gap this widget doesn't take on.
 */
export function JobApplicationsList() {
  const [applications, setApplications] = useState<JobApplication[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const locale = useLocale();
  const { t } = useTranslations(assetBaseUrl, locale);

  useEffect(() => {
    const session = getStoredSession();
    if (!session) {
      return;
    }
    let cancelled = false;
    loadRuntimeConfig(assetBaseUrl)
      .then((runtimeConfig) =>
        new HttpJobBankApiClient(runtimeConfig.jobBankBffBaseUrl).getApplications(session.sub),
      )
      .then((result) => {
        if (!cancelled) {
          setApplications(result);
        }
      })
      .catch((err) => {
        console.error('Failed to load job applications', err);
        if (!cancelled) {
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="job-applications-list">
      <h2>{t('jobApplications.heading')}</h2>
      {loadError ? (
        <p role="alert">{t('jobApplications.unavailable')}</p>
      ) : applications === null ? null : applications.length === 0 ? (
        <p>{t('jobApplications.empty')}</p>
      ) : (
        <ul>
          {applications.map((application) => (
            <li key={application.id}>
              <strong>{application.jobTitle ?? t('jobApplications.unknownPosition')}</strong> —{' '}
              {application.employer ?? t('jobApplications.unknownEmployer')}{' '}
              <span style={STATUS_PILL_STYLE}>{application.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
