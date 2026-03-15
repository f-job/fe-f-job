import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// Simple cookie-based session management for F-Job.
// Stores userId and userType in a JSON cookie.
// No JWT — just a plain JSON cookie for now.
// ============================================================

const SESSION_COOKIE_NAME = 'fjob_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export interface SessionData {
  userId: string;
  userType: 'job_seeker' | 'employer';
}

/**
 * Set the session cookie on a NextResponse (used in API routes).
 */
export function setSessionCookie(response: NextResponse, session: SessionData): NextResponse {
  const value = JSON.stringify(session);
  response.cookies.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

/**
 * Parse session data from a NextRequest (used in middleware).
 * Returns null if no valid session cookie exists.
 */
export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const parsed = JSON.parse(cookie.value);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.userType === 'string') {
      return { userId: parsed.userId, userType: parsed.userType };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get session data in Server Components / API routes (uses next/headers).
 * Returns null if no valid session cookie exists.
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const parsed = JSON.parse(cookie.value);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.userType === 'string') {
      return { userId: parsed.userId, userType: parsed.userType };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (used for logout).
 * Call from an API route handler.
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

export { SESSION_COOKIE_NAME };
