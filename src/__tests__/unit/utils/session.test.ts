/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  setSessionCookie,
  getSessionFromRequest,
  clearSessionCookie,
  SESSION_COOKIE_NAME,
  SessionData,
} from '@/lib/session';

describe('Session utilities', () => {
  describe('setSessionCookie', () => {
    it('sets a JSON cookie with userId and userType on the response', () => {
      const response = NextResponse.json({ ok: true });
      const session: SessionData = { userId: 'u-123', userType: 'job_seeker' };

      setSessionCookie(response, session);

      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie!.value).toBe(JSON.stringify(session));
      expect(cookie!.httpOnly).toBe(true);
      expect(cookie!.path).toBe('/');
    });

    it('sets employer session correctly', () => {
      const response = NextResponse.json({ ok: true });
      const session: SessionData = { userId: 'u-456', userType: 'employer' };

      setSessionCookie(response, session);

      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      const parsed = JSON.parse(cookie!.value);
      expect(parsed.userId).toBe('u-456');
      expect(parsed.userType).toBe('employer');
    });
  });

  describe('getSessionFromRequest', () => {
    function makeRequest(cookieValue?: string): NextRequest {
      const url = 'http://localhost:3000/ho-so';
      const headers = new Headers();
      if (cookieValue !== undefined) {
        headers.set('cookie', `${SESSION_COOKIE_NAME}=${encodeURIComponent(cookieValue)}`);
      }
      return new NextRequest(url, { headers });
    }

    it('returns session data when a valid cookie is present', () => {
      const session: SessionData = { userId: 'u-1', userType: 'job_seeker' };
      const req = makeRequest(JSON.stringify(session));

      const result = getSessionFromRequest(req);
      expect(result).toEqual(session);
    });

    it('returns null when no cookie is present', () => {
      const req = makeRequest();
      expect(getSessionFromRequest(req)).toBeNull();
    });

    it('returns null for invalid JSON', () => {
      const req = makeRequest('not-json');
      expect(getSessionFromRequest(req)).toBeNull();
    });

    it('returns null when cookie is missing userId', () => {
      const req = makeRequest(JSON.stringify({ userType: 'employer' }));
      expect(getSessionFromRequest(req)).toBeNull();
    });

    it('returns null when cookie is missing userType', () => {
      const req = makeRequest(JSON.stringify({ userId: 'u-1' }));
      expect(getSessionFromRequest(req)).toBeNull();
    });

    it('returns null for empty cookie value', () => {
      const req = makeRequest('');
      expect(getSessionFromRequest(req)).toBeNull();
    });
  });

  describe('clearSessionCookie', () => {
    it('sets the cookie with maxAge 0 to clear it', () => {
      const response = NextResponse.json({ ok: true });
      clearSessionCookie(response);

      const cookie = response.cookies.get(SESSION_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie!.value).toBe('');
    });
  });
});
