// autoloan-nextjs-metafullstack/src/lib/apiAuth.ts
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { verifyToken } from './auth';

export async function getAuthUser(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth) return null;
  try {
    const payload = verifyToken(auth);
    const denied = await prisma.jwtDenylist.findFirst({ where: { jti: payload.jti } });
    if (denied) return null;
    const user = await prisma.user.findUnique({ where: { id: parseInt(payload.sub) } });
    return user;
  } catch {
    return null;
  }
}

export function serializeApp(app: Record<string, unknown>) {
  return {
    id: app.id,
    type: 'application',
    attributes: {
      id: app.id,
      application_number: app.applicationNumber,
      status: app.status,
      current_step: app.currentStep,
      loan_term: app.loanTerm,
      interest_rate: app.interestRate ? String(app.interestRate) : null,
      monthly_payment: app.monthlyPayment ? String(app.monthlyPayment) : null,
      loan_amount: app.loanAmount ? String(app.loanAmount) : null,
      down_payment: app.downPayment ? String(app.downPayment) : null,
      dob: app.dob,
      submitted_at: app.submittedAt,
      decided_at: app.decidedAt,
      signature_data: app.signatureData,
      signed_at: app.signedAt,
      agreement_accepted: app.agreementAccepted,
      rejection_reason: app.rejectionReason,
      created_at: app.createdAt,
      updated_at: app.updatedAt,
      personal_info: app.addresses && (app.addresses as Record<string, unknown>[]).length > 0
        ? (() => { const a = (app.addresses as Record<string, unknown>[])[0]; return { address: a.streetAddress, city: a.city, state: a.state, zip: a.zipCode, first_name: (app.user as Record<string, unknown>)?.firstName, last_name: (app.user as Record<string, unknown>)?.lastName }; })()
        : {},
      car_details: app.vehicles && (app.vehicles as Record<string, unknown>[]).length > 0
        ? (() => { const v = (app.vehicles as Record<string, unknown>[])[0]; return { make: v.make, model: v.model, year: v.year, price: v.estimatedValue ? String(v.estimatedValue) : null, vin: v.vin, mileage: v.mileage, condition: v.condition }; })()
        : {},
      loan_details: { amount: app.loanAmount ? String(app.loanAmount) : null, down_payment: app.downPayment ? String(app.downPayment) : null },
      employment_info: app.financialInfos && (app.financialInfos as Record<string, unknown>[]).length > 0
        ? (() => { const f = (app.financialInfos as Record<string, unknown>[])[0]; return { employer: f.employerName, job_title: f.jobTitle, income: f.annualIncome ? String(f.annualIncome) : null, years: f.yearsEmployed, employment_type: f.employmentStatus }; })()
        : {},
      links: { self: `/api/v1/applications/${app.id}` },
    },
  };
}

export const APP_INCLUDE = {
  addresses: true,
  vehicles: true,
  financialInfos: true,
  documents: true,
  notes: { include: { user: true } },
  user: true,
};
