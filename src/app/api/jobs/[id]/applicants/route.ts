import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getJobById } from '@/lib/supabase/helpers';
import { getTrustLevel } from '@/lib/creditScore';
import type { ApiError } from '@/lib/types';

/**
 * GET /api/jobs/[id]/applicants
 *
 * Fetch all applicants for a job — employer only.
 * Returns applicant profile summaries with credit score and trust level.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: jobId } = await params;
    const session = await getSession();

    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    if (session.userType !== 'employer') {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Chỉ nhà tuyển dụng mới có thể xem ứng viên.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    const client = createServerSupabaseClient();

    // Verify job exists and belongs to this employer
    const { data: job, error: jobError } = await getJobById(client, jobId);
    if (jobError || !job) {
      const error: ApiError = {
        code: 'JOB_NOT_FOUND',
        message: 'Không tìm thấy việc làm.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    if (job.employer_id !== session.userId) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Bạn không có quyền xem ứng viên cho việc này.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    // Fetch applications with job seeker profile data
    const { data: applications, error: appError } = await client
      .from('applications')
      .select(`
        id,
        status,
        applied_at,
        job_seeker_id,
        job_seeker_profiles!inner(
          id,
          user_id,
          full_name,
          avatar_url,
          credit_score
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (appError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tải danh sách ứng viên.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Calculate average ratings for each applicant
    const applicants = await Promise.all(
      (applications ?? []).map(async (app) => {
        const profile = app.job_seeker_profiles as unknown as {
          id: string;
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          credit_score: number;
        };

        // Get average rating for this job seeker
        const { data: reviews } = await client
          .from('reviews')
          .select('overall_rating')
          .eq('reviewee_id', profile.user_id)
          .eq('review_type', 'employer_to_seeker');

        const ratings = (reviews ?? []).map((r) => r.overall_rating);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;

        return {
          applicationId: app.id,
          jobSeekerId: profile.id,
          userId: profile.user_id,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          creditScore: profile.credit_score,
          trustLevel: getTrustLevel(profile.credit_score),
          averageRating: Math.round(averageRating * 10) / 10,
          applicationStatus: app.status,
        };
      }),
    );

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        location: job.location,
        work_date: job.work_date,
      },
      applicants,
    });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
