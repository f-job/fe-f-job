import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chưa đăng nhập' },
      { status: 401 },
    );
  }

  if (session.userType !== 'employer') {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chỉ nhà tuyển dụng mới có thể xem dashboard' },
      { status: 403 },
    );
  }

  const client = createServerSupabaseClient();

  // Active listings count
  const { count: activeListings } = await client
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('employer_id', session.userId)
    .eq('status', 'open');

  // Completed jobs count
  const { count: completedJobs } = await client
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('employer_id', session.userId)
    .eq('status', 'completed');

  // Total applicants across all employer's jobs
  const { data: employerJobs } = await client
    .from('jobs')
    .select('id')
    .eq('employer_id', session.userId);

  let totalApplicants = 0;
  if (employerJobs && employerJobs.length > 0) {
    const jobIds = employerJobs.map((j) => j.id);
    const { count: applicantCount } = await client
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('job_id', jobIds);
    totalApplicants = applicantCount ?? 0;
  }

  // Average worker rating from reviews the employer has given
  const { data: reviews } = await client
    .from('reviews')
    .select('overall_rating')
    .eq('reviewer_id', session.userId)
    .eq('review_type', 'employer_to_seeker');

  let averageWorkerRating = 0;
  if (reviews && reviews.length > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.overall_rating, 0);
    averageWorkerRating = Math.round((sum / reviews.length) * 10) / 10;
  }

  return NextResponse.json({
    activeListings: activeListings ?? 0,
    totalApplicants,
    completedJobs: completedJobs ?? 0,
    averageWorkerRating,
  });
}
