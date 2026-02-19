export const dynamic = 'force-dynamic';
// autoloan-nextjs-metafullstack/src/app/api/v1/auth/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, verifyToken, hashPassword } from '@/lib/auth';

function jsonRes(data: object, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: { 'Access-Control-Expose-Headers': 'Authorization', ...headers },
  });
}

function unauthorized(message = 'You need to sign in.') {
  return jsonRes({ error: { code: 'Unauthorized', message } }, 401);
}

async function handleLogin(req: NextRequest) {
  const body = await req.json();
  const { email, password } = body.user || {};
  if (!email || !password) return jsonRes({ error: 'Email and password required' }, 422);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.encryptedPassword)) {
    return jsonRes({ error: { code: 'Unauthorized', message: 'Invalid email or password.' } }, 401);
  }
  if (!user.confirmedAt) return jsonRes({ error: 'Email not confirmed' }, 401);
  if (user.lockedAt) return jsonRes({ error: 'Account locked' }, 423);

  await prisma.user.update({ where: { id: user.id }, data: { signInCount: { increment: 1 }, currentSignInAt: new Date() } });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  return jsonRes({
    status: { code: 200, message: 'Logged in successfully.' },
    data: { id: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName, phone: user.phone, role: user.role, created_at: user.createdAt, full_name: `${user.firstName} ${user.lastName}` },
  }, 200, { Authorization: `Bearer ${token}` });
}

async function handleSignup(req: NextRequest) {
  const body = await req.json();
  const { email, password, first_name, last_name, phone, role } = body.user || {};
  if (!email || !password || !first_name || !last_name || !phone) {
    return jsonRes({ error: 'All fields required' }, 422);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return jsonRes({ error: 'Email already registered' }, 422);

  const user = await prisma.user.create({
    data: {
      email, encryptedPassword: hashPassword(password),
      firstName: first_name, lastName: last_name, phone,
      role: role === 'customer' ? 'customer' : 'customer',
      confirmedAt: new Date(), // auto-confirm for now
    },
  });

  const token = generateToken({ id: user.id, email: user.email, role: user.role });
  return jsonRes({
    status: { code: 200, message: 'Signed up successfully.' },
    data: { id: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName, phone: user.phone, role: user.role, created_at: user.createdAt, full_name: `${user.firstName} ${user.lastName}` },
  }, 200, { Authorization: `Bearer ${token}` });
}

async function handleMe(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!auth) return unauthorized();
  try {
    const payload = verifyToken(auth);
    const user = await prisma.user.findUnique({ where: { id: parseInt(payload.sub) } });
    if (!user) return unauthorized();
    return jsonRes({
      status: { code: 200 },
      data: { id: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName, phone: user.phone, role: user.role, created_at: user.createdAt, full_name: `${user.firstName} ${user.lastName}` },
    });
  } catch {
    return unauthorized();
  }
}

async function handleLogout(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (auth) {
    try {
      const payload = verifyToken(auth);
      await prisma.jwtDenylist.create({ data: { jti: payload.jti, exp: payload.exp ? new Date(payload.exp * 1000) : null } });
    } catch { /* token already invalid */ }
  }
  return jsonRes({ status: { code: 200, message: 'Logged out successfully.' } });
}

async function handlePassword(req: NextRequest) {
  if (req.method === 'POST') {
    await req.json();
    // Reset password - email from body.user
    // In production, send reset email. For now, just acknowledge.
    return jsonRes({ status: { code: 200, message: 'Reset instructions sent if email exists.' } });
  }
  if (req.method === 'PUT') {
    const body = await req.json();
    const { reset_password_token, password } = body.user || {};
    if (!reset_password_token || !password) return jsonRes({ error: 'Token and password required' }, 422);
    const user = await prisma.user.findFirst({ where: { resetPasswordToken: reset_password_token } });
    if (!user) return jsonRes({ error: 'Invalid or expired token' }, 422);
    await prisma.user.update({ where: { id: user.id }, data: { encryptedPassword: hashPassword(password), resetPasswordToken: null } });
    return jsonRes({ status: { code: 200, message: 'Password updated.' } });
  }
  return jsonRes({ error: 'Not found' }, 404);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join('/');
  if (route === 'me') return handleMe(req);
  return jsonRes({ error: 'Not found' }, 404);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join('/');
  if (route === 'login') return handleLogin(req);
  if (route === 'signup') return handleSignup(req);
  if (route === 'password') return handlePassword(req);
  if (route === 'refresh') return handleMe(req);
  return jsonRes({ error: 'Not found' }, 404);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join('/');
  if (route === 'password') return handlePassword(req);
  return jsonRes({ error: 'Not found' }, 404);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  void req; void params;
  return jsonRes({ error: 'Not found' }, 404);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const route = path.join('/');
  if (route === 'logout') return handleLogout(req);
  return jsonRes({ error: 'Not found' }, 404);
}
