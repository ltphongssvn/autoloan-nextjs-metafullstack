import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Officer Staff API Route', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET lists officer applications', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('[]'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/staff/officer');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/loan_officer/applications'), expect.anything());
  });

  it('GET forwards auth', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('[]'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/staff/officer', { headers: { Authorization: 'Bearer t' } });
    await GET(req);
    expect(mockFetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t' }) }));
  });

  it('POST forwards action', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/staff/officer?action=verify&id=1', { method: 'POST', body: '{}' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/loan_officer/applications/1/verify'), expect.anything());
  });
});

  it('POST defaults action and id when missing', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/staff/officer', { method: 'POST', body: '{}' });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/loan_officer/applications//'), expect.anything());
  });
