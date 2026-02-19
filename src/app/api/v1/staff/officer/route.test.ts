import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    applicationNote: { create: vi.fn() },
    statusHistory: { create: vi.fn() },
  },
}));

vi.mock('@/lib/apiAuth', () => ({
  getAuthUser: vi.fn(),
  serializeApp: vi.fn((a: Record<string, unknown>) => ({ id: a.id, type: 'application' })),
  APP_INCLUDE: {},
}));

import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/apiAuth';

const mockGetUser = vi.mocked(getAuthUser);
const mockFindMany = vi.mocked(prisma.application.findMany);
const mockFindUnique = vi.mocked(prisma.application.findUnique);
const mockUpdate = vi.mocked(prisma.application.update);
const mockNoteCreate = vi.mocked(prisma.applicationNote.create);
const mockHistoryCreate = vi.mocked(prisma.statusHistory.create);

const officer = { id: 10, role: 'loan_officer' };

describe('Staff Officer Route (Prisma)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/v1/staff/officer'));
    expect(res.status).toBe(401);
  });

  it('GET returns 401 for non-officer', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 1, role: 'customer' } as never);
    const res = await GET(new NextRequest('http://localhost/api/v1/staff/officer'));
    expect(res.status).toBe(401);
  });

  it('GET returns all applications', async () => {
    mockGetUser.mockResolvedValueOnce(officer as never);
    mockFindMany.mockResolvedValueOnce([{ id: 1 }, { id: 2 }] as never);
    const res = await GET(new NextRequest('http://localhost/api/v1/staff/officer'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data).toHaveLength(2);
  });

  it('GET filters by status', async () => {
    mockGetUser.mockResolvedValueOnce(officer as never);
    mockFindMany.mockResolvedValueOnce([] as never);
    await GET(new NextRequest('http://localhost/api/v1/staff/officer?status=submitted'));
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'submitted' } }));
  });

  it('POST returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/officer?action=start_review&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(401);
  });

  it('POST returns 404 for missing app', async () => {
    mockGetUser.mockResolvedValueOnce(officer as never);
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/officer?action=start_review&id=99', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(404);
  });

  it('POST start_review updates status', async () => {
    mockGetUser.mockResolvedValueOnce(officer as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'submitted' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/officer?action=start_review&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(200);
  });

  it('POST forward_to_underwriter with note', async () => {
    mockGetUser.mockResolvedValueOnce(officer as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    mockNoteCreate.mockResolvedValueOnce({} as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/officer?action=forward_to_underwriter&id=1', { method: 'POST', body: JSON.stringify({ note: 'Ready for review' }) } as never));
    expect(res.status).toBe(200);
    expect(mockNoteCreate).toHaveBeenCalled();
  });

  it('POST request_documents updates status', async () => {
    mockGetUser.mockResolvedValueOnce(officer as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/officer?action=request_documents&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(200);
  });

  it('POST unknown action returns 422', async () => {
    mockGetUser.mockResolvedValueOnce(officer as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'submitted' } as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/officer?action=bad&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(422);
  });
});
