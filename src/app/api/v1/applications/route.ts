// autoloan-nextjs-metafullstack/src/app/api/v1/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, serializeApp, APP_INCLUDE } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = { userId: user.id };
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const appCount = await prisma.application.count();
  const appNumber = `AL-2026-${String(appCount + 1).padStart(5, '0')}`;

  const app = await prisma.application.create({
    data: {
      applicationNumber: appNumber,
      userId: user.id,
      status: 'draft',
      currentStep: 1,
      dob: body.dob ? new Date(body.dob) : undefined,
      ssnEncrypted: body.ssn,
      loanAmount: body.loan_amount,
      downPayment: body.down_payment,
    },
    include: APP_INCLUDE,
  });

  return NextResponse.json(
    { data: serializeApp(app as unknown as Record<string, unknown>) },
    { status: 201 },
  );
}
