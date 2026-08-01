import { InjectionToken } from '@angular/core';
import { JobApplication, JobPosting } from './models';

/**
 * Job Bank's feature libraries depend on this abstraction, never on a
 * concrete HTTP implementation directly -- required so they keep working
 * both federated into this shell and on the standalone real-world Job Bank
 * site, which won't wire up the same backend. See CLAUDE.md's "Apps are
 * thin, libraries hold the real functionality" section.
 */
export interface JobBankApiClient {
  getPostings(): Promise<JobPosting[]>;
  apply(jobId: string, applicantSub: string): Promise<JobApplication>;
  getApplications(applicantSub: string): Promise<JobApplication[]>;
}

export const JOB_BANK_API_CLIENT = new InjectionToken<JobBankApiClient>('JOB_BANK_API_CLIENT');
