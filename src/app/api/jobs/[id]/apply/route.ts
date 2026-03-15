import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getJobById,
  getJobSeekerProfile,
  createApplication,
} from '@/lib/supabase/helpers';
import type { ApiError } from '@/lib/types';

/**
 * POST /api/jobs/[id]/apply
 *
 * Submit a job application for the authenticated Job Seeker.
 * - Requires authentication (job_seeker only)
 * - Blocks incomplete profiles (PROFILE_INCOMPLETE — 403)
 * - Prevents duplicate applications (APPLICATION_DUPLICATE — 409)
 * - Creates application with status 'pending'
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: jobId } = await params;

    // 1. Auth check
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để ứng tuyển.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    if (session.userType !== 'job_seeker') {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Chỉ người tìm việc mới có thể ứng tuyển.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    const client = createServerSupabaseClient();

    // 2. Verify job exists and is open
    const { data: job, error: jobError } = await getJobById(client, jobId);
    if (jobError || !job) {
      const error: ApiError = {
        code: 'JOB_NOT_FOUND',
        message: 'Không tìm thấy việc làm.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    // 3. Check profile completeness
    const { data: profile, error: profileError } = await getJobSeekerProfile(
      client,
      session.userId,
    );

    if (profileError || !profile) {
      const error: ApiError = {
        code: 'PROFILE_INCOMPLETE',
        message: 'Vui lòng hoàn thiện hồ sơ trước khi ứng tuyển.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    // Profile is considered incomplete if missing key fields
    const isProfileIncomplete =
      !profile.full_name ||
      !profile.date_of_birth ||
      !profile.address ||
      !profile.current_location;

    if (isProfileIncomplete) {
      const error: ApiError = {
        code: 'PROFILE_INCOMPLETE',
        message: 'Vui lòng hoàn thiện hồ sơ trước khi ứng tuyển.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    // 4. Check for duplicate application
    const { data: existingApps } = await client
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('job_seeker_id', profile.id)
      .limit(1);

    if (existingApps && existingApps.length > 0) {
      const error: ApiError = {
        code: 'APPLICATION_DUPLICATE',
        message: 'Bạn đã ứng tuyển việc này rồi.',
      };
      return NextResponse.json(error, { status: 409 });
    }

    // 5. Create application with status 'pending'
    const { data: application, error: createError } = await createApplication(
      client,
      { job_id: jobId, job_seeker_id: profile.id },
    );

    if (createError || !application) {
      // Handle unique constraint violation (race condition fallback)
      if (
        createError?.code === '23505' ||
        createError?.message?.includes('duplicate')
      ) {
        const error: ApiError = {
          code: 'APPLICATION_DUPLICATE',
          message: 'Bạn đã ứng tuyển việc này rồi.',
        };
        return NextResponse.json(error, { status: 409 });
      }

      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể gửi đơn ứng tuyển. Vui lòng thử lại.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Ứng tuyển thành công!',
        application,
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
