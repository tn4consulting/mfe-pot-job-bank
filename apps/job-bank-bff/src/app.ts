import cors from 'cors';
import express, { Express } from 'express';
import { createApplication, getApplications, getPosting, postings } from './data';

/**
 * Job Bank's own dedicated backend -- pays off the "Job Bank must be
 * reusable outside this shell" requirement (a standalone consumer needs a
 * real API, not client-side mock state). See CLAUDE.md's "Backends: BFF
 * pattern" section.
 */
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/jobs', (_req, res) => {
    res.json(postings);
  });

  app.post('/api/applications', (req, res) => {
    const { jobId, applicantSub } = req.body as { jobId?: string; applicantSub?: string };
    if (!jobId || !applicantSub) {
      res.status(400).json({ error: 'jobId and applicantSub are required' });
      return;
    }
    if (!getPosting(jobId)) {
      res.status(404).json({ error: `No job posting with id "${jobId}"` });
      return;
    }
    res.status(201).json(createApplication(jobId, applicantSub));
  });

  app.get('/api/applications', (req, res) => {
    const applicantSub = req.query['applicantSub'];
    if (typeof applicantSub !== 'string') {
      res.status(400).json({ error: 'applicantSub query parameter is required' });
      return;
    }
    // Denormalize the posting's title/employer onto each application here,
    // at the response-shaping layer, rather than storing them on
    // JobApplication itself -- callers (like dashboard-bff) shouldn't have
    // to make a second round trip to /api/jobs just to show a readable
    // summary.
    const applications = getApplications(applicantSub).map((application) => {
      const posting = getPosting(application.jobId);
      return {
        ...application,
        jobTitle: posting?.title ?? null,
        employer: posting?.employer ?? null,
      };
    });
    res.json(applications);
  });

  return app;
}
