// autoloan-nextjs-metafullstack/src/app/api/v1/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken, verifyToken } from '@/lib/auth';

function jsonRes(data: object, status = 200, headers?: Record<string, string>) {
  return NextResponse.json(data, {
    status,
    headers: { 'Access-Control-Expose-Headers': 'Authorization', ...headers },
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'login';
  const body = await req.json();

  if (action === 'login') {
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

  return jsonRes({ error: 'Unknown action' }, 404);
}

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  if (auth) {
    try {
      const payload = verifyToken(auth);
      await prisma.jwtDenylist.create({ data: { jti: payload.jti, exp: payload.exp ? new Date(payload.exp * 1000) : null } });
    } catch { /* token already invalid */ }
  }
  return jsonRes({ status: { code: 200, message: 'Logged out successfully.' } });
}
