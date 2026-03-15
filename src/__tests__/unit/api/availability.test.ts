/**
 * @jest-environment node
 */

/**
 * Unit tests for /api/profile/availability route.
 * Tests GET, POST, DELETE operations and recurring slot expansion.
 */

import {
  GET as getHandler,
  POST as postHandler,
  DELETE as deleteHandler,
  expandRecurringSlots,
} from '@/app/api/profile/availability/route';
import { NextRequest } from 'next/server';

// Mock session
const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({}),
}));

const mockGetJobSeekerProfile = jest.fn();
const mockGetAvailabilities = jest.fn();
const mockCreateAvailability = jest.fn();
const mockDeleteAvailability = jest.fn();

jest.mock('@/lib/supabase/helpers', () => ({
  getJobSeekerProfile: (...args: unknown[]) => mockGetJobSeekerProfile(...args),
  getAvailabilities: (...args: unknown[]) => mockGetAvailabilities(...args),
  createAvailability: (...args: unknown[]) => mockCreateAvailability(...args),
  deleteAvailability: (...args: unknown[]) => mockDeleteAvailability(...args),
}));

const mockProfile = { id: 'profile-1', user_id: 'user-1' };
const mockSession = { userId: 'user-1', userType: 'job_seeker' as const };

function createPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/profile/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(id?: string): NextRequest {
  const url = id
    ? `http://localhost:3000/api/profile/availability?id=${id}`
    : 'http://localhost:3000/api/profile/availability';
  return new NextRequest(url, { method: 'DELETE' });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue(mockSession);
  mockGetJobSeekerProfile.mockResolvedValue({ data: mockProfile, error: null });
  mockGetAvailabilities.mockResolvedValue({ data: [], error: null });
  mockCreateAvailability.mockResolvedValue({
    data: {
      id: 'slot-1',
      job_seeker_id: 'profile-1',
      date: '2025-01-20',
      start_time: '09:00',
      end_time: '17:00',
      is_recurring: false,
      recurrence_pattern: null,
    },
    error: null,
  });
  mockDeleteAvailability.mockResolvedValue({ error: null });
});

// --- GET ---

describe('GET /api/profile/availability', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const res = await getHandler();
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns 404 when profile not found', async () => {
    mockGetJobSeekerProfile.mockResolvedValue({ data: null, error: null });
    const res = await getHandler();
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.code).toBe('JOB_NOT_FOUND');
  });

  it('returns empty slots array when no availability', async () => {
    const res = await getHandler();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.slots).toEqual([]);
  });

  it('returns slots for authenticated user', async () => {
    const mockSlots = [
      {
        id: 'slot-1',
        job_seeker_id: 'profile-1',
        date: '2025-01-20',
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: false,
        recurrence_pattern: null,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    mockGetAvailabilities.mockResolvedValue({ data: mockSlots, error: null });

    const res = await getHandler();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.slots).toHaveLength(1);
    expect(data.slots[0].date).toBe('2025-01-20');
  });

  it('returns 500 when fetch fails', async () => {
    mockGetAvailabilities.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const res = await getHandler();
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });
});

// --- POST ---

describe('POST /api/profile/availability', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = createPostRequest({ date: '2025-01-20', startTime: '09:00', endTime: '17:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns 400 when date is missing', async () => {
    const req = createPostRequest({ startTime: '09:00', endTime: '17:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when startTime is missing', async () => {
    const req = createPostRequest({ date: '2025-01-20', endTime: '17:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when endTime is missing', async () => {
    const req = createPostRequest({ date: '2025-01-20', startTime: '09:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when time format is invalid', async () => {
    const req = createPostRequest({ date: '2025-01-20', startTime: '9am', endTime: '5pm' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when startTime >= endTime', async () => {
    const req = createPostRequest({ date: '2025-01-20', startTime: '17:00', endTime: '09:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when date format is invalid', async () => {
    const req = createPostRequest({ date: '20-01-2025', startTime: '09:00', endTime: '17:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('creates a non-recurring slot successfully', async () => {
    const req = createPostRequest({ date: '2025-01-20', startTime: '09:00', endTime: '17:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.slot).toBeDefined();
    expect(mockCreateAvailability).toHaveBeenCalledWith(expect.anything(), {
      job_seeker_id: 'profile-1',
      date: '2025-01-20',
      start_time: '09:00',
      end_time: '17:00',
      is_recurring: false,
      recurrence_pattern: null,
    });
  });

  it('creates a recurring slot with weekly pattern', async () => {
    mockCreateAvailability.mockResolvedValue({
      data: {
        id: 'slot-2',
        job_seeker_id: 'profile-1',
        date: '2025-01-20',
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
        recurrence_pattern: 'weekly',
      },
      error: null,
    });

    const req = createPostRequest({
      date: '2025-01-20',
      startTime: '09:00',
      endTime: '17:00',
      isRecurring: true,
    });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockCreateAvailability).toHaveBeenCalledWith(expect.anything(), {
      job_seeker_id: 'profile-1',
      date: '2025-01-20',
      start_time: '09:00',
      end_time: '17:00',
      is_recurring: true,
      recurrence_pattern: 'weekly',
    });
  });

  it('returns 404 when profile not found', async () => {
    mockGetJobSeekerProfile.mockResolvedValue({ data: null, error: null });
    const req = createPostRequest({ date: '2025-01-20', startTime: '09:00', endTime: '17:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.code).toBe('JOB_NOT_FOUND');
  });

  it('returns 500 when creation fails', async () => {
    mockCreateAvailability.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const req = createPostRequest({ date: '2025-01-20', startTime: '09:00', endTime: '17:00' });
    const res = await postHandler(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });
});

// --- DELETE ---

describe('DELETE /api/profile/availability', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = createDeleteRequest('slot-1');
    const res = await deleteHandler(req);
    const data = await res.json();
    expect(res.status).toBe(401);
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns 400 when id is missing', async () => {
    const req = createDeleteRequest();
    const res = await deleteHandler(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('deletes a slot successfully', async () => {
    const req = createDeleteRequest('slot-1');
    const res = await deleteHandler(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockDeleteAvailability).toHaveBeenCalledWith(expect.anything(), 'slot-1');
  });

  it('returns 500 when deletion fails', async () => {
    mockDeleteAvailability.mockResolvedValue({ error: { message: 'DB error' } });
    const req = createDeleteRequest('slot-1');
    const res = await deleteHandler(req);
    const data = await res.json();
    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });
});

// --- expandRecurringSlots ---

describe('expandRecurringSlots', () => {
  it('returns empty array for empty input', () => {
    expect(expandRecurringSlots([])).toEqual([]);
  });

  it('returns non-recurring slots unchanged', () => {
    const slots = [
      {
        id: 'slot-1',
        job_seeker_id: 'p1',
        date: '2025-01-20',
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: false,
        recurrence_pattern: null as 'weekly' | null,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    const result = expandRecurringSlots(slots);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('slot-1');
  });

  it('expands recurring weekly slot to 4 future weeks', () => {
    const slots = [
      {
        id: 'slot-1',
        job_seeker_id: 'p1',
        date: '2025-01-20', // Monday
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
        recurrence_pattern: 'weekly' as const,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    const result = expandRecurringSlots(slots);
    // Original + 4 future weeks = 5
    expect(result).toHaveLength(5);
    expect(result[0].date).toBe('2025-01-20');
    expect(result[1].date).toBe('2025-01-27');
    expect(result[2].date).toBe('2025-02-03');
    expect(result[3].date).toBe('2025-02-10');
    expect(result[4].date).toBe('2025-02-17');
  });

  it('does not duplicate if future date already has a slot', () => {
    const slots = [
      {
        id: 'slot-1',
        job_seeker_id: 'p1',
        date: '2025-01-20',
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
        recurrence_pattern: 'weekly' as const,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'slot-2',
        job_seeker_id: 'p1',
        date: '2025-01-27', // Already exists for next week
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: false,
        recurrence_pattern: null as 'weekly' | null,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    const result = expandRecurringSlots(slots);
    // Original 2 + 3 generated (week 1 skipped because slot-2 exists) = 5
    expect(result).toHaveLength(5);
    // Ensure slot-2 is the one for 2025-01-27, not a generated one
    const jan27Slots = result.filter((s) => s.date === '2025-01-27');
    expect(jan27Slots).toHaveLength(1);
    expect(jan27Slots[0].id).toBe('slot-2');
  });

  it('returns results sorted by date', () => {
    const slots = [
      {
        id: 'slot-2',
        job_seeker_id: 'p1',
        date: '2025-02-01',
        start_time: '10:00',
        end_time: '12:00',
        is_recurring: false,
        recurrence_pattern: null as 'weekly' | null,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'slot-1',
        job_seeker_id: 'p1',
        date: '2025-01-20',
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
        recurrence_pattern: 'weekly' as const,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    const result = expandRecurringSlots(slots);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true);
    }
  });

  it('generated slots have _week suffix in id', () => {
    const slots = [
      {
        id: 'slot-1',
        job_seeker_id: 'p1',
        date: '2025-01-20',
        start_time: '09:00',
        end_time: '17:00',
        is_recurring: true,
        recurrence_pattern: 'weekly' as const,
        created_at: '2025-01-01T00:00:00Z',
      },
    ];
    const result = expandRecurringSlots(slots);
    const generated = result.filter((s) => s.id !== 'slot-1');
    expect(generated).toHaveLength(4);
    generated.forEach((s) => {
      expect(s.id).toMatch(/^slot-1_week\d+$/);
    });
  });
});
