import cors from 'cors';
import express, { Express } from 'express';
import { verifyBearerToken, whoamiHandler } from '@tn4consulting/shared-auth-server';
import { mockIdp, sessionCache } from './config';
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

  app.post('/api/applications', async (req, res) => {
    const { jobId, applicantSub } = req.body as { jobId?: string; applicantSub?: string };
    if (!jobId || !applicantSub) {
      res.status(400).json({ error: 'jobId and applicantSub are required' });
      return;
    }
    if (!getPosting(jobId)) {
      res.status(404).json({ error: `No job posting with id "${jobId}"` });
      return;
    }
    res.status(201).json(await createApplication(jobId, applicantSub));
  });

  app.get('/api/applications', async (req, res) => {
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
    const applications = (await getApplications(applicantSub)).map((application) => {
      const posting = getPosting(application.jobId);
      return {
        ...application,
        jobTitle: posting?.title ?? null,
        employer: posting?.employer ?? null,
      };
    });
    res.json(applications);
  });

  // Proves identity (including the SIN custom claim) actually propagated
  // from mock-idp through the browser and was independently verified here
  // -- see mfe-pot's plan doc. Mounted only on this one route, not globally:
  // the domain routes above are single-persona stub data not yet keyed by
  // sub (a bigger, separate scope item).
  app.get(
    '/api/whoami',
    verifyBearerToken({ jwksUrl: mockIdp.jwksUrl, issuer: mockIdp.issuer, audience: mockIdp.audience }),
    whoamiHandler,
  );

  // PoT-only, no auth -- unlocks a repeatable `pnpm demo:reset` (see
  // mfe-pot/TODO.md) by clearing this BFF's own Redis-backed state between
  // local/CI runs and live demos.
  app.post('/api/reset', async (_req, res) => {
    await sessionCache.reset();
    res.status(204).send();
  });

  return app;
}
