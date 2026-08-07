import { render, screen, waitFor } from '@testing-library/react';
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

// No strapiBaseUrl configured above, so content comes from the real
// StaticContentClient's fetched fallback (content-client.ts).
const FALLBACK_EN = {
  'job-bank.applications-list.heading': { title: 'My Job Applications', body: '' },
  'job-bank.applications-list.empty': { title: 'No job applications on file.', body: '' },
  'job-bank.applications-list.unavailable': { title: 'Job applications are temporarily unavailable.', body: '' },
  'job-bank.applications-list.unknownPosition': { title: 'Unknown position', body: '' },
  'job-bank.applications-list.unknownEmployer': { title: 'Unknown employer', body: '' },
  'job-bank.applications-list.table.position': { title: 'Position', body: '' },
  'job-bank.applications-list.table.employer': { title: 'Employer', body: '' },
  'job-bank.applications-list.table.status': { title: 'Status', body: '' },
};

// scds-multi-column-list renders into its own shadow root, which
// @testing-library/dom's default queries don't pierce -- assert on
// shadowRoot.textContent directly instead. The custom element is created
// and populated imperatively inside a useEffect (see
// JobApplicationsList.tsx), so a render-flush tick is needed after
// `render()` too, same as this component's own Stencil-side tests (see
// shared-ui-scds-core).
//
// 100ms, not 20ms: once shared-ui-scds-core grew from 2 components to 18
// (the GCDS removal/SCDS rewrite), real Stencil registration/hydration of
// the full lazy-loaded component set takes measurably longer in this test
// environment -- see the identical fix/rationale in FeatureSearch.spec.tsx.
function waitForRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 100));
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
      json: () => Promise.resolve(FALLBACK_EN),
    }) as unknown as typeof fetch;
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

    // Content resolves asynchronously (even the fallback path is a Promise,
    // per StaticContentClient), so the alert can appear before its final
    // text does -- wait for the text itself, not just the element.
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('temporarily unavailable'));
  });
});
