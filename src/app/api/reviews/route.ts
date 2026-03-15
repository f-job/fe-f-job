import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  createReview,
  getReviewsByUser,
  createCreditScoreEntry,
  getJobSeekerProfile,
  updateJobSeekerProfile,
} from '@/lib/supabase/helpers';
import type { ApiError } from '@/lib/types';

function isValidRating(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

/**
 * GET /api/reviews?userId=<id>
 *
 * Returns reviews for a given user, along with average rating and count.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'userId là bắt buộc.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: reviews, error: reviewsError } = await getReviewsByUser(supabase, userId);

    if (reviewsError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tải đánh giá.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    const reviewList = reviews ?? [];
    const reviewCount = reviewList.length;
    const averageRating =
      reviewCount > 0
        ? reviewList.reduce((sum, r) => sum + r.overall_rating, 0) / reviewCount
        : 0;

    return NextResponse.json({
      reviews: reviewList.map((r) => ({
        id: r.id,
        applicationId: r.application_id,
        reviewerId: r.reviewer_id,
        revieweeId: r.reviewee_id,
        punctualityRating: r.punctuality_rating,
        attitudeRating: r.attitude_rating,
        skillsRating: r.skills_rating,
        overallRating: r.overall_rating,
        comment: r.comment,
        reviewType: r.review_type,
        createdAt: r.created_at,
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount,
    });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}

/**
 * POST /api/reviews
 *
 * Submit a review for a completed job application.
 *
 * Body: {
 *   applicationId: string,
 *   revieweeId: string,
 *   reviewType: 'employer_to_seeker' | 'seeker_to_employer',
 *   punctualityRating: 1-5,
 *   attitudeRating: 1-5,
 *   skillsRating: 1-5,
 *   overallRating: 1-5,
 *   comment?: string (max 500 chars)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để đánh giá.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();
    const {
      applicationId,
      revieweeId,
      reviewType,
      punctualityRating,
      attitudeRating,
      skillsRating,
      overallRating,
      comment,
    } = body;

    // Validate ratings (1-5 integers)
    if (
      !isValidRating(punctualityRating) ||
      !isValidRating(attitudeRating) ||
      !isValidRating(skillsRating) ||
      !isValidRating(overallRating)
    ) {
      const error: ApiError = {
        code: 'REVIEW_INVALID_RATING',
        message: 'Đánh giá phải từ 1-5 sao.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate comment length (max 500 chars)
    if (comment !== undefined && comment !== null && typeof comment === 'string' && comment.length > 500) {
      const error: ApiError = {
        code: 'REVIEW_COMMENT_TOO_LONG',
        message: 'Nhận xét không được quá 500 ký tự.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate review type
    if (reviewType !== 'employer_to_seeker' && reviewType !== 'seeker_to_employer') {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Loại đánh giá không hợp lệ.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate required fields
    if (!applicationId || !revieweeId) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Thiếu thông tin bắt buộc.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Create the review
    const { data: review, error: reviewError } = await createReview(supabase, {
      application_id: applicationId,
      reviewer_id: session.userId,
      reviewee_id: revieweeId,
      punctuality_rating: punctualityRating,
      attitude_rating: attitudeRating,
      skills_rating: skillsRating,
      overall_rating: overallRating,
      comment: comment || null,
      review_type: reviewType,
    });

    if (reviewError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể gửi đánh giá.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Trigger credit score update (+0.5) when employer gives 5-star overall rating
    if (reviewType === 'employer_to_seeker' && overallRating === 5) {
      const { data: seekerProfile } = await getJobSeekerProfile(supabase, revieweeId);
      if (seekerProfile) {
        const currentScore = seekerProfile.credit_score ?? 0;
        const newScore = currentScore + 0.5;

        await createCreditScoreEntry(supabase, {
          user_id: revieweeId,
          score_change: 0.5,
          reason: 'five_star_rating',
          application_id: applicationId,
        });

        await updateJobSeekerProfile(supabase, revieweeId, {
          credit_score: newScore,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review?.id,
          applicationId: review?.application_id,
          reviewerId: review?.reviewer_id,
          revieweeId: review?.reviewee_id,
          punctualityRating: review?.punctuality_rating,
          attitudeRating: review?.attitude_rating,
          skillsRating: review?.skills_rating,
          overallRating: review?.overall_rating,
          comment: review?.comment,
          reviewType: review?.review_type,
          createdAt: review?.created_at,
        },
      },
      { status: 201 },
    );
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
