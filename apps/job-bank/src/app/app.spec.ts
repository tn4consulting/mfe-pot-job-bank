import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { JOB_BANK_API_CLIENT, JobBankApiClient } from 'job-bank-data-access';
import { App } from './app';

describe('App', () => {
  const apiClient: jest.Mocked<JobBankApiClient> = {
    getPostings: jest.fn().mockResolvedValue([]),
    apply: jest.fn(),
    getApplications: jest.fn(),
  };

  afterEach(() => clearSession());

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: {
            en: { auth: { signInRequired: 'You need to sign in to search and apply for jobs.' } },
            fr: { auth: { signInRequired: 'Vous devez ouvrir une session.' } },
          },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([]), { provide: JOB_BANK_API_CLIENT, useValue: apiClient }],
    }).compileComponents();
  }

  it('should create the app', async () => {
    storeSession(createMockSession());
    await setup();
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders its feature components when the claim is present', async () => {
    storeSession(createMockSession());
    await setup();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('lib-job-bank-feature-search')).not.toBeNull();
  });

  it('blocks its own content when there is no active session, independent of the shell', async () => {
    clearSession();
    await setup();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('lib-job-bank-feature-search')).toBeNull();
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('sign in');
  });
});
