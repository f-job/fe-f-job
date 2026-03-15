/**
 * @jest-environment node
 */

/**
 * Unit tests for /api/credit-score route handlers.
 *
 * We mock session and Supabase helpers to test the route logic in isolation.
 */

import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

const mockGetJobSeekerProfile = jest.fn();
const mockUpdateJobSeekerProfile = jest.fn();
const mockGetCreditScoreHistory = jest.fn();
const mockCreateCreditScoreEntry = jest.fn();

jest.mock('@/lib/supabase/helpers', () => ({
  getJobSeekerProfile: (...args: unknown[]) => mockGetJobSeekerProfile(...args),
  updateJobSeekerProfile: (...args: unknown[]) => mockUpdateJobSeekerProfile(...args),
  getCreditScoreHistory: (...args: unknown[]) => mockGetCreditScoreHistory(...args),
  createCreditScoreEntry: (...args: unknown[]) => mockCreateCreditScoreEntry(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({}),
}));

import { GET, POST } from '@/app/api/credit-score/route';

// --- Helpers ---

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/credit-score', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

// --- Tests ---

describe('/api/credit-score', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('returns score and history for authenticated user', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 5 },
        error: null,
      });
      mockGetCreditScoreHistory.mockResolvedValue({
        data: [
          {
            id: 'h1',
            user_id: 'user-1',
            score_change: 1,
            reason: 'job_complete',
            application_id: 'app-1',
            created_at: '2024-01-15T10:00:00Z',
          },
        ],
        error: null,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.score).toBe(5);
      expect(data.history).toHaveLength(1);
      expect(data.history[0].scoreChange).toBe(1);
      expect(data.history[0].reason).toBe('job_complete');
      expect(data.history[0].reasonLabel).toBe('Hoàn thành công việc');
    });

    it('returns score 0 and empty history for new user', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-2', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 0 },
        error: null,
      });
      mockGetCreditScoreHistory.mockResolvedValue({
        data: [],
        error: null,
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.score).toBe(0);
      expect(data.history).toHaveLength(0);
    });

    it('returns 500 when history fetch fails', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 0 },
        error: null,
      });
      mockGetCreditScoreHistory.mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
      });

      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.code).toBe('SERVER_ERROR');
    });
  });

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await POST(makeRequest({ reason: 'job_complete' }));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('returns 400 when reason is missing', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });

      const res = await POST(makeRequest({}));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for invalid reason', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });

      const res = await POST(makeRequest({ reason: 'invalid_reason' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('records +1 for job_complete and updates profile', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 3 },
        error: null,
      });
      mockCreateCreditScoreEntry.mockResolvedValue({ error: null });
      mockUpdateJobSeekerProfile.mockResolvedValue({ error: null });

      const res = await POST(makeRequest({ reason: 'job_complete', application_id: 'app-1' }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.previousScore).toBe(3);
      expect(data.scoreChange).toBe(1);
      expect(data.newScore).toBe(4);

      // Verify history entry was created
      expect(mockCreateCreditScoreEntry).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          user_id: 'user-1',
          score_change: 1,
          reason: 'job_complete',
          application_id: 'app-1',
        }),
      );

      // Verify profile was updated
      expect(mockUpdateJobSeekerProfile).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        { credit_score: 4 },
      );
    });

    it('records +0.5 for five_star_rating', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 10 },
        error: null,
      });
      mockCreateCreditScoreEntry.mockResolvedValue({ error: null });
      mockUpdateJobSeekerProfile.mockResolvedValue({ error: null });

      const res = await POST(makeRequest({ reason: 'five_star_rating' }));
      const data = await res.json();

      expect(data.scoreChange).toBe(0.5);
      expect(data.newScore).toBe(10.5);
    });

    it('records -2 for no_show', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 5 },
        error: null,
      });
      mockCreateCreditScoreEntry.mockResolvedValue({ error: null });
      mockUpdateJobSeekerProfile.mockResolvedValue({ error: null });

      const res = await POST(makeRequest({ reason: 'no_show' }));
      const data = await res.json();

      expect(data.scoreChange).toBe(-2);
      expect(data.newScore).toBe(3);
    });

    it('records -0.5 for late_cancel', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 2 },
        error: null,
      });
      mockCreateCreditScoreEntry.mockResolvedValue({ error: null });
      mockUpdateJobSeekerProfile.mockResolvedValue({ error: null });

      const res = await POST(makeRequest({ reason: 'late_cancel' }));
      const data = await res.json();

      expect(data.scoreChange).toBe(-0.5);
      expect(data.newScore).toBe(1.5);
    });

    it('returns 404 when profile not found', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const res = await POST(makeRequest({ reason: 'job_complete' }));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.code).toBe('JOB_NOT_FOUND');
    });

    it('returns 500 when history entry creation fails', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 0 },
        error: null,
      });
      mockCreateCreditScoreEntry.mockResolvedValue({
        error: { message: 'DB error' },
      });

      const res = await POST(makeRequest({ reason: 'job_complete' }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.code).toBe('SERVER_ERROR');
    });

    it('sets application_id to null when not provided', async () => {
      mockGetSession.mockResolvedValue({ userId: 'user-1', userType: 'job_seeker' });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 0 },
        error: null,
      });
      mockCreateCreditScoreEntry.mockResolvedValue({ error: null });
      mockUpdateJobSeekerProfile.mockResolvedValue({ error: null });

      await POST(makeRequest({ reason: 'job_complete' }));

      expect(mockCreateCreditScoreEntry).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          application_id: null,
        }),
      );
    });
  });
});
