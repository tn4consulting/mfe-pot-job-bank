import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { App } from './App';

jest.mock('./asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4203/' }));

jest.mock('../runtime-config', () => ({
  loadRuntimeConfig: jest
    .fn()
    .mockResolvedValue({ jobBankBffBaseUrl: 'http://localhost:3001', strapiBaseUrl: undefined }),
}));

const getPageContentMock = jest.fn();
const getPageContentsMock = jest.fn();
jest.mock('./content-client', () => ({
  INTRO_CONTENT_KEY: 'job-bank.intro',
  SEARCH_CONTENT_KEYS: [
    'job-bank.search.heading',
    'job-bank.search.error',
    'job-bank.search.table.title',
    'job-bank.search.table.employer',
    'job-bank.search.table.location',
    'job-bank.search.table.posted',
    'job-bank.search.list.emptyLabel',
    'job-bank.search.list.label',
  ],
  APPLY_CONTENT_KEYS: [
    'job-bank.apply.heading',
    'job-bank.apply.error',
    'job-bank.apply.label',
    'job-bank.apply.button',
    'job-bank.apply.confirmation',
  ],
  APPLICATIONS_LIST_CONTENT_KEYS: [
    'job-bank.applications-list.heading',
    'job-bank.applications-list.empty',
    'job-bank.applications-list.unavailable',
    'job-bank.applications-list.unknownPosition',
    'job-bank.applications-list.unknownEmployer',
    'job-bank.applications-list.table.position',
    'job-bank.applications-list.table.employer',
    'job-bank.applications-list.table.status',
  ],
  createContentClient: () => ({ getPageContent: getPageContentMock, getPageContents: getPageContentsMock }),
}));

jest.mock('job-bank-data-access', () => ({
  HttpJobBankApiClient: jest.fn().mockImplementation(() => ({
    getPostings: jest.fn().mockResolvedValue([]),
    apply: jest.fn(),
    getApplications: jest.fn().mockResolvedValue([]),
  })),
}));

describe('App', () => {
  beforeEach(() => {
    getPageContentMock.mockReset().mockResolvedValue(null);
    getPageContentsMock.mockReset().mockResolvedValue({
      'job-bank.search.heading': { title: 'Job Bank — Job search', body: '' },
      'job-bank.search.error': { title: 'Job postings are temporarily unavailable.', body: '' },
      'job-bank.search.table.title': { title: 'Job title', body: '' },
      'job-bank.search.table.employer': { title: 'Employer', body: '' },
      'job-bank.search.table.location': { title: 'Location', body: '' },
      'job-bank.search.table.posted': { title: 'Posted', body: '' },
      'job-bank.search.list.emptyLabel': { title: 'No job postings found.', body: '' },
      'job-bank.search.list.label': { title: 'Job postings', body: '' },
      'job-bank.apply.heading': { title: 'Apply for a job', body: '' },
      'job-bank.apply.error': { title: 'Job applications are temporarily unavailable.', body: '' },
      'job-bank.apply.label': { title: 'Choose a posting', body: '' },
      'job-bank.apply.button': { title: 'Apply now', body: '' },
      'job-bank.apply.confirmation': { title: 'Application {id} submitted — status: {status}.', body: '' },
      'job-bank.applications-list.heading': { title: 'My Job Applications', body: '' },
      'job-bank.applications-list.empty': { title: 'You have not applied to any jobs yet.', body: '' },
      'job-bank.applications-list.unavailable': { title: 'Job applications are temporarily unavailable.', body: '' },
    });
    global.fetch = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({ auth: { signInRequired: 'You need to sign in to search and apply for jobs.' } }),
    }) as jest.Mock;
  });

  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('renders its feature components when the claim is present', async () => {
    storeSession(createMockSession());
    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: /Job Bank — Job search/i })).toBeInTheDocument();
  });

  it('renders intro content fetched via ContentClient', async () => {
    storeSession(createMockSession());
    getPageContentMock.mockResolvedValue({
      key: 'job-bank.intro',
      title: 'Job Bank',
      body: 'Search job postings and submit applications, all in one place.',
    });

    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Job Bank' })).toBeInTheDocument();
  });

  it('blocks its own content when there is no active session, independent of the shell', async () => {
    clearSession();
    render(<App />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('sign in');
    expect(screen.queryByText(/Job Bank — Job search/)).not.toBeInTheDocument();
  });
});
