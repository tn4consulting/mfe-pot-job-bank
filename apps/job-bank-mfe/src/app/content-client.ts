import {
  ContentClient,
  FallbackContentClient,
  StaticContentClient,
  StrapiContentClient,
} from '@tn4consulting/shared-content-client';

export const INTRO_CONTENT_KEY = 'job-bank.intro';

export const SEARCH_CONTENT_KEYS = [
  'job-bank.search.heading',
  'job-bank.search.error',
  'job-bank.search.table.title',
  'job-bank.search.table.employer',
  'job-bank.search.table.location',
  'job-bank.search.table.posted',
  'job-bank.search.list.emptyLabel',
  'job-bank.search.list.label',
] as const;

export const APPLY_CONTENT_KEYS = [
  'job-bank.apply.heading',
  'job-bank.apply.error',
  'job-bank.apply.label',
  'job-bank.apply.button',
  'job-bank.apply.confirmation',
] as const;

export const APPLICATIONS_LIST_CONTENT_KEYS = [
  'job-bank.applications-list.heading',
  'job-bank.applications-list.empty',
  'job-bank.applications-list.unavailable',
  'job-bank.applications-list.unknownPosition',
  'job-bank.applications-list.unknownEmployer',
  'job-bank.applications-list.table.position',
  'job-bank.applications-list.table.employer',
  'job-bank.applications-list.table.status',
] as const;

/**
 * No CMS configured -> the bilingual fallback (`public/assets/content-fallback/<locale>.json`)
 * directly. CMS configured -> Strapi as primary, same fallback backing it up
 * if Strapi is unreachable/missing a key at runtime -- see `FallbackContentClient`.
 */
export function createContentClient(strapiBaseUrl: string | undefined, assetBaseUrl: string): ContentClient {
  const fallback = new StaticContentClient(assetBaseUrl);
  return strapiBaseUrl ? new FallbackContentClient(new StrapiContentClient(strapiBaseUrl), fallback) : fallback;
}
