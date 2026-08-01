import { JobBankApiClient } from './job-bank-api-client';
import { JobApplication, JobPosting } from './models';

/** Local dev / integration tests: calls the real job-bank-bff over HTTP. */
export class HttpJobBankApiClient implements JobBankApiClient {
  constructor(private readonly baseUrl: string) {}

  async getPostings(): Promise<JobPosting[]> {
    const response = await fetch(`${this.baseUrl}/api/jobs`);
    if (!response.ok) {
      throw new Error(`job-bank-bff returned ${response.status} for /api/jobs`);
    }
    return (await response.json()) as JobPosting[];
  }

  async apply(jobId: string, applicantSub: string): Promise<JobApplication> {
    const response = await fetch(`${this.baseUrl}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, applicantSub }),
    });
    if (!response.ok) {
      throw new Error(`job-bank-bff returned ${response.status} for POST /api/applications`);
    }
    return (await response.json()) as JobApplication;
  }

  async getApplications(applicantSub: string): Promise<JobApplication[]> {
    const url = new URL(`${this.baseUrl}/api/applications`);
    url.searchParams.set('applicantSub', applicantSub);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`job-bank-bff returned ${response.status} for /api/applications`);
    }
    return (await response.json()) as JobApplication[];
  }
}
