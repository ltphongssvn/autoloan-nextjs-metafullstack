import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function makeReq(path: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(path, 'http://localhost:3000'));
  Object.entries(cookies).forEach(([k, v]) => req.cookies.set(k, v));
  return req;
}

describe('middleware', () => {
  it('allows public paths', () => {
    const res = middleware(makeReq('/'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows login page', () => {
    const res = middleware(makeReq('/login'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows signup page', () => {
    const res = middleware(makeReq('/signup'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows API routes', () => {
    const res = middleware(makeReq('/api/v1/auth'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows static assets', () => {
    const res = middleware(makeReq('/_next/static/chunk.js'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows files with extensions', () => {
    const res = middleware(makeReq('/favicon.ico'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects to login when no token', () => {
    const res = middleware(makeReq('/dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('location')).toContain('redirect=%2Fdashboard');
  });

  it('allows authenticated user to dashboard', () => {
    const res = middleware(makeReq('/dashboard', { token: 'abc', user_role: 'customer' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects non-officer from officer paths', () => {
    const res = middleware(makeReq('/officer', { token: 'abc', user_role: 'customer' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
  });

  it('allows officer to officer paths', () => {
    const res = middleware(makeReq('/officer', { token: 'abc', user_role: 'loan_officer' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects non-underwriter from underwriter paths', () => {
    const res = middleware(makeReq('/underwriter', { token: 'abc', user_role: 'customer' }));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
  });

  it('allows underwriter to underwriter paths', () => {
    const res = middleware(makeReq('/underwriter', { token: 'abc', user_role: 'underwriter' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows officer to nested officer path', () => {
    const res = middleware(makeReq('/officer/applications/1', { token: 'abc', user_role: 'loan_officer' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows forgot-password and reset-password', () => {
    expect(middleware(makeReq('/forgot-password')).headers.get('x-middleware-next')).toBe('1');
    expect(middleware(makeReq('/reset-password')).headers.get('x-middleware-next')).toBe('1');
  });

  it('allows agreement page for authenticated user', () => {
    const res = middleware(makeReq('/agreement/1', { token: 'abc', user_role: 'customer' }));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});

  it('allows account-locked page', () => {
    const res = middleware(makeReq('/account-locked'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('allows confirm-email page', () => {
    const res = middleware(makeReq('/confirm-email'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
