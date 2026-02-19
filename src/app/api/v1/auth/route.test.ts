import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    jwtDenylist: { create: vi.fn() },
  },
}));

vi.mock('@/lib/auth', () => ({
  verifyPassword: vi.fn(),
  generateToken: vi.fn(() => 'jwt-token'),
  verifyToken: vi.fn(() => ({ sub: '1', jti: 'jti-1', exp: 9999999999 })),
}));

import { POST, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

const mockUserFind = vi.mocked(prisma.user.findUnique);
const mockUserUpdate = vi.mocked(prisma.user.update);
const mockVerifyPw = vi.mocked(verifyPassword);

const mockUser = {
  id: 1, email: 'a@b.com',
  encryptedPassword: 'hashed',  // pragma: allowlist secret
  firstName: 'John', lastName: 'Doe', phone: '555', role: 'customer',
  confirmedAt: new Date(), lockedAt: null, signInCount: 0, createdAt: new Date(),
};

describe('Auth base route (Prisma)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('POST login succeeds', async () => {
    mockUserFind.mockResolvedValueOnce(mockUser as never);
    mockVerifyPw.mockReturnValueOnce(true);
    mockUserUpdate.mockResolvedValueOnce(mockUser as never);
    const req = new NextRequest('http://localhost/api/v1/auth?action=login', { method: 'POST', body: JSON.stringify({ user: { email: 'a@b.com', password: 'pw' } }) } as never);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Authorization')).toBe('Bearer jwt-token');
  });

  it('POST login fails with missing fields', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth?action=login', { method: 'POST', body: JSON.stringify({ user: {} }) } as never);
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('POST login fails with wrong password', async () => {
    mockUserFind.mockResolvedValueOnce(mockUser as never);
    mockVerifyPw.mockReturnValueOnce(false);
    const req = new NextRequest('http://localhost/api/v1/auth?action=login', { method: 'POST', body: JSON.stringify({ user: { email: 'a@b.com', password: 'wrong' } }) } as never);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST login fails for unconfirmed user', async () => {
    mockUserFind.mockResolvedValueOnce({ ...mockUser, confirmedAt: null } as never);
    mockVerifyPw.mockReturnValueOnce(true);
    const req = new NextRequest('http://localhost/api/v1/auth?action=login', { method: 'POST', body: JSON.stringify({ user: { email: 'a@b.com', password: 'pw' } }) } as never);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST login fails for locked user', async () => {
    mockUserFind.mockResolvedValueOnce({ ...mockUser, lockedAt: new Date() } as never);
    mockVerifyPw.mockReturnValueOnce(true);
    const req = new NextRequest('http://localhost/api/v1/auth?action=login', { method: 'POST', body: JSON.stringify({ user: { email: 'a@b.com', password: 'pw' } }) } as never);
    const res = await POST(req);
    expect(res.status).toBe(423);
  });

  it('POST unknown action returns 404', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth?action=bad', { method: 'POST', body: '{}' } as never);
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('POST defaults to login action', async () => {
    mockUserFind.mockResolvedValueOnce(mockUser as never);
    mockVerifyPw.mockReturnValueOnce(true);
    mockUserUpdate.mockResolvedValueOnce(mockUser as never);
    const req = new NextRequest('http://localhost/api/v1/auth', { method: 'POST', body: JSON.stringify({ user: { email: 'a@b.com', password: 'pw' } }) } as never);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('DELETE logout with token', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth', { method: 'DELETE' } as never);
    req.headers.set('authorization', 'Bearer valid');
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });

  it('DELETE logout without token', async () => {
    const req = new NextRequest('http://localhost/api/v1/auth', { method: 'DELETE' } as never);
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });
});
