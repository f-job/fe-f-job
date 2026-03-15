import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import { getEmployerProfile, createJob } from '@/lib/supabase/helpers';
import { generateVietnameseSlug } from '@/lib/slug';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '12', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  // Filter params
  const location = searchParams.get('location') || undefined;
  const jobCategory = searchParams.get('jobCategory') || undefined;
  const salaryMin = searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!, 10) : undefined;
  const salaryMax = searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!, 10) : undefined;
  const workDate = searchParams.get('workDate') || undefined;
  const keyword = searchParams.get('keyword')?.trim() || undefined;
  const countOnly = searchParams.get('countOnly') === 'true';
  const employerFilter = searchParams.get('employer') || undefined;
  const idsParam = searchParams.get('ids') || undefined;

  const client = createServerSupabaseClient();

  // If employer=me, resolve the current user's ID
  let employerId: string | undefined;
  if (employerFilter === 'me') {
    const session = await getSession();
    if (!session || session.userType !== 'employer') {
      return NextResponse.json(
        { code: 'AUTH_UNAUTHORIZED', message: 'Chưa đăng nhập hoặc không phải nhà tuyển dụng' },
        { status: 401 },
      );
    }
    employerId = session.userId;
  }

  // Build query with filters
  let query = client.from('jobs').select('*', countOnly ? { count: 'exact', head: true } : undefined);

  if (idsParam) {
    const ids = idsParam.split(',').filter(Boolean);
    if (ids.length > 0) query = query.in('id', ids);
  }

  if (employerId) query = query.eq('employer_id', employerId);

  if (status) query = query.eq('status', status);
  if (location) query = query.eq('location', location);
  if (jobCategory) query = query.eq('job_category', jobCategory);
  if (salaryMin !== undefined) query = query.gte('hourly_wage', salaryMin);
  if (salaryMax !== undefined) query = query.lte('hourly_wage', salaryMax);
  if (workDate) query = query.eq('work_date', workDate);

  // Keyword search: use ilike across title, description, and employer name
  // For title and description we can filter directly. For employer name we need a join approach.
  // We'll use an OR filter on title and description with ilike.
  if (keyword) {
    const pattern = `%${keyword}%`;
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  query = query.order('created_at', { ascending: false });

  if (!countOnly) {
    if (offset) query = query.range(offset, offset + limit - 1);
    else query = query.limit(limit);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: 'Lỗi hệ thống' },
      { status: 500 },
    );
  }

  // If count only, return just the count
  if (countOnly) {
    return NextResponse.json({ count: count ?? 0 });
  }

  // Join employer info for each job
  const jobIds = (data ?? []).map((j: Record<string, unknown>) => j.employer_id as string);
  const uniqueEmployerIds = [...new Set(jobIds)];

  let employerMap: Record<string, { business_name: string; verification_status: string }> = {};

  if (uniqueEmployerIds.length > 0) {
    const { data: employers } = await client
      .from('employer_profiles')
      .select('user_id, business_name, verification_status')
      .in('user_id', uniqueEmployerIds);

    if (employers) {
      employerMap = Object.fromEntries(
        employers.map((e) => [
          e.user_id,
          { business_name: e.business_name, verification_status: e.verification_status },
        ]),
      );
    }
  }

  // If keyword search, also filter by employer name on the client side
  // (since we can't do cross-table ilike in a single Supabase query easily)
  let jobs = (data ?? []).map((job: Record<string, unknown>) => {
    const employer = employerMap[job.employer_id as string];
    return {
      ...job,
      employer_name: employer?.business_name ?? 'Nhà tuyển dụng',
      employer_verified: employer?.verification_status === 'verified',
    };
  });

  // If keyword was provided, also include jobs that match by employer name
  // We already filtered by title/description in the DB query, but employer name
  // matches need to be handled separately
  if (keyword) {
    const lowerKeyword = keyword.toLowerCase();
    // Re-query without the keyword filter to find employer name matches
    let employerQuery = client.from('jobs').select('*');
    if (status) employerQuery = employerQuery.eq('status', status);
    if (location) employerQuery = employerQuery.eq('location', location);
    if (jobCategory) employerQuery = employerQuery.eq('job_category', jobCategory);
    if (salaryMin !== undefined) employerQuery = employerQuery.gte('hourly_wage', salaryMin);
    if (salaryMax !== undefined) employerQuery = employerQuery.lte('hourly_wage', salaryMax);
    if (workDate) employerQuery = employerQuery.eq('work_date', workDate);
    employerQuery = employerQuery.order('created_at', { ascending: false });

    const { data: allFilteredJobs } = await employerQuery;

    if (allFilteredJobs) {
      const existingIds = new Set(jobs.map((j: Record<string, unknown>) => j.id));
      const employerNameMatches = allFilteredJobs
        .filter((job) => {
          if (existingIds.has(job.id)) return false;
          const employer = employerMap[job.employer_id as string];
          const name = employer?.business_name ?? '';
          return name.toLowerCase().includes(lowerKeyword);
        })
        .map((job) => {
          const employer = employerMap[job.employer_id as string];
          return {
            ...job,
            employer_name: employer?.business_name ?? 'Nhà tuyển dụng',
            employer_verified: employer?.verification_status === 'verified',
          };
        });

      jobs = [...jobs, ...employerNameMatches];
    }

    // Apply pagination after merging
    jobs = jobs.slice(0, limit);
  }

  // Get total count for the current filter set
  let totalQuery = client.from('jobs').select('id', { count: 'exact', head: true });
  if (employerId) totalQuery = totalQuery.eq('employer_id', employerId);
  if (status) totalQuery = totalQuery.eq('status', status);
  if (location) totalQuery = totalQuery.eq('location', location);
  if (jobCategory) totalQuery = totalQuery.eq('job_category', jobCategory);
  if (salaryMin !== undefined) totalQuery = totalQuery.gte('hourly_wage', salaryMin);
  if (salaryMax !== undefined) totalQuery = totalQuery.lte('hourly_wage', salaryMax);
  if (workDate) totalQuery = totalQuery.eq('work_date', workDate);
  if (keyword) {
    const pattern = `%${keyword}%`;
    totalQuery = totalQuery.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { count: totalCount } = await totalQuery;

  return NextResponse.json({ jobs, totalCount: totalCount ?? jobs.length });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chưa đăng nhập' },
      { status: 401 },
    );
  }

  if (session.userType !== 'employer') {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chỉ nhà tuyển dụng mới có thể đăng tin' },
      { status: 403 },
    );
  }

  // Check employer verification status
  const client = createServerSupabaseClient();
  const { data: employer, error: employerError } = await getEmployerProfile(client, session.userId);

  if (employerError || !employer) {
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: 'Không thể tải thông tin nhà tuyển dụng' },
      { status: 500 },
    );
  }

  if (employer.verification_status !== 'verified') {
    return NextResponse.json(
      { code: 'VERIFICATION_REQUIRED', message: 'Cần xác minh trước khi đăng tin tuyển dụng' },
      { status: 403 },
    );
  }

  // Parse and validate request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }

  const requiredFields = [
    'title',
    'description',
    'jobCategory',
    'numberOfPositions',
    'workDate',
    'startTime',
    'endTime',
    'hourlyWage',
    'location',
    'requirements',
  ] as const;

  const missingFields = requiredFields.filter((field) => {
    const value = body[field];
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    return false;
  });

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        code: 'JOB_MISSING_FIELDS',
        message: 'Thiếu thông tin bắt buộc khi đăng tin',
        details: { missingFields },
      },
      { status: 400 },
    );
  }

  // Generate Vietnamese slug from title
  const slug = generateVietnameseSlug(body.title as string);

  // Ensure slug uniqueness by appending a short suffix if needed
  const { data: existingJob } = await client
    .from('jobs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  const finalSlug = existingJob
    ? `${slug}-${Date.now().toString(36)}`
    : slug;

  // Create the job
  const { data: job, error: createError } = await createJob(client, {
    employer_id: session.userId,
    title: (body.title as string).trim(),
    description: (body.description as string).trim(),
    job_category: (body.jobCategory as string).trim(),
    number_of_positions: Number(body.numberOfPositions),
    work_date: body.workDate as string,
    start_time: body.startTime as string,
    end_time: body.endTime as string,
    hourly_wage: Number(body.hourlyWage),
    location: (body.location as string).trim(),
    requirements: (body.requirements as string).trim(),
    slug: finalSlug,
  });

  if (createError) {
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: 'Không thể tạo bài đăng' },
      { status: 500 },
    );
  }

  return NextResponse.json({ job }, { status: 201 });
}
