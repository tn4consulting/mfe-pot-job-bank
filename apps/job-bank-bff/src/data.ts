import { randomUUID } from 'node:crypto';
import { sessionCache } from './config';

export interface JobPosting {
  id: string;
  title: string;
  employer: string;
  location: string;
  postedDate: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantSub: string;
  status: 'submitted';
  submittedAt: string;
}

// Shaped like real jobbank.gc.ca listings -- see CLAUDE.md's "Design/UX
// fidelity" section.
export const postings: JobPosting[] = [
  {
    id: 'job-001',
    title: 'Warehouse Associate',
    employer: 'Northgate Logistics',
    location: 'Ottawa, ON',
    postedDate: '2026-07-28',
  },
  {
    id: 'job-002',
    title: 'Customer Service Representative',
    employer: 'Riverside Credit Union',
    location: 'Ottawa, ON',
    postedDate: '2026-07-25',
  },
];

export function getPosting(id: string): JobPosting | undefined {
  return postings.find((posting) => posting.id === id);
}

export async function createApplication(jobId: string, applicantSub: string): Promise<JobApplication> {
  const key = sessionCache.buildKey('applications', applicantSub);
  const existing = (await sessionCache.getJson<JobApplication[]>(key)) ?? [];
  const application: JobApplication = {
    // Not `app-${existing.length + 1}` -- an id derived from array length
    // breaks once state can outlive a single process (pod restart,
    // multiple replicas), which is exactly what moving this into Redis
    // makes possible.
    id: randomUUID(),
    jobId,
    applicantSub,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
  await sessionCache.setJson(key, [...existing, application]);
  return application;
}

export async function getApplications(applicantSub: string): Promise<JobApplication[]> {
  const key = sessionCache.buildKey('applications', applicantSub);
  return (await sessionCache.getJson<JobApplication[]>(key)) ?? [];
}
