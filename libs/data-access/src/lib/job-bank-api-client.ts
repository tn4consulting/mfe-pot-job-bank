import { JobApplication, JobPosting } from './models';

/**
 * Job Bank's feature components depend on this abstraction, never on a
 * concrete HTTP implementation directly -- required so they keep working
 * both federated into this shell and on the standalone real-world Job Bank
 * site, which won't wire up the same backend. See CLAUDE.md's "Apps are
 * thin, libraries hold the real functionality" section.
 *
 * No Angular `InjectionToken` here (unlike this file's pre-React-port
 * history) -- job-bank's React remote passes the concrete client down as a
 * plain prop from `App`, not through Angular DI, and this library must stay
 * resolvable from a bundle with no Angular installed at all.
 */
export interface JobBankApiClient {
  getPostings(): Promise<JobPosting[]>;
  apply(jobId: string, applicantSub: string): Promise<JobApplication>;
  getApplications(applicantSub: string): Promise<JobApplication[]>;
}
