// autoloan-nextjs-metafullstack/src/app/api/v1/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAILS_API = process.env.RAILS_API_URL || 'http://localhost:3000';

function getHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  return headers;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${RAILS_API}/api/v1/applications/${id}`, { headers: getHeaders(req) });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.text();
  const res = await fetch(`${RAILS_API}/api/v1/applications/${id}`, { method: 'PATCH', headers: getHeaders(req), body });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${RAILS_API}/api/v1/applications/${id}`, { method: 'DELETE', headers: getHeaders(req) });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
