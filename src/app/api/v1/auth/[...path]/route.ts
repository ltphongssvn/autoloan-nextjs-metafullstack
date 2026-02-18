// autoloan-nextjs-metafullstack/src/app/api/v1/auth/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAILS_API = process.env.RAILS_API_URL || 'http://localhost:3000';

async function proxyToRails(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const railsPath = path.join('/');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const body = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  const url = new URL(req.url);
  const queryString = url.search;

  const res = await fetch(`${RAILS_API}/api/v1/auth/${railsPath}${queryString}`, {
    method: req.method,
    headers,
    body,
  });

  const data = await res.text();

  const responseHeaders: Record<string, string> = {
    'Content-Type': res.headers.get('Content-Type') || 'application/json',
    'Access-Control-Expose-Headers': 'Authorization',
  };

  const resAuth = res.headers.get('authorization');
  if (resAuth) responseHeaders['Authorization'] = resAuth;

  return new NextResponse(data, {
    status: res.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToRails(req, params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToRails(req, params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToRails(req, params);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToRails(req, params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyToRails(req, params);
}
