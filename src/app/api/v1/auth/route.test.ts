import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from './route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Auth API Route', () => {
  beforeEach(() => vi.resetAllMocks());

  it('POST proxies login', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{"token":"abc"}'), headers: new Headers({ 'Content-Type': 'application/json' }) });
    const req = new NextRequest('http://localhost/api/v1/auth?action=login', { method: 'POST', body: '{"email":"a@b.com"}' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.anything());
  });

  it('POST defaults to login action', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/auth', { method: 'POST', body: '{}' });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/login'), expect.anything());
  });

  it('POST forwards auth header', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/auth?action=signup', { method: 'POST', body: '{}', headers: { Authorization: 'Bearer xyz' } });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer xyz' }) }));
  });

  it('DELETE proxies logout', async () => {
    mockFetch.mockResolvedValueOnce({ status: 200, text: () => Promise.resolve('{}'), headers: new Headers() });
    const req = new NextRequest('http://localhost/api/v1/auth', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/auth/logout'), expect.anything());
  });
});
