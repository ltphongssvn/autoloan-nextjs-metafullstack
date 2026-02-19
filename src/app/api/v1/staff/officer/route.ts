export const dynamic = 'force-dynamic';
// autoloan-nextjs-metafullstack/src/app/api/v1/staff/officer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, serializeApp, APP_INCLUDE } from '@/lib/apiAuth';
import { ApplicationStatus } from '@prisma/client';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'loan_officer') return unauthorized();

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
  if (!user || user.role !== 'loan_officer') return unauthorized();

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const appId = Number(url.searchParams.get('id') || '0');
  const body = await req.json().catch(() => ({}));

  const app = await prisma.application.findUnique({ where: { id: appId } });
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let newStatus: ApplicationStatus | null = null;
  if (action === 'start_review') newStatus = ApplicationStatus.under_review;
  if (action === 'forward_to_underwriter') newStatus = ApplicationStatus.under_review;
  if (action === 'request_documents') newStatus = ApplicationStatus.pending_documents;

  if (newStatus) {
    const updated = await prisma.application.update({
      where: { id: appId },
      data: { status: newStatus },
      include: APP_INCLUDE,
    });

    if (body.note) {
      await prisma.applicationNote.create({
        data: { applicationId: appId, userId: user.id, note: body.note, internal: true },
      });
    }

    await prisma.statusHistory.create({
      data: { applicationId: appId, userId: user.id, fromStatus: app.status, toStatus: newStatus, comment: body.note || action },
    });

    return NextResponse.json({ data: serializeApp(updated as unknown as Record<string, unknown>) });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 422 });
}
