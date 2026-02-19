import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findMany: vi.fn(), create: vi.fn(), count: vi.fn() },
  },
}));

vi.mock('@/lib/apiAuth', () => ({
  getAuthUser: vi.fn(),
  serializeApp: vi.fn((a: Record<string, unknown>) => ({ id: a.id, type: 'application', attributes: { id: a.id } })),
  APP_INCLUDE: { addresses: true, vehicles: true, financialInfos: true, documents: true, notes: { include: { user: true } }, user: true },
}));

import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/apiAuth';

const mockGetUser = vi.mocked(getAuthUser);
const mockFindMany = vi.mocked(prisma.application.findMany);
const mockCreate = vi.mocked(prisma.application.create);
const mockCount = vi.mocked(prisma.application.count);

const mockUser = { id: 1, role: 'customer' };

describe('Applications API Route (Prisma)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/v1/applications'));
    expect(res.status).toBe(401);
  });

  it('GET returns user applications', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockFindMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as never);
    const res = await GET(new NextRequest('http://localhost/api/v1/applications'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(2);
  });

  it('GET filters by status', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockFindMany.mockResolvedValueOnce([] as never);
    await GET(new NextRequest('http://localhost/api/v1/applications?status=draft'));
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 1, status: 'draft' } }));
  });

  it('POST returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/v1/applications', { method: 'POST', body: '{}' } as never);
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST creates application', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockCount.mockResolvedValueOnce(5);
    mockCreate.mockResolvedValueOnce({ id: 6 } as never);
    const req = new NextRequest('http://localhost/api/v1/applications', { method: 'POST', body: JSON.stringify({ dob: '1990-01-01' }) } as never);
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ applicationNumber: 'AL-2026-00006' }) }));
  });
});
