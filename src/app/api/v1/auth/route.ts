// autoloan-nextjs-metafullstack/src/app/api/v1/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAILS_API = process.env.RAILS_API_URL || 'http://localhost:3000';

async function proxyToRails(req: NextRequest, path: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  const res = await fetch(`${RAILS_API}/api/v1/${path}`, {
    method: req.method,
    headers,
    body,
  });

  const data = await res.text();

  const responseHeaders: Record<string, string> = {
    'Content-Type': res.headers.get('Content-Type') || 'application/json',
    'Access-Control-Expose-Headers': 'Authorization',
  };

  // Forward JWT token from Rails response
  const resAuth = res.headers.get('authorization');
  if (resAuth) responseHeaders['Authorization'] = resAuth;

  return new NextResponse(data, {
    status: res.status,
    headers: responseHeaders,
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'login';
  return proxyToRails(req, `auth/${action}`);
}

export async function DELETE(req: NextRequest) {
  return proxyToRails(req, 'auth/logout');
}
