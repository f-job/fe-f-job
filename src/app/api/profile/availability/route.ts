import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getAvailabilities,
  createAvailability,
  deleteAvailability,
  getJobSeekerProfile,
} from '@/lib/supabase/helpers';
import type { ApiError } from '@/lib/types';

/**
 * GET /api/profile/availability
 *
 * Returns all availability slots for the authenticated job seeker.
 * For recurring slots, auto-populates future weeks (4 weeks ahead).
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để xem lịch rảnh.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    const { data: profile } = await getJobSeekerProfile(supabase, session.userId);
    if (!profile) {
      const error: ApiError = {
        code: 'JOB_NOT_FOUND',
        message: 'Không tìm thấy hồ sơ. Vui lòng tạo hồ sơ trước.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    const { data: slots, error: fetchError } = await getAvailabilities(supabase, profile.id);

    if (fetchError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tải lịch rảnh. Vui lòng thử lại.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Auto-populate future weeks for recurring slots
    const expandedSlots = expandRecurringSlots(slots ?? []);

    return NextResponse.json({ slots: expandedSlots });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}


/**
 * POST /api/profile/availability
 *
 * Creates a new availability slot for the authenticated job seeker.
 * Body: { date: string, startTime: string, endTime: string, isRecurring?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để thêm lịch rảnh.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const body = await request.json();
    const { date, startTime, endTime, isRecurring } = body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập đầy đủ ngày, giờ bắt đầu và giờ kết thúc.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Giờ không hợp lệ. Vui lòng nhập theo định dạng HH:mm.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate start time is before end time
    if (startTime >= endTime) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Giờ bắt đầu phải trước giờ kết thúc.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Ngày không hợp lệ. Vui lòng nhập theo định dạng YYYY-MM-DD.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: profile } = await getJobSeekerProfile(supabase, session.userId);
    if (!profile) {
      const error: ApiError = {
        code: 'JOB_NOT_FOUND',
        message: 'Không tìm thấy hồ sơ. Vui lòng tạo hồ sơ trước.',
      };
      return NextResponse.json(error, { status: 404 });
    }

    const { data: slot, error: createError } = await createAvailability(supabase, {
      job_seeker_id: profile.id,
      date,
      start_time: startTime,
      end_time: endTime,
      is_recurring: isRecurring ?? false,
      recurrence_pattern: isRecurring ? 'weekly' : null,
    });

    if (createError || !slot) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tạo lịch rảnh. Vui lòng thử lại.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({ success: true, slot });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}

/**
 * DELETE /api/profile/availability?id=<slot_id>
 *
 * Deletes an availability slot by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      const error: ApiError = {
        code: 'AUTH_UNAUTHORIZED',
        message: 'Vui lòng đăng nhập để xóa lịch rảnh.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('id');

    if (!slotId) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Thiếu ID lịch rảnh cần xóa.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error: deleteError } = await deleteAvailability(supabase, slotId);

    if (deleteError) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể xóa lịch rảnh. Vui lòng thử lại.',
      };
      return NextResponse.json(error, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa lịch rảnh.' });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}

// --- Helpers ---

interface SlotRow {
  id: string;
  job_seeker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_pattern: 'weekly' | null;
  created_at: string;
}

/**
 * Add days to a YYYY-MM-DD date string, returning a new YYYY-MM-DD string.
 * Uses pure arithmetic to avoid timezone issues with Date objects.
 */
function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d); // local date, no TZ shift
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Expand recurring slots to populate future weeks (4 weeks ahead).
 * Returns the original slots plus generated future entries for recurring ones.
 */
function expandRecurringSlots(slots: SlotRow[]) {
  const WEEKS_AHEAD = 4;
  const result: SlotRow[] = [...slots];
  const existingDates = new Set(slots.map((s) => `${s.date}_${s.start_time}_${s.end_time}`));

  for (const slot of slots) {
    if (!slot.is_recurring || slot.recurrence_pattern !== 'weekly') continue;

    for (let week = 1; week <= WEEKS_AHEAD; week++) {
      const futureDateStr = addDaysToDateStr(slot.date, 7 * week);
      const key = `${futureDateStr}_${slot.start_time}_${slot.end_time}`;

      // Don't duplicate if a slot already exists for that date/time
      if (existingDates.has(key)) continue;

      existingDates.add(key);
      result.push({
        ...slot,
        id: `${slot.id}_week${week}`,
        date: futureDateStr,
      });
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}
