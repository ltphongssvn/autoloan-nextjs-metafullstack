// autoloan-nextjs-metafullstack/src/app/api/v1/staff/underwriter/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, serializeApp, APP_INCLUDE } from '@/lib/apiAuth';
import { ApplicationStatus } from '@prisma/client';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'underwriter') return unauthorized();

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const apps = await prisma.application.findMany({
    where,
    include: APP_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: apps.map((a) => serializeApp(a as unknown as Record<string, unknown>)) });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'underwriter') return unauthorized();

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const appId = Number(url.searchParams.get('id') || '0');
  const body = await req.json().catch(() => ({}));

  const app = await prisma.application.findUnique({ where: { id: appId } });
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let newStatus: ApplicationStatus | null = null;
  const updateData: Record<string, unknown> = {};

  if (action === 'approve') {
    newStatus = ApplicationStatus.approved;
    updateData.decidedAt = new Date();
    if (body.interest_rate) updateData.interestRate = body.interest_rate;
    if (body.loan_term) updateData.loanTerm = body.loan_term;
    if (body.monthly_payment) updateData.monthlyPayment = body.monthly_payment;
  }
  if (action === 'reject') {
    newStatus = ApplicationStatus.rejected;
    updateData.decidedAt = new Date();
    updateData.rejectionReason = body.reason || 'Application rejected';
  }
  if (action === 'request_documents') {
    newStatus = ApplicationStatus.pending_documents;
  }

  if (newStatus) {
    updateData.status = newStatus;
    const updated = await prisma.application.update({
      where: { id: appId },
      data: updateData,
      include: APP_INCLUDE,
    });

    if (body.note) {
      await prisma.applicationNote.create({
        data: { applicationId: appId, userId: user.id, note: body.note, internal: true },
      });
    }

    await prisma.statusHistory.create({
      data: { applicationId: appId, userId: user.id, fromStatus: app.status, toStatus: newStatus, comment: body.note || body.reason || action },
    });

    return NextResponse.json({ data: serializeApp(updated as unknown as Record<string, unknown>) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 422 });
}
