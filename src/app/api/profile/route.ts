import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getJobSeekerProfile,
  updateJobSeekerProfile,
} from '@/lib/supabase/helpers';
import { getTrustLevel } from '@/lib/creditScore';
import type { ApiError, WorkerProfile } from '@/lib/types';

/**
 * GET /api/profile
 *
 * Returns the current authenticated job seeker's profile,
 * including computed fields: trustLevel, totalCompletedJobs, averageRating.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để xem hồ sơ.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    const { data: profile, error: profileError } = await getJobSeekerProfile(
      supabase,
      session.userId,
    );

    if (profileError || !profile) {
      const error: ApiError = {
        code: 'JOB_NOT_FOUND',
        message: 'Không tìm thấy hồ sơ. Vui lòng tạo hồ sơ mới.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Count completed jobs
    const { count: completedJobs } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('job_seeker_id', profile.id)
      .eq('status', 'completed');

    // Calculate average rating from reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('overall_rating')
      .eq('reviewee_id', session.userId)
      .eq('review_type', 'employer_to_seeker');

    let averageRating = 0;
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce(
        (acc: number, r: { overall_rating: number }) => acc + r.overall_rating,
        0,
      );
      averageRating = Math.round((sum / reviews.length) * 10) / 10;
    }

    const workerProfile: WorkerProfile = {
      fullName: profile.full_name,
      dateOfBirth: profile.date_of_birth ?? '',
      gender: profile.gender ?? 'other',
      avatarUrl: profile.avatar_url,
      address: profile.address ?? '',
      currentLocation: profile.current_location ?? '',
      schoolName: profile.school_name,
      major: profile.major,
      skills: profile.skills ?? [],
      creditScore: profile.credit_score ?? 0,
      trustLevel: getTrustLevel(profile.credit_score ?? 0),
      totalCompletedJobs: completedJobs ?? 0,
      averageRating,
    };

    return NextResponse.json({ profile: workerProfile });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}


/**
 * PUT /api/profile
 *
 * Updates the current authenticated job seeker's profile fields.
 * Accepts partial updates — only provided fields are changed.
 *
 * Body: Partial<{ fullName, dateOfBirth, gender, avatarUrl, address,
 *        currentLocation, schoolName, major, skills }>
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để cập nhật hồ sơ.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();

    // Map camelCase body fields to snake_case DB columns
    const updateData: Record<string, unknown> = {};
    if (body.fullName !== undefined) updateData.full_name = body.fullName;
    if (body.dateOfBirth !== undefined) updateData.date_of_birth = body.dateOfBirth;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.avatarUrl !== undefined) updateData.avatar_url = body.avatarUrl;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.currentLocation !== undefined) updateData.current_location = body.currentLocation;
    if (body.schoolName !== undefined) updateData.school_name = body.schoolName;
    if (body.major !== undefined) updateData.major = body.major;
    if (body.skills !== undefined) updateData.skills = body.skills;

    if (Object.keys(updateData).length === 0) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Không có thông tin nào để cập nhật.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: updated, error: updateError } = await updateJobSeekerProfile(
      supabase,
      session.userId,
      updateData,
    );

    if (updateError || !updated) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể cập nhật hồ sơ. Vui lòng thử lại.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công.',
    });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
