import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { JobBankApiClient } from 'job-bank-data-access';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth/core';
import { FeatureApply } from './FeatureApply';

const contentClient: ContentClient = {
  getPageContent: jest.fn().mockResolvedValue(null),
  getPageContents: jest.fn().mockResolvedValue({
    'job-bank.apply.heading': { title: 'Apply for a job', body: '' },
    'job-bank.apply.error': { title: 'Job applications are temporarily unavailable.', body: '' },
    'job-bank.apply.label': { title: 'Choose a posting', body: '' },
    'job-bank.apply.button': { title: 'Apply now', body: '' },
    'job-bank.apply.confirmation': { title: 'Application {id} submitted — status: {status}.', body: '' },
  }),
};

describe('FeatureApply', () => {
  function makeApiClient(overrides: Partial<JobBankApiClient> = {}): jest.Mocked<JobBankApiClient> {
    return {
      getPostings: jest.fn().mockResolvedValue([
        {
          id: 'job-001',
          title: 'Warehouse Associate',
          employer: 'Northgate Logistics',
          location: 'Ottawa, ON',
          postedDate: '2026-07-28',
        },
      ]),
      apply: jest.fn(),
      getApplications: jest.fn(),
      ...overrides,
    } as jest.Mocked<JobBankApiClient>;
  }

  beforeEach(() => storeSession(createMockSession()));
  afterEach(() => clearSession());

  it('selects the first posting by default once loaded', async () => {
    const apiClient = makeApiClient();
    render(<FeatureApply apiClient={apiClient} contentClient={contentClient} locale="en" />);

    const select = (await screen.findByLabelText('Choose a posting')) as HTMLSelectElement;
    await waitFor(() => expect(select.value).toBe('job-001'));
  });

  it('submits an application and shows a confirmation', async () => {
    const apiClient = makeApiClient({
      apply: jest.fn().mockResolvedValue({
        id: 'app-1',
        jobId: 'job-001',
        applicantSub: 'mock-citizen-001',
        status: 'submitted',
        submittedAt: '2026-08-01T00:00:00.000Z',
        jobTitle: 'Warehouse Associate',
        employer: 'Northgate Logistics',
      }),
    });
    render(<FeatureApply apiClient={apiClient} contentClient={contentClient} locale="en" />);

    const button = await screen.findByRole('button', { name: 'Apply now' });
    await userEvent.click(button);

    expect(apiClient.apply).toHaveBeenCalledWith('job-001', 'mock-citizen-001');
    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('app-1');
  });
});
