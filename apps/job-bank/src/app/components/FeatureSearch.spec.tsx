import { render, screen } from '@testing-library/react';
import type { JobBankApiClient } from 'job-bank-data-access';
import { FeatureSearch } from './FeatureSearch';

describe('FeatureSearch', () => {
  function makeApiClient(overrides: Partial<JobBankApiClient> = {}): jest.Mocked<JobBankApiClient> {
    return {
      getPostings: jest.fn(),
      apply: jest.fn(),
      getApplications: jest.fn(),
      ...overrides,
    } as jest.Mocked<JobBankApiClient>;
  }

  it('renders postings fetched from the API client', async () => {
    const apiClient = makeApiClient({
      getPostings: jest.fn().mockResolvedValue([
        {
          id: 'job-001',
          title: 'Warehouse Associate',
          employer: 'Northgate Logistics',
          location: 'Ottawa, ON',
          postedDate: '2026-07-28',
        },
      ]),
    });

    render(<FeatureSearch apiClient={apiClient} />);

    expect(await screen.findByText(/Warehouse Associate/)).toBeInTheDocument();
  });

  it('shows an error state when postings fail to load', async () => {
    const apiClient = makeApiClient({
      getPostings: jest.fn().mockRejectedValue(new Error('network down')),
    });

    render(<FeatureSearch apiClient={apiClient} />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('temporarily unavailable');
  });
});
