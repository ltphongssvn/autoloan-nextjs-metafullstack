// autoloan-nextjs-metafullstack/src/app/api/v1/auth/[...path]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST, PUT, PATCH, DELETE } from './route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const makeReq = (method: string, path: string, body?: string) => {
  const url = `http://localhost:3003/api/v1/auth/${path}`;
  const init: { method: string; body?: string; headers?: Record<string, string> } = { method };
  if (body) init.body = body;
  return new NextRequest(url, init as never);
};

const mockRailsResponse = (status: number, data: object, headers?: Record<string, string>) => {
  const resHeaders = new Headers({ 'Content-Type': 'application/json', ...headers });
  return Promise.resolve(new Response(JSON.stringify(data), { status, headers: resHeaders }));
};

const makeParams = (path: string[]) => Promise.resolve({ path });

describe('Auth catch-all route', () => {
  beforeEach(() => vi.resetAllMocks());

  it('POST /auth/login proxies to Rails', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, { status: { code: 200 } }, { Authorization: 'Bearer jwt123' }));
    const res = await POST(makeReq('POST', 'login', '{"user":{"email":"a@b.com"}}'), { params: makeParams(['login']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/login'), expect.anything());
    expect(res.status).toBe(200);
    expect(res.headers.get('Authorization')).toBe('Bearer jwt123');
  });

  it('POST /auth/signup proxies to Rails', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, { status: { code: 200 } }));
    const res = await POST(makeReq('POST', 'signup', '{}'), { params: makeParams(['signup']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/signup'), expect.anything());
    expect(res.status).toBe(200);
  });

  it('GET /auth/me proxies to Rails', async () => {
    const req = makeReq('GET', 'me');
    req.headers.set('authorization', 'Bearer token');
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, { data: { id: 1 } }));
    const res = await GET(req, { params: makeParams(['me']) });
    expect(res.status).toBe(200);
  });

  it('DELETE /auth/logout proxies to Rails', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, { status: { code: 200 } }));
    const res = await DELETE(makeReq('DELETE', 'logout'), { params: makeParams(['logout']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/logout'), expect.anything());
    expect(res.status).toBe(200);
  });

  it('PUT /auth/password proxies to Rails', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, { status: { code: 200 } }));
    const res = await PUT(makeReq('PUT', 'password', '{}'), { params: makeParams(['password']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/password'), expect.anything());
    expect(res.status).toBe(200);
  });

  it('PATCH proxies to Rails', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, { status: { code: 200 } }));
    const res = await PATCH(makeReq('PATCH', 'profile', '{}'), { params: makeParams(['profile']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/profile'), expect.anything());
    expect(res.status).toBe(200);
  });

  it('forwards auth header to Rails', async () => {
    const req = makeReq('POST', 'login', '{}');
    req.headers.set('authorization', 'Bearer existing');
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, {}));
    await POST(req, { params: makeParams(['login']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer existing' }),
    }));
  });

  it('handles nested paths', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, {}));
    const res = await POST(makeReq('POST', 'mfa/setup', '{}'), { params: makeParams(['mfa', 'setup']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/mfa/setup'), expect.anything());
    expect(res.status).toBe(200);
  });

  it('forwards query params', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(200, {}));
    const req = new NextRequest('http://localhost:3003/api/v1/auth/confirmation?confirmation_token=abc', { method: 'GET' } as never);
    await GET(req, { params: makeParams(['confirmation']) });
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('?confirmation_token=abc'), expect.anything());
  });

  it('returns response without auth header when Rails omits it', async () => {
    mockFetch.mockReturnValueOnce(mockRailsResponse(401, { error: 'Invalid' }));
    const res = await POST(makeReq('POST', 'login', '{}'), { params: makeParams(['login']) });
    expect(res.status).toBe(401);
    expect(res.headers.get('Authorization')).toBeNull();
  });
});
