import { TestBed } from '@angular/core/testing';
import { JOB_BANK_API_CLIENT, JobBankApiClient } from 'job-bank-data-access';
import { JobBankFeatureSearch } from './job-bank-feature-search';

describe('JobBankFeatureSearch', () => {
  const apiClient: jest.Mocked<JobBankApiClient> = {
    getPostings: jest.fn(),
    apply: jest.fn(),
    getApplications: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [JobBankFeatureSearch],
      providers: [{ provide: JOB_BANK_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  });

  it('renders postings fetched from the API client', async () => {
    apiClient.getPostings.mockResolvedValue([
      { id: 'job-001', title: 'Warehouse Associate', employer: 'Northgate Logistics', location: 'Ottawa, ON', postedDate: '2026-07-28' },
    ]);

    const fixture = TestBed.createComponent(JobBankFeatureSearch);
    // Zoneless `whenStable()` doesn't track a plain fetch() promise chain --
    // await the component's own async lifecycle hook directly (see CLAUDE.md).
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Warehouse Associate');
  });

  it('shows an error state when postings fail to load', async () => {
    apiClient.getPostings.mockRejectedValue(new Error('network down'));

    const fixture = TestBed.createComponent(JobBankFeatureSearch);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('temporarily unavailable');
  });
});
