import {
  ContentClient,
  PageContent,
  StaticContentClient,
  StrapiContentClient,
} from '@tn4consulting/shared-content-client';

export const INTRO_CONTENT_KEY = 'job-bank.intro';

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
};

export function createContentClient(strapiBaseUrl: string | undefined): ContentClient {
  return strapiBaseUrl
    ? new StrapiContentClient(strapiBaseUrl)
    : new StaticContentClient(STATIC_CONTENT);
}
