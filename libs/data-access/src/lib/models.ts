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
