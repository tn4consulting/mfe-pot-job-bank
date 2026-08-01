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

const applications: JobApplication[] = [];

export function getPosting(id: string): JobPosting | undefined {
  return postings.find((posting) => posting.id === id);
}

export function createApplication(jobId: string, applicantSub: string): JobApplication {
  const application: JobApplication = {
    id: `app-${applications.length + 1}`,
    jobId,
    applicantSub,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
  applications.push(application);
  return application;
}

export function getApplications(applicantSub: string): JobApplication[] {
  return applications.filter((application) => application.applicantSub === applicantSub);
}
