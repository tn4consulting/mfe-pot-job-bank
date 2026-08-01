import request from 'supertest';
import { createApp } from './app';

describe('job-bank-bff', () => {
  const app = createApp();

  it('reports healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('lists job postings', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('creates an application for a valid posting', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ jobId: 'job-001', applicantSub: 'mock-citizen-001' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      jobId: 'job-001',
      applicantSub: 'mock-citizen-001',
      status: 'submitted',
    });
  });

  it('rejects an application for an unknown posting', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({ jobId: 'does-not-exist', applicantSub: 'mock-citizen-001' });
    expect(res.status).toBe(404);
  });

  it('rejects an application missing required fields', async () => {
    const res = await request(app).post('/api/applications').send({ jobId: 'job-001' });
    expect(res.status).toBe(400);
  });

  it('lists applications for a given applicant', async () => {
    await request(app)
      .post('/api/applications')
      .send({ jobId: 'job-002', applicantSub: 'mock-citizen-001' });

    const res = await request(app).get('/api/applications').query({ applicantSub: 'mock-citizen-001' });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('requires the applicantSub query parameter', async () => {
    const res = await request(app).get('/api/applications');
    expect(res.status).toBe(400);
  });
});
