/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

const mockCreateServerSupabaseClient = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
}));

const mockGetJobById = jest.fn();
const mockGetJobSeekerProfile = jest.fn();
const mockCreateApplication = jest.fn();
jest.mock('@/lib/supabase/helpers', () => ({
  getJobById: (...args: unknown[]) => mockGetJobById(...args),
  getJobSeekerProfile: (...args: unknown[]) => mockGetJobSeekerProfile(...args),
  createApplication: (...args: unknown[]) => mockCreateApplication(...args),
}));

import { POST } from '@/app/api/jobs/[id]/apply/route';

function createRequest(): NextRequest {
  return new NextRequest('http://localhost:3000/api/jobs/job-1/apply', {
    method: 'POST',
  });
}

const mockParams = Promise.resolve({ id: 'job-1' });

const completeProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  full_name: 'Nguyễn Văn A',
  date_of_birth: '2000-01-01',
  address: '123 Đường ABC',
  current_location: 'Hải Châu, Đà Nẵng',
  skills: ['phục vụ'],
};

const incompleteProfile = {
  id: 'profile-1',
  user_id: 'user-1',
  full_name: 'Nguyễn Văn A',
  date_of_birth: null,
  address: null,
  current_location: null,
  skills: [],
};

// Mock Supabase client with chainable query builder
function createMockSupabaseClient(existingApps: unknown[] = []) {
  const mockClient = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: existingApps, error: null }),
          }),
        }),
      }),
    }),
  };
  return mockClient;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/jobs/[id]/apply', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient());

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns 403 when user is an employer', async () => {
    mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient());

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns 404 when job does not exist', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient());
    mockGetJobById.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe('JOB_NOT_FOUND');
  });

  it('returns 403 PROFILE_INCOMPLETE when profile does not exist', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient());
    mockGetJobById.mockResolvedValue({ data: { id: 'job-1' }, error: null });
    mockGetJobSeekerProfile.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.code).toBe('PROFILE_INCOMPLETE');
  });

  it('returns 403 PROFILE_INCOMPLETE when profile is missing required fields', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient());
    mockGetJobById.mockResolvedValue({ data: { id: 'job-1' }, error: null });
    mockGetJobSeekerProfile.mockResolvedValue({ data: incompleteProfile, error: null });

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.code).toBe('PROFILE_INCOMPLETE');
  });

  it('returns 409 APPLICATION_DUPLICATE when application already exists', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
    mockCreateServerSupabaseClient.mockReturnValue(
      createMockSupabaseClient([{ id: 'existing-app' }]),
    );
    mockGetJobById.mockResolvedValue({ data: { id: 'job-1' }, error: null });
    mockGetJobSeekerProfile.mockResolvedValue({ data: completeProfile, error: null });

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe('APPLICATION_DUPLICATE');
  });

  it('returns 201 and creates application on success', async () => {
    const mockApp = {
      id: 'app-1',
      job_id: 'job-1',
      job_seeker_id: 'profile-1',
      status: 'pending',
      applied_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient([]));
    mockGetJobById.mockResolvedValue({ data: { id: 'job-1' }, error: null });
    mockGetJobSeekerProfile.mockResolvedValue({ data: completeProfile, error: null });
    mockCreateApplication.mockResolvedValue({ data: mockApp, error: null });

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.application.status).toBe('pending');
    expect(data.application.job_id).toBe('job-1');
    expect(mockCreateApplication).toHaveBeenCalledWith(
      expect.anything(),
      { job_id: 'job-1', job_seeker_id: 'profile-1' },
    );
  });

  it('returns 409 on database unique constraint violation (race condition)', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient([]));
    mockGetJobById.mockResolvedValue({ data: { id: 'job-1' }, error: null });
    mockGetJobSeekerProfile.mockResolvedValue({ data: completeProfile, error: null });
    mockCreateApplication.mockResolvedValue({
      data: null,
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    });

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.code).toBe('APPLICATION_DUPLICATE');
  });

  it('returns 500 on unexpected create error', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
    mockCreateServerSupabaseClient.mockReturnValue(createMockSupabaseClient([]));
    mockGetJobById.mockResolvedValue({ data: { id: 'job-1' }, error: null });
    mockGetJobSeekerProfile.mockResolvedValue({ data: completeProfile, error: null });
    mockCreateApplication.mockResolvedValue({
      data: null,
      error: { code: 'UNKNOWN', message: 'something went wrong' },
    });

    const res = await POST(createRequest(), { params: mockParams });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });
});
