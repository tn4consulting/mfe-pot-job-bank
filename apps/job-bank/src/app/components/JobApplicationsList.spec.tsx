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

// scds-multi-column-list renders into its own shadow root, which
// @testing-library/dom's default queries don't pierce -- assert on
// shadowRoot.textContent directly instead. The custom element is created
// and populated imperatively inside a useEffect (see
// JobApplicationsList.tsx), so a render-flush tick is needed after
// `render()` too, same as this component's own Stencil-side tests (see
// shared-ui-scds-core).
function waitForRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

async function findList(container: HTMLElement): Promise<ShadowRoot> {
  await waitForRender();
  await waitForRender();
  const list = container.querySelector('scds-multi-column-list');
  if (!list?.shadowRoot) {
    throw new Error('scds-multi-column-list did not render');
  }
  return list.shadowRoot;
}

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

    const { container } = render(<JobApplicationsList />);
    const shadowRoot = await findList(container);

    expect(shadowRoot.textContent).toContain('No job applications on file.');
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

    const { container } = render(<JobApplicationsList />);
    const shadowRoot = await findList(container);

    expect(shadowRoot.textContent).toContain('Warehouse Associate');
    expect(shadowRoot.textContent).toContain('submitted');
  });

  it('shows an error state when the upstream call fails', async () => {
    MockedHttpJobBankApiClient.mockImplementation(() => ({
      getApplications: jest.fn().mockRejectedValue(new Error('connection refused')),
    }));

    render(<JobApplicationsList />);

    expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
  });
});
