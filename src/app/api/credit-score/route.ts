import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getCreditScoreHistory,
  createCreditScoreEntry,
  getJobSeekerProfile,
  updateJobSeekerProfile,
} from '@/lib/supabase/helpers';
import { getScoreChange, CREDIT_SCORE_REASON_LABELS } from '@/lib/creditScore';
import type { ApiError } from '@/lib/types';

/**
 * GET /api/credit-score
 *
 * Returns the credit score and full history for the authenticated user.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để xem điểm uy tín.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    const { data: profile } = await getJobSeekerProfile(supabase, session.userId);
    const currentScore = profile?.credit_score ?? 0;

    const { data: history, error: historyError } = await getCreditScoreHistory(
      supabase,
      session.userId,
    );

    if (historyError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tải lịch sử điểm uy tín.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({
      score: currentScore,
      history: (history ?? []).map((entry) => ({
        id: entry.id,
        scoreChange: entry.score_change,
        reason: entry.reason,
        reasonLabel:
          CREDIT_SCORE_REASON_LABELS[
            entry.reason as keyof typeof CREDIT_SCORE_REASON_LABELS
          ] ?? entry.reason,
        applicationId: entry.application_id,
        createdAt: entry.created_at,
      })),
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
 * POST /api/credit-score
 *
 * Records a credit score change for the authenticated user.
 *
 * Body: { reason: CreditScoreReason, application_id?: string }
 *
 * The score_change is determined by the reason:
 *   job_complete    → +1
 *   five_star_rating → +0.5
 *   no_show         → -2
 *   late_cancel     → -0.5
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();
    const { reason, application_id } = body;

    if (!reason || typeof reason !== 'string') {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Lý do thay đổi điểm là bắt buộc.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const scoreChange = getScoreChange(reason);
    if (scoreChange === null) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Lý do thay đổi điểm không hợp lệ.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get current profile to read current score
    const { data: profile, error: profileError } = await getJobSeekerProfile(
      supabase,
      session.userId,
    );

    if (profileError || !profile) {
      const error: ApiError = {
        code: 'JOB_NOT_FOUND',
        message: 'Không tìm thấy hồ sơ người dùng.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    const currentScore = profile.credit_score ?? 0;
    const newScore = currentScore + scoreChange;

    // Record the change in credit_score_history
    const { error: historyError } = await createCreditScoreEntry(supabase, {
      user_id: session.userId,
      score_change: scoreChange,
      reason,
      application_id: application_id ?? null,
    });

    if (historyError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể ghi nhận thay đổi điểm uy tín.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Update the credit_score on the profile
    const { error: updateError } = await updateJobSeekerProfile(
      supabase,
      session.userId,
      { credit_score: newScore },
    );

    if (updateError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể cập nhật điểm uy tín.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      previousScore: currentScore,
      scoreChange,
      newScore,
      reason,
    });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
