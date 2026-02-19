// autoloan-nextjs-metafullstack/src/lib/auth.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken, getUserIdFromToken } from './auth';

describe('auth lib', () => {
  it('hashes and verifies password', () => {
    const hash = hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(verifyPassword('password123', hash)).toBe(true);
    expect(verifyPassword('wrong', hash)).toBe(false);
  });

  it('generates and verifies JWT token', () => {
    const token = generateToken({ id: 1, email: 'test@test.com', role: 'customer' });
    expect(token).toBeTruthy();
    const payload = verifyToken(token);
    expect(payload.sub).toBe('1');
    expect(payload.email).toBe('test@test.com');
    expect(payload.role).toBe('customer');
    expect(payload.jti).toBeTruthy();
  });

  it('getUserIdFromToken returns user id', () => {
    const token = generateToken({ id: 42, email: 'a@b.com', role: 'loan_officer' });
    expect(getUserIdFromToken(token)).toBe(42);
  });

  it('getUserIdFromToken returns null for invalid token', () => {
    expect(getUserIdFromToken('invalid-token')).toBeNull();
  });

  it('verifyToken throws for invalid token', () => {
    expect(() => verifyToken('bad-token')).toThrow();
  });
});
