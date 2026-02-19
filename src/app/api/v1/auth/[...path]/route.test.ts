// autoloan-nextjs-metafullstack/src/app/api/v1/auth/[...path]/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    jwtDenylist: { create: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(() => 'hashed'),
  generateToken: vi.fn(() => 'jwt-token-123'),
  verifyToken: vi.fn(() => ({ sub: '1', email: 'a@b.com', role: 'customer', jti: 'jti-1' })),
}));

import { GET, POST, PUT, PATCH, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

const mockUserFind = vi.mocked(prisma.user.findUnique);
const mockUserCreate = vi.mocked(prisma.user.create);
const mockUserUpdate = vi.mocked(prisma.user.update);
const mockUserFindFirst = vi.mocked(prisma.user.findFirst);
const mockVerifyPw = vi.mocked(verifyPassword);

const makeReq = (method: string, path: string, body?: string) => {
  const url = `http://localhost:3003/api/v1/auth/${path}`;
  return new NextRequest(url, { method, body } as never);
};

const makeParams = (path: string[]) => Promise.resolve({ path });

const mockUser = {
  id: 1, email: 'a@b.com',
  encryptedPassword: 'hashed',  // pragma: allowlist secret
  firstName: 'John', lastName: 'Doe', phone: '555', role: 'customer',
  confirmedAt: new Date(), lockedAt: null, signInCount: 0, createdAt: new Date(),
};

describe('Auth catch-all route (Prisma)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('POST /auth/login succeeds', async () => {
    mockUserFind.mockResolvedValueOnce(mockUser as never);
    mockVerifyPw.mockReturnValueOnce(true);
    mockUserUpdate.mockResolvedValueOnce(mockUser as never);
    const res = await POST(makeReq('POST', 'login', JSON.stringify({ user: { email: 'a@b.com', password: 'pw' } })), { params: makeParams(['login']) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Authorization')).toBe('Bearer jwt-token-123');
  });

  it('POST /auth/login fails with wrong password', async () => {
    mockUserFind.mockResolvedValueOnce(mockUser as never);
    mockVerifyPw.mockReturnValueOnce(false);
    const res = await POST(makeReq('POST', 'login', JSON.stringify({ user: { email: 'a@b.com', password: 'wrong' } })), { params: makeParams(['login']) });
    expect(res.status).toBe(401);
  });

  it('POST /auth/login fails with missing fields', async () => {
    const res = await POST(makeReq('POST', 'login', JSON.stringify({ user: {} })), { params: makeParams(['login']) });
    expect(res.status).toBe(422);
  });

  it('POST /auth/login fails for unconfirmed user', async () => {
    mockUserFind.mockResolvedValueOnce({ ...mockUser, confirmedAt: null } as never);
    mockVerifyPw.mockReturnValueOnce(true);
    const res = await POST(makeReq('POST', 'login', JSON.stringify({ user: { email: 'a@b.com', password: 'pw' } })), { params: makeParams(['login']) });
    expect(res.status).toBe(401);
  });

  it('POST /auth/login fails for locked user', async () => {
    mockUserFind.mockResolvedValueOnce({ ...mockUser, lockedAt: new Date() } as never);
    mockVerifyPw.mockReturnValueOnce(true);
    const res = await POST(makeReq('POST', 'login', JSON.stringify({ user: { email: 'a@b.com', password: 'pw' } })), { params: makeParams(['login']) });
    expect(res.status).toBe(423);
  });

  it('POST /auth/signup succeeds', async () => {
    mockUserFind.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce(mockUser as never);
    const res = await POST(makeReq('POST', 'signup', JSON.stringify({ user: { email: 'new@b.com', password: 'pw', first_name: 'A', last_name: 'B', phone: '555' } })), { params: makeParams(['signup']) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Authorization')).toBe('Bearer jwt-token-123');
  });

  it('POST /auth/signup fails for existing email', async () => {
    mockUserFind.mockResolvedValueOnce(mockUser as never);
    const res = await POST(makeReq('POST', 'signup', JSON.stringify({ user: { email: 'a@b.com', password: 'pw', first_name: 'A', last_name: 'B', phone: '555' } })), { params: makeParams(['signup']) });
    expect(res.status).toBe(422);
  });

  it('GET /auth/me returns user', async () => {
    mockUserFind.mockResolvedValueOnce(mockUser as never);
    const req = makeReq('GET', 'me');
    req.headers.set('authorization', 'Bearer valid');
    const res = await GET(req, { params: makeParams(['me']) });
    expect(res.status).toBe(200);
  });

  it('GET /auth/me fails without token', async () => {
    const res = await GET(makeReq('GET', 'me'), { params: makeParams(['me']) });
    expect(res.status).toBe(401);
  });

  it('DELETE /auth/logout succeeds', async () => {
    const req = makeReq('DELETE', 'logout');
    req.headers.set('authorization', 'Bearer valid');
    const res = await DELETE(req, { params: makeParams(['logout']) });
    expect(res.status).toBe(200);
  });

  it('POST /auth/password sends reset', async () => {
    const res = await POST(makeReq('POST', 'password', JSON.stringify({ user: { email: 'a@b.com' } })), { params: makeParams(['password']) });
    expect(res.status).toBe(200);
  });

  it('PUT /auth/password resets password', async () => {
    mockUserFindFirst.mockResolvedValueOnce(mockUser as never);
    mockUserUpdate.mockResolvedValueOnce(mockUser as never);
    const res = await PUT(makeReq('PUT', 'password', JSON.stringify({ user: { reset_password_token: 'tok', password: 'new' } })), { params: makeParams(['password']) });
    expect(res.status).toBe(200);
  });

  it('PATCH returns 404', async () => {
    const res = await PATCH(makeReq('PATCH', 'anything', '{}'), { params: makeParams(['anything']) });
    expect(res.status).toBe(404);
  });

  it('GET unknown path returns 404', async () => {
    const res = await GET(makeReq('GET', 'unknown'), { params: makeParams(['unknown']) });
    expect(res.status).toBe(404);
  });
});
