import {
  ContentClient,
  PageContent,
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

function entry(key: string, en: string, fr: string): Record<'en' | 'fr', PageContent> {
  return {
    en: { key, title: en, body: '' },
    fr: { key, title: fr, body: '' },
  };
}

// Baked fallback for a no-CMS build -- kept in sync with the seed data in
// mfe-pot-platform's tools/cms/strapi/src/index.ts by hand for now; see
// mfe-pot-dashboard's own content-client.token.ts for the same pattern.
const STATIC_CONTENT: Record<string, Record<'en' | 'fr', PageContent>> = {
  [INTRO_CONTENT_KEY]: {
    en: {
      key: INTRO_CONTENT_KEY,
      title: 'Job Bank',
      body: 'Search job postings and submit applications, all in one place.',
    },
    fr: {
      key: INTRO_CONTENT_KEY,
      title: 'Guichet-Emplois',
      body: "Recherchez des offres d'emploi et soumettez vos candidatures, le tout au même endroit.",
    },
  },
  'job-bank.search.heading': entry('job-bank.search.heading', 'Job Bank — Job search', "Guichet-Emplois — Recherche d'emploi"),
  'job-bank.search.error': entry(
    'job-bank.search.error',
    'Job postings are temporarily unavailable.',
    "Les offres d'emploi sont temporairement indisponibles.",
  ),
  'job-bank.search.table.title': entry('job-bank.search.table.title', 'Job title', 'Titre du poste'),
  'job-bank.search.table.employer': entry('job-bank.search.table.employer', 'Employer', 'Employeur'),
  'job-bank.search.table.location': entry('job-bank.search.table.location', 'Location', 'Lieu'),
  'job-bank.search.table.posted': entry('job-bank.search.table.posted', 'Posted', 'Date de publication'),
  'job-bank.search.list.emptyLabel': entry(
    'job-bank.search.list.emptyLabel',
    'No job postings found.',
    "Aucune offre d'emploi trouvée.",
  ),
  'job-bank.search.list.label': entry('job-bank.search.list.label', 'Job postings', "Offres d'emploi"),
  'job-bank.apply.heading': entry('job-bank.apply.heading', 'Apply for a job', 'Postuler à un emploi'),
  'job-bank.apply.error': entry(
    'job-bank.apply.error',
    'Job applications are temporarily unavailable.',
    'Les candidatures sont temporairement indisponibles.',
  ),
  'job-bank.apply.label': entry('job-bank.apply.label', 'Choose a posting', 'Choisissez une offre'),
  'job-bank.apply.button': entry('job-bank.apply.button', 'Apply now', 'Postuler maintenant'),
  'job-bank.apply.confirmation': entry(
    'job-bank.apply.confirmation',
    'Application {id} submitted — status: {status}.',
    'Candidature {id} soumise — état : {status}.',
  ),
  'job-bank.applications-list.heading': entry('job-bank.applications-list.heading', 'My Job Applications', 'Mes candidatures'),
  'job-bank.applications-list.empty': entry(
    'job-bank.applications-list.empty',
    'No job applications on file.',
    'Aucune candidature au dossier.',
  ),
  'job-bank.applications-list.unavailable': entry(
    'job-bank.applications-list.unavailable',
    'Job applications are temporarily unavailable.',
    'Les candidatures sont temporairement indisponibles.',
  ),
  'job-bank.applications-list.unknownPosition': entry(
    'job-bank.applications-list.unknownPosition',
    'Unknown position',
    'Poste inconnu',
  ),
  'job-bank.applications-list.unknownEmployer': entry(
    'job-bank.applications-list.unknownEmployer',
    'Unknown employer',
    'Employeur inconnu',
  ),
  'job-bank.applications-list.table.position': entry('job-bank.applications-list.table.position', 'Position', 'Poste'),
  'job-bank.applications-list.table.employer': entry('job-bank.applications-list.table.employer', 'Employer', 'Employeur'),
  'job-bank.applications-list.table.status': entry('job-bank.applications-list.table.status', 'Status', 'État'),
};

export function createContentClient(strapiBaseUrl: string | undefined): ContentClient {
  return strapiBaseUrl
    ? new StrapiContentClient(strapiBaseUrl)
    : new StaticContentClient(STATIC_CONTENT);
}
