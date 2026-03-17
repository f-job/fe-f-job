/**
 * @jest-environment node
 */

/**
 * Unit tests for /api/auth/send-otp and /api/auth/verify-otp routes.
 * Tests the API route handlers directly using NextRequest.
 */

import { POST as sendOtpHandler } from '@/app/api/auth/send-otp/route';
import { POST as verifyOtpHandler } from '@/app/api/auth/verify-otp/route';
import { NextRequest } from 'next/server';

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/send-otp', () => {
  it('returns success for a valid Vietnamese phone number', async () => {
    const req = createRequest({ phone: '0901234567' });
    const res = await sendOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 400 when phone is missing', async () => {
    const req = createRequest({});
    const res = await sendOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for an invalid phone number', async () => {
    const req = createRequest({ phone: '12345' });
    const res = await sendOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when phone is not a string', async () => {
    const req = createRequest({ phone: 12345 });
    const res = await sendOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('returns success with valid idToken and phone', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-token-123', phone: '0901234567' }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.phone).toBe('0901234567');
  });

  it('returns 400 when idToken is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0901234567' }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('AUTH_INVALID_OTP');
  });

  it('returns 400 when phone is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'valid-token-123' }),
    });
    const res = await verifyOtpHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});

