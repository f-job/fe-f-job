import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getJobSeekerProfile, getAvailabilities } from '@/lib/supabase/helpers';
import { getTrustLevel } from '@/lib/creditScore';
import { buildRecommendations } from '@/lib/matching';
import type { ApiError, WorkerProfile, JobListing, AvailabilitySlot } from '@/lib/types';
import { JobStatus } from '@/lib/types';

/**
 * GET /api/ai/recommendations
 *
 * Returns personalised job recommendations for the authenticated Job Seeker.
 * Each recommendation includes a match percentage (0-100) composed of four
 * scoring components (location, schedule, skill, employer trust — each 0-25).
 * Only jobs with match >= 50% are returned, sorted descending by match.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để xem gợi ý việc làm.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    if (session.userType !== 'job_seeker') {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Chỉ người tìm việc mới có thể xem gợi ý.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    const supabase = createServerSupabaseClient();

    // 1. Fetch job seeker profile
    const { data: profile, error: profileError } = await getJobSeekerProfile(
      supabase,
      session.userId,
    );

    if (profileError || !profile) {
      const error: ApiError = {
        code: 'PROFILE_INCOMPLETE',
        message: 'Vui lòng hoàn thiện hồ sơ để nhận gợi ý việc làm.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    // 2. Fetch availability slots
    const { data: availabilityRows } = await getAvailabilities(supabase, profile.id);
    const availability: AvailabilitySlot[] = (availabilityRows ?? []).map((row) => ({
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      isRecurring: row.is_recurring,
      recurrencePattern: row.recurrence_pattern,
    }));

    // 3. Fetch open jobs with employer verification status
    const { data: jobRows } = await supabase
      .from('jobs')
      .select('*, employer_profiles!inner(verification_status)')
      .eq('status', 'open')
      .returns<
        Array<{
          id: string;
          title: string;
          description: string;
          job_category: string;
          number_of_positions: number;
          work_date: string;
          start_time: string;
          end_time: string;
          hourly_wage: number;
          location: string;
          requirements: string | null;
          slug: string;
          status: string;
          employer_profiles: { verification_status: string };
        }>
      >();

    // 4. Map DB rows to JobListing interface
    const jobs: (JobListing & { id: string })[] = (jobRows ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      jobCategory: row.job_category,
      numberOfPositions: row.number_of_positions,
      workDate: row.work_date,
      startTime: row.start_time,
      endTime: row.end_time,
      hourlyWage: row.hourly_wage,
      location: row.location,
      requirements: row.requirements ?? '',
      slug: row.slug,
      status: row.status as JobStatus,
      employerVerificationStatus: row.employer_profiles.verification_status as JobListing['employerVerificationStatus'],
    }));

    // 5. Build worker profile for matching
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
      totalCompletedJobs: 0,
      averageRating: 0,
    };

    // 6. Calculate recommendations (filtered >= 50%, sorted desc)
    const recommendations = buildRecommendations(workerProfile, jobs, availability);

    return NextResponse.json({ recommendations });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
