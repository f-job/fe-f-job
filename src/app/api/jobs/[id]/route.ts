import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import { getJobById, updateJob } from '@/lib/supabase/helpers';
import { generateVietnameseSlug } from '@/lib/slug';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const client = createServerSupabaseClient();
  const { data: job, error } = await getJobById(client, id);

  if (error || !job) {
    return NextResponse.json(
      { code: 'JOB_NOT_FOUND', message: 'Không tìm thấy việc làm' },
      { status: 404 },
    );
  }

  // Attach employer info
  const { data: employer } = await client
    .from('employer_profiles')
    .select('business_name, verification_status')
    .eq('user_id', job.employer_id)
    .single();

  return NextResponse.json({
    job: {
      ...job,
      employer_name: employer?.business_name ?? 'Nhà tuyển dụng',
      employer_verified: employer?.verification_status === 'verified',
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chưa đăng nhập' },
      { status: 401 },
    );
  }

  if (session.userType !== 'employer') {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chỉ nhà tuyển dụng mới có thể chỉnh sửa tin' },
      { status: 403 },
    );
  }

  const client = createServerSupabaseClient();

  // Verify the job exists and belongs to this employer
  const { data: existingJob, error: fetchError } = await getJobById(client, id);

  if (fetchError || !existingJob) {
    return NextResponse.json(
      { code: 'JOB_NOT_FOUND', message: 'Không tìm thấy việc làm' },
      { status: 404 },
    );
  }

  if (existingJob.employer_id !== session.userId) {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Bạn không có quyền chỉnh sửa tin này' },
      { status: 403 },
    );
  }

  // Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }

  // Build update data — only include fields that are provided
  const updateData: Record<string, unknown> = {};

  if (body.title !== undefined) {
    const title = (body.title as string).trim();
    if (!title) {
      return NextResponse.json(
        { code: 'JOB_MISSING_FIELDS', message: 'Tiêu đề không được để trống' },
        { status: 400 },
      );
    }
    updateData.title = title;
    // Regenerate slug if title changes
    const newSlug = generateVietnameseSlug(title);
    if (newSlug !== existingJob.slug) {
      const { data: slugConflict } = await client
        .from('jobs')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', id)
        .maybeSingle();
      updateData.slug = slugConflict ? `${newSlug}-${Date.now().toString(36)}` : newSlug;
    }
  }

  if (body.description !== undefined) {
    const desc = (body.description as string).trim();
    if (!desc) {
      return NextResponse.json(
        { code: 'JOB_MISSING_FIELDS', message: 'Mô tả không được để trống' },
        { status: 400 },
      );
    }
    updateData.description = desc;
  }

  if (body.jobCategory !== undefined) updateData.job_category = (body.jobCategory as string).trim();
  if (body.numberOfPositions !== undefined) updateData.number_of_positions = Number(body.numberOfPositions);
  if (body.workDate !== undefined) updateData.work_date = body.workDate;
  if (body.startTime !== undefined) updateData.start_time = body.startTime;
  if (body.endTime !== undefined) updateData.end_time = body.endTime;
  if (body.hourlyWage !== undefined) updateData.hourly_wage = Number(body.hourlyWage);
  if (body.location !== undefined) updateData.location = (body.location as string).trim();
  if (body.requirements !== undefined) updateData.requirements = (body.requirements as string).trim();
  if (body.status !== undefined) {
    const validStatuses = ['open', 'filled', 'completed', 'cancelled'];
    if (!validStatuses.includes(body.status as string)) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Trạng thái không hợp lệ' },
        { status: 400 },
      );
    }
    updateData.status = body.status;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Không có dữ liệu cần cập nhật' },
      { status: 400 },
    );
  }

  const { data: updatedJob, error: updateError } = await updateJob(
    client,
    id,
    updateData as Parameters<typeof updateJob>[2],
  );

  if (updateError) {
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: 'Không thể cập nhật bài đăng' },
      { status: 500 },
    );
  }

  return NextResponse.json({ job: updatedJob });
}
