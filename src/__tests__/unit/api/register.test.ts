/**
 * @jest-environment node
 */

/**
 * Unit tests for /api/auth/register route.
 * Tests validation, duplicate detection, and successful registration.
 */

import { POST as registerHandler } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

// Mock Supabase server client and helpers
const mockGetUserByPhone = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockCreateUser = jest.fn();
const mockCreateJobSeekerProfile = jest.fn();
const mockCreateEmployerProfile = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({}),
}));

jest.mock('@/lib/supabase/helpers', () => ({
  getUserByPhone: (...args: unknown[]) => mockGetUserByPhone(...args),
  getUserByEmail: (...args: unknown[]) => mockGetUserByEmail(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  createJobSeekerProfile: (...args: unknown[]) => mockCreateJobSeekerProfile(...args),
  createEmployerProfile: (...args: unknown[]) => mockCreateEmployerProfile(...args),
}));

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validJobSeeker = {
  userType: 'job_seeker',
  phone: '0901234567',
  email: 'test@example.com',
  fullName: 'Nguyễn Văn A',
  password: 'password123',
};

const validEmployer = {
  userType: 'employer',
  businessName: 'Công ty ABC',
  businessEmail: 'contact@abc.com',
  phone: '0912345678',
  businessType: 'Agency sự kiện',
  password: 'password123',
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no duplicates, successful creation
  mockGetUserByPhone.mockResolvedValue({ data: null, error: null });
  mockGetUserByEmail.mockResolvedValue({ data: null, error: null });
  mockCreateUser.mockResolvedValue({
    data: { id: 'user-123', phone: '0901234567', email: 'test@example.com', user_type: 'job_seeker' },
    error: null,
  });
  mockCreateJobSeekerProfile.mockResolvedValue({ data: {}, error: null });
  mockCreateEmployerProfile.mockResolvedValue({ data: {}, error: null });
});

describe('POST /api/auth/register', () => {
  // --- Validation ---

  it('returns 400 for invalid userType', async () => {
    const req = createRequest({ userType: 'admin', phone: '0901234567' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when userType is missing', async () => {
    const req = createRequest({ phone: '0901234567' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  // --- Job Seeker validation ---

  it('returns 400 when job seeker phone is missing', async () => {
    const req = createRequest({ ...validJobSeeker, phone: '' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when job seeker phone is invalid', async () => {
    const req = createRequest({ ...validJobSeeker, phone: '12345' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when job seeker email is missing', async () => {
    const req = createRequest({ ...validJobSeeker, email: '' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when job seeker email is invalid', async () => {
    const req = createRequest({ ...validJobSeeker, email: 'not-an-email' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when job seeker fullName is missing', async () => {
    const req = createRequest({ ...validJobSeeker, fullName: '' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when job seeker password is too short', async () => {
    const req = createRequest({ ...validJobSeeker, password: '1234567' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  // --- Employer validation ---

  it('returns 400 when employer businessName is missing', async () => {
    const req = createRequest({ ...validEmployer, businessName: '' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when employer businessEmail is missing', async () => {
    const req = createRequest({ ...validEmployer, businessEmail: '' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when employer phone is invalid', async () => {
    const req = createRequest({ ...validEmployer, phone: 'abc' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when employer businessType is missing', async () => {
    const req = createRequest({ ...validEmployer, businessType: '' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when employer password is too short', async () => {
    const req = createRequest({ ...validEmployer, password: 'short' });
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  // --- Duplicate detection ---

  it('returns 409 AUTH_DUPLICATE_PHONE when phone already exists', async () => {
    mockGetUserByPhone.mockResolvedValue({
      data: { id: 'existing-user', phone: '0901234567' },
      error: null,
    });

    const req = createRequest(validJobSeeker);
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe('AUTH_DUPLICATE_PHONE');
  });

  it('returns 409 AUTH_DUPLICATE_EMAIL when email already exists', async () => {
    mockGetUserByEmail.mockResolvedValue({
      data: { id: 'existing-user', email: 'test@example.com' },
      error: null,
    });

    const req = createRequest(validJobSeeker);
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe('AUTH_DUPLICATE_EMAIL');
  });

  it('returns 409 AUTH_DUPLICATE_EMAIL for employer with duplicate businessEmail', async () => {
    mockGetUserByEmail.mockResolvedValue({
      data: { id: 'existing-user', email: 'contact@abc.com' },
      error: null,
    });

    const req = createRequest(validEmployer);
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe('AUTH_DUPLICATE_EMAIL');
  });

  // --- Successful registration ---

  it('creates job seeker user and profile successfully', async () => {
    const req = createRequest(validJobSeeker);
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.userId).toBe('user-123');
    expect(data.userType).toBe('job_seeker');
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateJobSeekerProfile).toHaveBeenCalledTimes(1);
  });

  it('creates employer user and profile successfully', async () => {
    mockCreateUser.mockResolvedValue({
      data: { id: 'emp-123', phone: '0912345678', email: 'contact@abc.com', user_type: 'employer' },
      error: null,
    });

    const req = createRequest(validEmployer);
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.userId).toBe('emp-123');
    expect(data.userType).toBe('employer');
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateEmployerProfile).toHaveBeenCalledTimes(1);
  });

  // --- Server errors ---

  it('returns 500 when user creation fails', async () => {
    mockCreateUser.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    const req = createRequest(validJobSeeker);
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });

  it('returns 500 when profile creation fails', async () => {
    mockCreateJobSeekerProfile.mockResolvedValue({
      data: null,
      error: { message: 'Profile DB error' },
    });

    const req = createRequest(validJobSeeker);
    const res = await registerHandler(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });
});
