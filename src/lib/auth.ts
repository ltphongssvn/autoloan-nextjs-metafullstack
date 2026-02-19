// autoloan-nextjs-metafullstack/src/lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-key-minimum-32-characters-long';
const JWT_EXPIRY = '1h';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: { id: number; email: string; role: string }): string {
  const payload: JwtPayload = {
    sub: String(user.id),
    email: user.email,
    role: user.role,
    jti: uuidv4(),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function getUserIdFromToken(token: string): number | null {
  try {
    const payload = verifyToken(token);
    return parseInt(payload.sub, 10);
  } catch {
    return null;
  }
}
