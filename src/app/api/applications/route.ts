import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getJobSeekerProfile } from '@/lib/supabase/helpers';
import type { ApiError } from '@/lib/types';

/**
 * GET /api/applications
 *
 * Fetch all applications for the authenticated Job Seeker,
 * including job details and employer name.
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

    if (session.userType !== 'job_seeker') {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Chỉ người tìm việc mới có thể xem đơn ứng tuyển.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    const client = createServerSupabaseClient();

    // Get the job seeker profile to find their profile id
    const { data: profile, error: profileError } = await getJobSeekerProfile(
      client,
      session.userId,
    );

    if (profileError || !profile) {
      return NextResponse.json({ applications: [] });
    }

    // Fetch applications with job details
    const { data: applications, error: appError } = await client
      .from('applications')
      .select(`
        id,
        status,
        applied_at,
        jobs!inner(
          id,
          title,
          location,
          work_date,
          start_time,
          end_time,
          hourly_wage,
          slug,
          employer_id
        )
      `)
      .eq('job_seeker_id', profile.id)
      .order('applied_at', { ascending: false });

    if (appError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tải danh sách đơn ứng tuyển.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Enrich with employer names
    const enriched = await Promise.all(
      (applications ?? []).map(async (app) => {
        const job = app.jobs as unknown as {
          id: string;
          title: string;
          location: string;
          work_date: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          slug: string;
          employer_id: string;
        };

        const { data: employer } = await client
          .from('employer_profiles')
          .select('business_name')
          .eq('user_id', job.employer_id)
          .single();

        return {
          id: app.id,
          status: app.status,
          applied_at: app.applied_at,
          job: {
            id: job.id,
            title: job.title,
            location: job.location,
            work_date: job.work_date,
            start_time: job.start_time,
            end_time: job.end_time,
            hourly_wage: job.hourly_wage,
            slug: job.slug,
            employer_name: employer?.business_name ?? 'Nhà tuyển dụng',
          },
        };
      }),
    );

    return NextResponse.json({ applications: enriched });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
