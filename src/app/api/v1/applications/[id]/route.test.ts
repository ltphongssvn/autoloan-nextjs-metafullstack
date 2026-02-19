import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

vi.mock('@/lib/apiAuth', () => ({
  getAuthUser: vi.fn(),
  serializeApp: vi.fn((a: Record<string, unknown>) => ({ id: a.id, type: 'application', attributes: { id: a.id } })),
  APP_INCLUDE: { addresses: true, vehicles: true, financialInfos: true, documents: true, notes: { include: { user: true } }, user: true },
}));

import { GET, PATCH, DELETE } from './route';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/apiAuth';

const mockGetUser = vi.mocked(getAuthUser);
const mockFindUnique = vi.mocked(prisma.application.findUnique);
const mockUpdate = vi.mocked(prisma.application.update);
const mockDelete = vi.mocked(prisma.application.delete);

const mockUser = { id: 1, role: 'customer' };
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Applications [id] Route (Prisma)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('GET returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/v1/applications/1'), makeParams('1'));
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when not found', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockFindUnique.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost/api/v1/applications/99'), makeParams('99'));
    expect(res.status).toBe(404);
  });

  it('GET returns application', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockFindUnique.mockResolvedValueOnce({ id: 1, status: 'draft' } as never);
    const res = await GET(new NextRequest('http://localhost/api/v1/applications/1'), makeParams('1'));
    expect(res.status).toBe(200);
  });

  it('PATCH returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost/api/v1/applications/1', { method: 'PATCH', body: '{}' } as never);
    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(401);
  });

  it('PATCH updates application', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockUpdate.mockResolvedValueOnce({ id: 1, status: 'submitted' } as never);
    const req = new NextRequest('http://localhost/api/v1/applications/1', { method: 'PATCH', body: JSON.stringify({ status: 'submitted', current_step: 5, loan_amount: 30000, down_payment: 5000, loan_term: 48, interest_rate: 5.9, monthly_payment: 573, rejection_reason: 'test', signature_data: 'sig', agreement_accepted: true, submitted_at: '2026-01-01', decided_at: '2026-01-02', signed_at: '2026-01-03' }) } as never);
    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(200);
  });

  it('DELETE returns 401 without auth', async () => {
    mockGetUser.mockResolvedValueOnce(null);
    const res = await DELETE(new NextRequest('http://localhost/api/v1/applications/1', { method: 'DELETE' } as never), makeParams('1'));
    expect(res.status).toBe(401);
  });

  it('DELETE removes application', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockDelete.mockResolvedValueOnce({ id: 1 } as never);
    const res = await DELETE(new NextRequest('http://localhost/api/v1/applications/1', { method: 'DELETE' } as never), makeParams('1'));
    expect(res.status).toBe(200);
  });
});

describe('Applications [id] - additional branch coverage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('PATCH with minimal fields only updates provided ones', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockUpdate.mockResolvedValueOnce({ id: 1, status: 'draft' } as never);
    const req = new NextRequest('http://localhost/api/v1/applications/1', { method: 'PATCH', body: JSON.stringify({ status: 'submitted' }) } as never);
    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'submitted' },
    }));
  });

  it('PATCH with empty body sends empty update', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    const req = new NextRequest('http://localhost/api/v1/applications/1', { method: 'PATCH', body: '{}' } as never);
    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: {} }));
  });

  it('PATCH with loan fields only', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    const req = new NextRequest('http://localhost/api/v1/applications/1', { method: 'PATCH', body: JSON.stringify({ loan_amount: 25000, down_payment: 5000, loan_term: 60, interest_rate: 6.5, monthly_payment: 450 }) } as never);
    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(200);
  });

  it('PATCH with signature and agreement fields', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    const req = new NextRequest('http://localhost/api/v1/applications/1', { method: 'PATCH', body: JSON.stringify({ signature_data: 'sig', agreement_accepted: true, signed_at: '2026-01-01' }) } as never);
    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(200);
  });

  it('PATCH with date fields only', async () => {
    mockGetUser.mockResolvedValueOnce(mockUser as never);
    mockUpdate.mockResolvedValueOnce({ id: 1 } as never);
    const req = new NextRequest('http://localhost/api/v1/applications/1', { method: 'PATCH', body: JSON.stringify({ submitted_at: '2026-01-01', decided_at: '2026-01-02', rejection_reason: 'DTI too high', current_step: 3 }) } as never);
    const res = await PATCH(req, makeParams('1'));
    expect(res.status).toBe(200);
  });
});
