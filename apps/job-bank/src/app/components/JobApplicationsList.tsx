// See App.tsx's own comment on this same import -- required for the
// federated build's classic JSX transform.
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { JobApplication } from 'job-bank-data-access';
import { HttpJobBankApiClient } from 'job-bank-data-access';
import type { ScdsListColumn } from '@tn4consulting/shared-ui-scds-core';
import { loadRuntimeConfig } from '../../runtime-config';
import { assetBaseUrl } from '../asset-base-url';
import { useLocale } from '../use-locale';
import { useTranslations } from '../use-translations';
import '../../register-scds';

type ScdsMultiColumnListElement = HTMLElement & {
  items: unknown[];
  columns: ScdsListColumn[];
};

/**
 * Exposed as a federated widget (see federation.config.mjs's
 * './JobApplicationsWidget') for dashboard to embed via the
 * shell-mediated JOB_APPLICATIONS_WIDGET_LOADER token, rather than
 * dashboard-bff proxying this data on job-bank's behalf. Does its own
 * setup entirely, with no props -- same reasoning as `App`, see its own
 * comment: a React widget mounted via `REACT_MOUNTER` has no
 * host-provided `REMOTE_PROVIDERS` equivalent to receive props from.
 */
export function JobApplicationsList() {
  const [applications, setApplications] = useState<JobApplication[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const locale = useLocale();
  const { t } = useTranslations(assetBaseUrl, locale);
  const listElRef = useRef<ScdsMultiColumnListElement | null>(null);

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

  // A callback ref, not useRef+useEffect(() => {}, []): the mount point
  // below only renders once `applications` is non-null (preserving the
  // original "render nothing while still loading" behaviour), so a plain
  // mount-once effect would find the container missing on its one run and
  // never retry. A callback ref fires exactly when React actually attaches
  // the div, whichever render that turns out to be.
  const setContainerRef = useCallback((container: HTMLDivElement | null) => {
    if (container) {
      const list = document.createElement('scds-multi-column-list') as ScdsMultiColumnListElement;
      listElRef.current = list;
      container.appendChild(list);
    } else {
      listElRef.current = null;
    }
  }, []);

  // scds-multi-column-list's `items`/`columns` are DOM properties (they're
  // non-primitive), not HTML attributes -- set imperatively, not via JSX.
  // Re-set on every `t`/locale change too, not just when `applications`
  // loads: the column `cell` closures capture `t` for the null-fallback
  // text, which would otherwise go stale after a language switch.
  useEffect(() => {
    const list = listElRef.current;
    if (!list) {
      return;
    }
    list.setAttribute('empty-label', t('jobApplications.empty'));
    list.setAttribute('list-label', t('jobApplications.heading'));
    list.columns = [
      {
        id: 'title',
        header: 'Position',
        cell: (item) => (item as JobApplication).jobTitle ?? t('jobApplications.unknownPosition'),
        priority: 'primary',
      },
      {
        id: 'employer',
        header: 'Employer',
        cell: (item) => (item as JobApplication).employer ?? t('jobApplications.unknownEmployer'),
      },
      { id: 'status', header: 'Status', cell: (item) => (item as JobApplication).status, priority: 'secondary' },
    ];
    if (applications !== null) {
      list.items = applications;
    }
  }, [applications, t]);

  return (
    <section className="job-applications-list">
      <h2>{t('jobApplications.heading')}</h2>
      {loadError ? (
        <p role="alert">{t('jobApplications.unavailable')}</p>
      ) : applications === null ? null : (
        <div ref={setContainerRef} />
      )}
    </section>
  );
}
