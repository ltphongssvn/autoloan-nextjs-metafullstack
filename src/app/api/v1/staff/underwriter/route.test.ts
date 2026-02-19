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

const uw = { id: 20, role: 'underwriter' };

describe('Staff Underwriter Route (Prisma)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/v1/staff/underwriter'));
    expect(res.status).toBe(401);
  });

  it('GET returns 401 for non-underwriter', async () => {
    mockGetUser.mockResolvedValueOnce({ id: 1, role: 'customer' } as never);
    const res = await GET(new NextRequest('http://localhost/api/v1/staff/underwriter'));
    expect(res.status).toBe(401);
  });

  it('GET returns applications', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindMany.mockResolvedValueOnce([{ id: 1 }] as never);
    const res = await GET(new NextRequest('http://localhost/api/v1/staff/underwriter'));
    expect(res.status).toBe(200);
  });

  it('GET filters by status', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindMany.mockResolvedValueOnce([] as never);
    await GET(new NextRequest('http://localhost/api/v1/staff/underwriter?status=under_review'));
    expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'under_review' } }));
  });

  it('POST returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=approve&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(401);
  });

  it('POST returns 404 for missing app', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=approve&id=99', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(404);
  });

  it('POST approve updates status with loan terms', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1, status: 'approved' } as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=approve&id=1', { method: 'POST', body: JSON.stringify({ interest_rate: 5.9, loan_term: 48, monthly_payment: 573, note: 'Good credit' }) } as never));
    expect(res.status).toBe(200);
    expect(mockNoteCreate).toHaveBeenCalled();
  });

  it('POST approve without optional fields', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=approve&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(200);
    expect(mockNoteCreate).not.toHaveBeenCalled();
  });

  it('POST reject with reason', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=reject&id=1', { method: 'POST', body: JSON.stringify({ reason: 'DTI too high' }) } as never));
    expect(res.status).toBe(200);
  });

  it('POST reject without reason uses default', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=reject&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(200);
  });

  it('POST request_documents updates status', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'under_review' } as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    mockHistoryCreate.mockResolvedValueOnce({} as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=request_documents&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(200);
  });

  it('POST unknown action returns 422', async () => {
    mockGetUser.mockResolvedValueOnce(uw as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1 } as never);
    const res = await POST(new NextRequest('http://localhost/api/v1/staff/underwriter?action=bad&id=1', { method: 'POST', body: '{}' } as never));
    expect(res.status).toBe(422);
  });
});
