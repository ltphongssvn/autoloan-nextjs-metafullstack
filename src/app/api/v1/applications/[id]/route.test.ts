import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from './route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const makeParams = (id: string) => Promise.resolve({ id });

describe('Application [id] API Route', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET fetches by id', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{"id":5}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/applications/5');
    const res = await GET(req, { params: makeParams('5') });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/5'), expect.anything());
  });

  it('GET forwards auth', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/applications/1', { headers: { Authorization: 'Bearer x' } });
    await GET(req, { params: makeParams('1') });
    expect(mockFetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer x' }) }));
  });

  it('PATCH updates application', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/applications/3', { method: 'PATCH', body: '{"status":"submitted"}' });
    const res = await PATCH(req, { params: makeParams('3') });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/applications/3'), expect.objectContaining({ method: 'PATCH' }));
  });

  it('DELETE removes application', async () => {
    mockFetch.mockResolvedValueOnce({ status: 204, text: () => Promise.resolve(''), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/applications/2', { method: 'DELETE' });
    const res = await DELETE(req, { params: makeParams('2') });
    expect(res.status).toBe(204);
  });
});
