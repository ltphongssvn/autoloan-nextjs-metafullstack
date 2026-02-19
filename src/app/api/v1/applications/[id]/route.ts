export const dynamic = 'force-dynamic';
// autoloan-nextjs-metafullstack/src/app/api/v1/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, serializeApp, APP_INCLUDE } from '@/lib/apiAuth';
import { ApplicationStatus } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const app = await prisma.application.findUnique({ where: { id: Number(id) }, include: APP_INCLUDE });
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: serializeApp(app as unknown as Record<string, unknown>) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if (body.status) updateData.status = body.status as ApplicationStatus;
  if (body.current_step) updateData.currentStep = body.current_step;
  if (body.loan_amount !== undefined) updateData.loanAmount = body.loan_amount;
  if (body.down_payment !== undefined) updateData.downPayment = body.down_payment;
  if (body.loan_term) updateData.loanTerm = body.loan_term;
  if (body.interest_rate) updateData.interestRate = body.interest_rate;
  if (body.monthly_payment) updateData.monthlyPayment = body.monthly_payment;
  if (body.rejection_reason) updateData.rejectionReason = body.rejection_reason;
  if (body.signature_data) updateData.signatureData = body.signature_data;
  if (body.agreement_accepted !== undefined) updateData.agreementAccepted = body.agreement_accepted;
  if (body.submitted_at) updateData.submittedAt = new Date(body.submitted_at);
  if (body.decided_at) updateData.decidedAt = new Date(body.decided_at);
  if (body.signed_at) updateData.signedAt = new Date(body.signed_at);

  const app = await prisma.application.update({
    where: { id: Number(id) },
    data: updateData,
    include: APP_INCLUDE,
  });

  return NextResponse.json({ data: serializeApp(app as unknown as Record<string, unknown>) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.application.delete({ where: { id: Number(id) } });
  return NextResponse.json({ status: { code: 200, message: 'Deleted' } });
}
