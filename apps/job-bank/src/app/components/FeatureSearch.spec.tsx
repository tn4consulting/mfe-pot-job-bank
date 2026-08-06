import { render, screen } from '@testing-library/react';
import type { JobBankApiClient } from 'job-bank-data-access';
import type { ContentClient } from '@tn4consulting/shared-content-client';
import { FeatureSearch } from './FeatureSearch';

const contentClient: ContentClient = {
  getPageContent: jest.fn().mockResolvedValue(null),
  getPageContents: jest.fn().mockResolvedValue({}),
};

// scds-multi-column-list renders into its own shadow root, which
// @testing-library/dom's default queries don't pierce -- assert on
// shadowRoot.textContent directly instead. The custom element is created
// and populated imperatively inside a useEffect (see FeatureSearch.tsx),
// so a render-flush tick is needed after `render()` too, same as this
// component's own Stencil-side tests (see shared-ui-scds-core).
function waitForRender(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

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

    const { container } = render(<FeatureSearch apiClient={apiClient} contentClient={contentClient} locale="en" />);
    await waitForRender();
    await waitForRender();

    const list = container.querySelector('scds-multi-column-list');
    expect(list).toBeTruthy();
    expect(list?.shadowRoot?.textContent).toContain('Warehouse Associate');
  });

  it('shows an error state when postings fail to load', async () => {
    const apiClient = makeApiClient({
      getPostings: jest.fn().mockRejectedValue(new Error('network down')),
    });

    render(<FeatureSearch apiClient={apiClient} contentClient={contentClient} locale="en" />);

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('temporarily unavailable');
  });
});
