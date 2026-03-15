import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getFavoriteWorkers,
  addFavoriteWorker,
  removeFavoriteWorker,
} from '@/lib/supabase/helpers';
import type { ApiError } from '@/lib/types';

/**
 * GET /api/favorites
 *
 * Returns the list of bookmarked job seekers for the authenticated employer.
 * Each entry includes the job seeker profile summary.
 */
export async function GET() {
  try {
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
        message: 'Chỉ nhà tuyển dụng mới có thể xem danh sách yêu thích.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    // Get favorite worker records
    const { data: favorites, error: favError } = await getFavoriteWorkers(
      supabase,
      session.userId,
    );

    if (favError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tải danh sách yêu thích.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    if (!favorites || favorites.length === 0) {
      return NextResponse.json({ favorites: [] });
    }

    // Fetch job seeker profiles for all favorited workers
    const jobSeekerIds = favorites.map((f) => f.job_seeker_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('job_seeker_profiles')
      .select('user_id, full_name, avatar_url, credit_score, skills, current_location')
      .in('user_id', jobSeekerIds);

    if (profilesError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tải thông tin ứng viên.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Fetch average ratings for each job seeker
    const { data: reviews } = await supabase
      .from('reviews')
      .select('reviewee_id, overall_rating')
      .in('reviewee_id', jobSeekerIds)
      .eq('review_type', 'employer_to_seeker');

    const ratingMap = new Map<string, { total: number; count: number }>();
    if (reviews) {
      for (const r of reviews) {
        const entry = ratingMap.get(r.reviewee_id) ?? { total: 0, count: 0 };
        entry.total += r.overall_rating;
        entry.count += 1;
        ratingMap.set(r.reviewee_id, entry);
      }
    }

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p]),
    );

    const result = favorites.map((fav) => {
      const profile = profileMap.get(fav.job_seeker_id);
      const rating = ratingMap.get(fav.job_seeker_id);
      const avgRating = rating ? Math.round((rating.total / rating.count) * 10) / 10 : 0;

      return {
        id: fav.id,
        jobSeekerId: fav.job_seeker_id,
        createdAt: fav.created_at,
        fullName: profile?.full_name ?? 'Không rõ',
        avatarUrl: profile?.avatar_url ?? null,
        creditScore: profile?.credit_score ?? 0,
        skills: profile?.skills ?? [],
        currentLocation: profile?.current_location ?? '',
        averageRating: avgRating,
      };
    });

    return NextResponse.json({ favorites: result });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}

/**
 * POST /api/favorites
 *
 * Bookmark a job seeker. Body: { jobSeekerId: string }
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

    if (session.userType !== 'employer') {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Chỉ nhà tuyển dụng mới có thể lưu ứng viên yêu thích.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    const body = await request.json();
    const { jobSeekerId } = body;

    if (!jobSeekerId || typeof jobSeekerId !== 'string') {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'jobSeekerId là bắt buộc.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorite_workers')
      .select('id')
      .eq('employer_id', session.userId)
      .eq('job_seeker_id', jobSeekerId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Đã lưu trước đó.' });
    }

    const { data: favorite, error: insertError } = await addFavoriteWorker(supabase, {
      employer_id: session.userId,
      job_seeker_id: jobSeekerId,
    });

    if (insertError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể lưu ứng viên yêu thích.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json(
      { success: true, favorite: { id: favorite?.id, jobSeekerId, createdAt: favorite?.created_at } },
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

/**
 * DELETE /api/favorites?jobSeekerId=<id>
 *
 * Remove a job seeker from favorites.
 */
export async function DELETE(request: NextRequest) {
  try {
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
        message: 'Chỉ nhà tuyển dụng mới có thể xóa ứng viên yêu thích.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const jobSeekerId = searchParams.get('jobSeekerId');

    if (!jobSeekerId) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'jobSeekerId là bắt buộc.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error: deleteError } = await removeFavoriteWorker(
      supabase,
      session.userId,
      jobSeekerId,
    );

    if (deleteError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể xóa ứng viên yêu thích.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
