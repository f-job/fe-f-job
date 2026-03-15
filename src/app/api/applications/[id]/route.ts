import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateApplicationStatus } from '@/lib/supabase/helpers';
import type { ApiError } from '@/lib/types';

/**
 * PATCH /api/applications/[id]
 *
 * Update application status (accept/reject) — employer only.
 * Body: { status: 'accepted' | 'rejected' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
        message: 'Chỉ nhà tuyển dụng mới có thể cập nhật trạng thái ứng tuyển.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const newStatus = body.status as string;
    if (!newStatus || !['accepted', 'rejected'].includes(newStatus)) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Trạng thái phải là "accepted" hoặc "rejected".',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const client = createServerSupabaseClient();

    // Verify the application exists
    const { data: application, error: fetchError } = await client
      .from('applications')
      .select('*, jobs!inner(employer_id)')
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      const error: ApiError = {
        code: 'APPLICATION_NOT_FOUND',
        message: 'Không tìm thấy đơn ứng tuyển.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    // Verify the employer owns the job this application belongs to
    const jobData = application.jobs as { employer_id: string };
    if (jobData.employer_id !== session.userId) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Bạn không có quyền cập nhật đơn ứng tuyển này.',
      };
      return NextResponse.json(error, { status: 403 });
    }

    // Update the application status
    const { data: updated, error: updateError } = await updateApplicationStatus(
      client,
      id,
      newStatus as 'accepted' | 'rejected',
    );

    if (updateError || !updated) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể cập nhật trạng thái. Vui lòng thử lại.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message:
        newStatus === 'accepted'
          ? 'Đã chấp nhận ứng viên.'
          : 'Đã từ chối ứng viên.',
      application: updated,
    });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
