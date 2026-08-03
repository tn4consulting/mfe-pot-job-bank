import { render, screen } from '@testing-library/react';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { HttpJobBankApiClient } from 'job-bank-data-access';
import { JobApplicationsList } from './JobApplicationsList';

jest.mock('../asset-base-url', () => ({ assetBaseUrl: 'http://localhost:4203/' }));

jest.mock('../../runtime-config', () => ({
  loadRuntimeConfig: jest.fn().mockResolvedValue({ jobBankBffBaseUrl: 'http://localhost:3001' }),
}));

jest.mock('job-bank-data-access', () => ({
  HttpJobBankApiClient: jest.fn(),
}));

const MockedHttpJobBankApiClient = HttpJobBankApiClient as unknown as jest.Mock;

const EN_TRANSLATIONS = {
  jobApplications: {
    heading: 'My Job Applications',
    empty: 'No job applications on file.',
    unavailable: 'Job applications are temporarily unavailable.',
    unknownPosition: 'Unknown position',
    unknownEmployer: 'Unknown employer',
  },
};

describe('JobApplicationsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeSession(createMockSession());
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(EN_TRANSLATIONS),
    }) as jest.Mock;
  });

  afterEach(() => {
    clearSession();
    jest.restoreAllMocks();
  });

  it('renders no applications on file', async () => {
    MockedHttpJobBankApiClient.mockImplementation(() => ({
      getApplications: jest.fn().mockResolvedValue([]),
    }));

    render(<JobApplicationsList />);

    expect(await screen.findByText('No job applications on file.')).toBeInTheDocument();
  });

  it('renders applications fetched from job-bank-bff', async () => {
    MockedHttpJobBankApiClient.mockImplementation(() => ({
      getApplications: jest.fn().mockResolvedValue([
        {
          id: 'app-1',
          jobId: 'job-001',
          applicantSub: 'mock-citizen-001',
          status: 'submitted',
          submittedAt: '2026-08-01T00:00:00.000Z',
          jobTitle: 'Warehouse Associate',
          employer: 'Northgate Logistics',
        },
      ]),
    }));

    render(<JobApplicationsList />);

    expect(await screen.findByText('Warehouse Associate', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('submitted', { exact: false })).toBeInTheDocument();
  });

  it('shows an error state when the upstream call fails', async () => {
    MockedHttpJobBankApiClient.mockImplementation(() => ({
      getApplications: jest.fn().mockRejectedValue(new Error('connection refused')),
    }));

    render(<JobApplicationsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});
