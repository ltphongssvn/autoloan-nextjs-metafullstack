// autoloan-nextjs-metafullstack/src/app/api/v1/staff/officer/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAILS_API = process.env.RAILS_API_URL || 'http://localhost:3000';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  return headers;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const res = await fetch(`${RAILS_API}/api/v1/loan_officer/applications${url.search}`, { headers: getHeaders(req) });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || '';
  const appId = url.searchParams.get('id') || '';
  const body = await req.text();
  const res = await fetch(`${RAILS_API}/api/v1/loan_officer/applications/${appId}/${action}`, {
    method: 'POST', headers: getHeaders(req), body,
  });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
