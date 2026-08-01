import { TestBed } from '@angular/core/testing';
import { JOB_BANK_API_CLIENT, JobBankApiClient } from 'job-bank-data-access';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { JobBankFeatureApply } from './job-bank-feature-apply';

describe('JobBankFeatureApply', () => {
  const apiClient: jest.Mocked<JobBankApiClient> = {
    getPostings: jest.fn(),
    apply: jest.fn(),
    getApplications: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    storeSession(createMockSession());
    apiClient.getPostings.mockResolvedValue([
      { id: 'job-001', title: 'Warehouse Associate', employer: 'Northgate Logistics', location: 'Ottawa, ON', postedDate: '2026-07-28' },
    ]);
    await TestBed.configureTestingModule({
      imports: [JobBankFeatureApply],
      providers: [{ provide: JOB_BANK_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  });

  afterEach(() => clearSession());

  it('selects the first posting by default once loaded', async () => {
    const fixture = TestBed.createComponent(JobBankFeatureApply);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedJobId).toBe('job-001');
  });

  it('submits an application and shows a confirmation', async () => {
    apiClient.apply.mockResolvedValue({
      id: 'app-1',
      jobId: 'job-001',
      applicantSub: 'mock-citizen-001',
      status: 'submitted',
      submittedAt: '2026-08-01T00:00:00.000Z',
    });

    const fixture = TestBed.createComponent(JobBankFeatureApply);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(apiClient.apply).toHaveBeenCalledWith('job-001', 'mock-citizen-001');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="status"]')?.textContent).toContain('app-1');
  });
});
