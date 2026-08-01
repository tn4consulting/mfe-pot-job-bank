import { HttpJobBankApiClient } from './http-job-bank-api-client';

describe('HttpJobBankApiClient', () => {
  const originalFetch = global.fetch;
  const client = new HttpJobBankApiClient('http://localhost:3001');

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches postings', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'job-001', title: 'Warehouse Associate' }],
    }) as unknown as typeof fetch;

    const postings = await client.getPostings();
    expect(postings).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/jobs');
  });

  it('throws when postings fail to load', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(client.getPostings()).rejects.toThrow('500');
  });

  it('submits an application', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'app-1', jobId: 'job-001', status: 'submitted' }),
    }) as unknown as typeof fetch;

    const application = await client.apply('job-001', 'mock-citizen-001');
    expect(application.id).toBe('app-1');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/applications',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('fetches applications for an applicant', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as unknown as typeof fetch;

    await client.getApplications('mock-citizen-001');
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0] as URL;
    expect(calledUrl.toString()).toBe('http://localhost:3001/api/applications?applicantSub=mock-citizen-001');
  });
});
