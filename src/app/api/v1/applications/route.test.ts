import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Applications API Route', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET proxies list', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('[]'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/applications?page=1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications?page=1'), expect.anything());
  });

  it('GET forwards auth header', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('[]'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/applications', { headers: { Authorization: 'Bearer t' } });
    await GET(req);
    expect(mockFetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer t' }) }));
  });

  it('POST creates application', async () => {
    mockFetch.mockResolvedValueOnce({ status: 201, text: () => Promise.resolve('{"id":1}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/applications', { method: 'POST', body: '{"app":{}}' });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});
