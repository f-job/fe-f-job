/**
 * @jest-environment node
 */

/**
 * Unit tests for /api/reviews route handlers.
 */

import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

const mockCreateReview = jest.fn();
const mockGetReviewsByUser = jest.fn();
const mockGetJobSeekerProfile = jest.fn();
const mockUpdateJobSeekerProfile = jest.fn();
const mockCreateCreditScoreEntry = jest.fn();

jest.mock('@/lib/supabase/helpers', () => ({
  createReview: (...args: unknown[]) => mockCreateReview(...args),
  getReviewsByUser: (...args: unknown[]) => mockGetReviewsByUser(...args),
  getJobSeekerProfile: (...args: unknown[]) => mockGetJobSeekerProfile(...args),
  updateJobSeekerProfile: (...args: unknown[]) => mockUpdateJobSeekerProfile(...args),
  createCreditScoreEntry: (...args: unknown[]) => mockCreateCreditScoreEntry(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => ({}),
}));

import { GET, POST } from '@/app/api/reviews/route';

// --- Helpers ---

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/reviews', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeGetRequest(userId: string): NextRequest {
  return new NextRequest(`http://localhost/api/reviews?userId=${userId}`, {
    method: 'GET',
  });
}

const validReviewBody = {
  applicationId: 'app-1',
  revieweeId: 'user-2',
  reviewType: 'employer_to_seeker' as const,
  punctualityRating: 4,
  attitudeRating: 5,
  skillsRating: 3,
  overallRating: 4,
  comment: 'Làm việc tốt',
};

// --- Tests ---

describe('/api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 400 when userId is missing', async () => {
      const req = new NextRequest('http://localhost/api/reviews', { method: 'GET' });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('returns reviews with average rating and count', async () => {
      mockGetReviewsByUser.mockResolvedValue({
        data: [
          {
            id: 'r1',
            application_id: 'app-1',
            reviewer_id: 'emp-1',
            reviewee_id: 'user-1',
            punctuality_rating: 4,
            attitude_rating: 5,
            skills_rating: 3,
            overall_rating: 4,
            comment: 'Tốt',
            review_type: 'employer_to_seeker',
            created_at: '2024-01-15T10:00:00Z',
          },
          {
            id: 'r2',
            application_id: 'app-2',
            reviewer_id: 'emp-2',
            reviewee_id: 'user-1',
            punctuality_rating: 5,
            attitude_rating: 5,
            skills_rating: 5,
            overall_rating: 5,
            comment: null,
            review_type: 'employer_to_seeker',
            created_at: '2024-01-16T10:00:00Z',
          },
        ],
        error: null,
      });

      const res = await GET(makeGetRequest('user-1'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.reviewCount).toBe(2);
      expect(data.averageRating).toBe(4.5);
      expect(data.reviews).toHaveLength(2);
      expect(data.reviews[0].punctualityRating).toBe(4);
      expect(data.reviews[0].comment).toBe('Tốt');
    });

    it('returns empty reviews for user with no reviews', async () => {
      mockGetReviewsByUser.mockResolvedValue({ data: [], error: null });

      const res = await GET(makeGetRequest('user-new'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.reviewCount).toBe(0);
      expect(data.averageRating).toBe(0);
      expect(data.reviews).toHaveLength(0);
    });

    it('returns 500 when database fails', async () => {
      mockGetReviewsByUser.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const res = await GET(makeGetRequest('user-1'));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.code).toBe('SERVER_ERROR');
    });
  });

  describe('POST', () => {
    it('returns 401 when not authenticated', async () => {
      mockGetSession.mockResolvedValue(null);

      const res = await POST(makePostRequest(validReviewBody));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('returns 400 for invalid rating (out of range)', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });

      const res = await POST(makePostRequest({ ...validReviewBody, punctualityRating: 6 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('REVIEW_INVALID_RATING');
    });

    it('returns 400 for invalid rating (zero)', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });

      const res = await POST(makePostRequest({ ...validReviewBody, overallRating: 0 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('REVIEW_INVALID_RATING');
    });

    it('returns 400 for non-integer rating', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });

      const res = await POST(makePostRequest({ ...validReviewBody, skillsRating: 3.5 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('REVIEW_INVALID_RATING');
    });

    it('returns 400 for comment exceeding 500 characters', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });

      const longComment = 'a'.repeat(501);
      const res = await POST(makePostRequest({ ...validReviewBody, comment: longComment }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('REVIEW_COMMENT_TOO_LONG');
    });

    it('accepts comment of exactly 500 characters', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });
      mockCreateReview.mockResolvedValue({
        data: { id: 'r1', ...validReviewBody, created_at: '2024-01-15T10:00:00Z' },
        error: null,
      });

      const exactComment = 'a'.repeat(500);
      const res = await POST(makePostRequest({ ...validReviewBody, comment: exactComment }));

      expect(res.status).toBe(201);
    });

    it('returns 400 for invalid review type', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });

      const res = await POST(makePostRequest({ ...validReviewBody, reviewType: 'invalid' }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 when applicationId is missing', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });

      const { applicationId: _, ...bodyWithoutAppId } = validReviewBody;
      const res = await POST(makePostRequest(bodyWithoutAppId));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('creates review successfully for employer_to_seeker', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });
      mockCreateReview.mockResolvedValue({
        data: {
          id: 'r1',
          application_id: 'app-1',
          reviewer_id: 'emp-1',
          reviewee_id: 'user-2',
          punctuality_rating: 4,
          attitude_rating: 5,
          skills_rating: 3,
          overall_rating: 4,
          comment: 'Làm việc tốt',
          review_type: 'employer_to_seeker',
          created_at: '2024-01-15T10:00:00Z',
        },
        error: null,
      });

      const res = await POST(makePostRequest(validReviewBody));
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.review.overallRating).toBe(4);
      expect(data.review.reviewType).toBe('employer_to_seeker');
    });

    it('creates review successfully for seeker_to_employer', async () => {
      mockGetSession.mockResolvedValue({ userId: 'seeker-1', userType: 'job_seeker' });
      mockCreateReview.mockResolvedValue({
        data: {
          id: 'r2',
          application_id: 'app-1',
          reviewer_id: 'seeker-1',
          reviewee_id: 'emp-1',
          punctuality_rating: 5,
          attitude_rating: 5,
          skills_rating: 5,
          overall_rating: 5,
          comment: null,
          review_type: 'seeker_to_employer',
          created_at: '2024-01-15T10:00:00Z',
        },
        error: null,
      });

      const res = await POST(
        makePostRequest({
          ...validReviewBody,
          revieweeId: 'emp-1',
          reviewType: 'seeker_to_employer',
          overallRating: 5,
        }),
      );
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.review.reviewType).toBe('seeker_to_employer');
    });

    it('triggers credit score +0.5 when employer gives 5-star overall rating', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });
      mockCreateReview.mockResolvedValue({
        data: {
          id: 'r1',
          application_id: 'app-1',
          reviewer_id: 'emp-1',
          reviewee_id: 'user-2',
          punctuality_rating: 5,
          attitude_rating: 5,
          skills_rating: 5,
          overall_rating: 5,
          comment: null,
          review_type: 'employer_to_seeker',
          created_at: '2024-01-15T10:00:00Z',
        },
        error: null,
      });
      mockGetJobSeekerProfile.mockResolvedValue({
        data: { credit_score: 10 },
        error: null,
      });
      mockCreateCreditScoreEntry.mockResolvedValue({ error: null });
      mockUpdateJobSeekerProfile.mockResolvedValue({ error: null });

      const res = await POST(
        makePostRequest({
          ...validReviewBody,
          punctualityRating: 5,
          attitudeRating: 5,
          skillsRating: 5,
          overallRating: 5,
        }),
      );

      expect(res.status).toBe(201);

      // Verify credit score entry was created
      expect(mockCreateCreditScoreEntry).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          user_id: 'user-2',
          score_change: 0.5,
          reason: 'five_star_rating',
          application_id: 'app-1',
        }),
      );

      // Verify profile was updated
      expect(mockUpdateJobSeekerProfile).toHaveBeenCalledWith(
        expect.anything(),
        'user-2',
        { credit_score: 10.5 },
      );
    });

    it('does NOT trigger credit score update for non-5-star rating', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });
      mockCreateReview.mockResolvedValue({
        data: {
          id: 'r1',
          application_id: 'app-1',
          reviewer_id: 'emp-1',
          reviewee_id: 'user-2',
          punctuality_rating: 4,
          attitude_rating: 5,
          skills_rating: 3,
          overall_rating: 4,
          comment: null,
          review_type: 'employer_to_seeker',
          created_at: '2024-01-15T10:00:00Z',
        },
        error: null,
      });

      await POST(makePostRequest(validReviewBody));

      expect(mockCreateCreditScoreEntry).not.toHaveBeenCalled();
      expect(mockUpdateJobSeekerProfile).not.toHaveBeenCalled();
    });

    it('does NOT trigger credit score update for seeker_to_employer 5-star', async () => {
      mockGetSession.mockResolvedValue({ userId: 'seeker-1', userType: 'job_seeker' });
      mockCreateReview.mockResolvedValue({
        data: {
          id: 'r2',
          application_id: 'app-1',
          reviewer_id: 'seeker-1',
          reviewee_id: 'emp-1',
          punctuality_rating: 5,
          attitude_rating: 5,
          skills_rating: 5,
          overall_rating: 5,
          comment: null,
          review_type: 'seeker_to_employer',
          created_at: '2024-01-15T10:00:00Z',
        },
        error: null,
      });

      await POST(
        makePostRequest({
          ...validReviewBody,
          revieweeId: 'emp-1',
          reviewType: 'seeker_to_employer',
          overallRating: 5,
          punctualityRating: 5,
          attitudeRating: 5,
          skillsRating: 5,
        }),
      );

      expect(mockCreateCreditScoreEntry).not.toHaveBeenCalled();
      expect(mockUpdateJobSeekerProfile).not.toHaveBeenCalled();
    });

    it('returns 500 when review creation fails', async () => {
      mockGetSession.mockResolvedValue({ userId: 'emp-1', userType: 'employer' });
      mockCreateReview.mockResolvedValue({ data: null, error: { message: 'DB error' } });

      const res = await POST(makePostRequest(validReviewBody));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.code).toBe('SERVER_ERROR');
    });
  });
});
