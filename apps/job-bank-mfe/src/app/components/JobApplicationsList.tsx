// See App.tsx's own comment on this same import -- required for the
// federated build's classic JSX transform.
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getStoredSession } from '@tn4consulting/shared-auth/core';
import type { JobApplication } from 'job-bank-data-access';
import { HttpJobBankApiClient } from 'job-bank-data-access';
import type { ScdsListColumn } from '@tn4consulting/shared-ui-scds-core';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { loadRuntimeConfig } from '../../runtime-config';
import { assetBaseUrl } from '../asset-base-url';
import { useLocale } from '@tn4consulting/shared-i18n';
import { APPLICATIONS_LIST_CONTENT_KEYS, createContentClient } from '../content-client';
import { usePageContents } from '../use-page-contents';
import '../../register-scds';

type ScdsMultiColumnListElement = HTMLElement & {
  items: unknown[];
  columns: ScdsListColumn[];
};

/**
 * Rendered directly by this app's own App.tsx, and also still exposed as a
 * federated widget (see federation.config.mjs's './JobApplicationsWidget')
 * for a shell-mediated consumer to embed via the
 * JOB_APPLICATIONS_WIDGET_LOADER token -- dashboard used to embed it this
 * way, but dropped the embed since docs/msca-screenshots/dashboard.png has
 * no job-applications tile on the dashboard page; this app's own page is
 * now the one place a citizen actually sees it. Does its own setup
 * entirely, with no props -- same reasoning as `App`, see its own comment:
 * a React widget mounted via `REACT_MOUNTER` has no host-provided
 * `REMOTE_PROVIDERS` equivalent to receive props from -- which is also why
 * rendering it here needed no props threaded in either.
 */
export function JobApplicationsList() {
  const [applications, setApplications] = useState<JobApplication[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [contentClient, setContentClient] = useState<ContentClient | null>(null);
  const locale = useLocale();
  const content = usePageContents(contentClient, APPLICATIONS_LIST_CONTENT_KEYS, locale);
  const listElRef = useRef<ScdsMultiColumnListElement | null>(null);

  const label = useCallback(
    (key: (typeof APPLICATIONS_LIST_CONTENT_KEYS)[number]): string => content[key]?.title ?? key,
    [content],
  );

  useEffect(() => {
    let cancelled = false;
    loadRuntimeConfig(assetBaseUrl).then((runtimeConfig) => {
      if (!cancelled) {
        setContentClient(createContentClient(runtimeConfig.strapiBaseUrl, assetBaseUrl));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
  // Re-set on every content/locale change too, not just when `applications`
  // loads: the column `cell` closures capture the label lookup for the
  // null-fallback text, which would otherwise go stale after a language
  // switch.
  useEffect(() => {
    const list = listElRef.current;
    if (!list) {
      return;
    }
    list.setAttribute('empty-label', label('job-bank.applications-list.empty'));
    list.setAttribute('list-label', label('job-bank.applications-list.heading'));
    list.columns = [
      {
        id: 'title',
        header: label('job-bank.applications-list.table.position'),
        cell: (item) => (item as JobApplication).jobTitle ?? label('job-bank.applications-list.unknownPosition'),
        priority: 'primary',
      },
      {
        id: 'employer',
        header: label('job-bank.applications-list.table.employer'),
        cell: (item) => (item as JobApplication).employer ?? label('job-bank.applications-list.unknownEmployer'),
      },
      {
        id: 'status',
        header: label('job-bank.applications-list.table.status'),
        cell: (item) => (item as JobApplication).status,
        priority: 'secondary',
      },
    ];
    if (applications !== null) {
      list.items = applications;
    }
  }, [applications, label]);

  return (
    <section className="job-applications-list">
      <h2>{label('job-bank.applications-list.heading')}</h2>
      {loadError ? (
        <p role="alert">{label('job-bank.applications-list.unavailable')}</p>
      ) : applications === null ? null : (
        <div ref={setContainerRef} />
      )}
    </section>
  );
}
