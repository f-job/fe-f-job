/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';
import { SESSION_COOKIE_NAME, SessionData } from '@/lib/session';

function makeRequest(pathname: string, session?: SessionData): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const headers = new Headers();
  if (session) {
    headers.set(
      'cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(session))}`,
    );
  }
  return new NextRequest(url, { headers });
}

describe('Auth middleware', () => {
  const validSession: SessionData = { userId: 'u-1', userType: 'job_seeker' };

  describe('public routes', () => {
    it('allows access to landing page without session', () => {
      const req = makeRequest('/');
      const res = middleware(req);
      expect(res.status).not.toBe(307); // not a redirect
    });

    it('allows access to /dang-nhap without session', () => {
      const req = makeRequest('/dang-nhap');
      const res = middleware(req);
      expect(res.status).not.toBe(307);
    });

    it('allows access to /viec-lam/some-slug without session', () => {
      const req = makeRequest('/viec-lam/nhan-vien-phuc-vu');
      const res = middleware(req);
      expect(res.status).not.toBe(307);
    });

    it('allows access to /dang-ky/nguoi-tim-viec without session', () => {
      const req = makeRequest('/dang-ky/nguoi-tim-viec');
      const res = middleware(req);
      expect(res.status).not.toBe(307);
    });
  });

  describe('static and API routes', () => {
    it('skips /_next/static paths', () => {
      const req = makeRequest('/_next/static/chunk.js');
      const res = middleware(req);
      expect(res.status).not.toBe(307);
    });

    it('skips API routes', () => {
      const req = makeRequest('/api/auth/login');
      const res = middleware(req);
      expect(res.status).not.toBe(307);
    });

    it('skips static files like favicon.ico', () => {
      const req = makeRequest('/favicon.ico');
      const res = middleware(req);
      expect(res.status).not.toBe(307);
    });
  });

  describe('authenticated routes — no session', () => {
    it('redirects /ho-so to /dang-nhap', () => {
      const req = makeRequest('/ho-so');
      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get('location')!;
      expect(location).toContain('/dang-nhap');
      expect(location).toContain('callbackUrl=%2Fho-so');
    });

    it('redirects /lich-ranh to /dang-nhap', () => {
      const req = makeRequest('/lich-ranh');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dang-nhap');
    });

    it('redirects /don-ung-tuyen to /dang-nhap', () => {
      const req = makeRequest('/don-ung-tuyen');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dang-nhap');
    });

    it('redirects /dashboard to /dang-nhap', () => {
      const req = makeRequest('/dashboard');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dang-nhap');
    });

    it('redirects /dashboard/dang-tin to /dang-nhap', () => {
      const req = makeRequest('/dashboard/dang-tin');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dang-nhap');
    });
  });

  describe('authenticated routes — with valid session', () => {
    it('allows /ho-so with session and sets user headers', () => {
      const req = makeRequest('/ho-so', validSession);
      const res = middleware(req);
      expect(res.status).not.toBe(307);
      expect(res.headers.get('x-user-id')).toBe('u-1');
      expect(res.headers.get('x-user-type')).toBe('job_seeker');
    });

    it('allows /dashboard with employer session', () => {
      const employerSession: SessionData = { userId: 'e-1', userType: 'employer' };
      const req = makeRequest('/dashboard', employerSession);
      const res = middleware(req);
      expect(res.status).not.toBe(307);
      expect(res.headers.get('x-user-id')).toBe('e-1');
      expect(res.headers.get('x-user-type')).toBe('employer');
    });

    it('allows /dashboard/ung-vien/job-123 with session', () => {
      const req = makeRequest('/dashboard/ung-vien/job-123', validSession);
      const res = middleware(req);
      expect(res.status).not.toBe(307);
    });
  });

  describe('authenticated routes — with invalid session cookie', () => {
    it('redirects when session cookie has invalid JSON', () => {
      const url = 'http://localhost:3000/ho-so';
      const headers = new Headers();
      headers.set('cookie', `${SESSION_COOKIE_NAME}=not-valid-json`);
      const req = new NextRequest(url, { headers });

      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/dang-nhap');
    });
  });
});
