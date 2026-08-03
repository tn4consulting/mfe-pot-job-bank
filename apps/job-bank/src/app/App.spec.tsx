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
jest.mock('./content-client', () => ({
  INTRO_CONTENT_KEY: 'job-bank.intro',
  createContentClient: () => ({ getPageContent: getPageContentMock }),
}));

jest.mock('job-bank-data-access', () => ({
  HttpJobBankApiClient: jest.fn().mockImplementation(() => ({
    getPostings: jest.fn().mockResolvedValue([]),
    apply: jest.fn(),
    getApplications: jest.fn(),
  })),
}));

describe('App', () => {
  beforeEach(() => {
    getPageContentMock.mockReset().mockResolvedValue(null);
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
