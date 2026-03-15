import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserByPhone, getUserByEmail } from '@/lib/supabase/helpers';
import { isValidVietnamesePhone } from '@/lib/phone';
import { setSessionCookie } from '@/lib/session';
import type { ApiError } from '@/lib/types';

interface LoginBody {
  identifier: string; // phone or email
  password: string;
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user by phone number or email + password.
 * Returns user info with user_type for client-side redirect.
 *
 * Body: { identifier: string, password: string }
 * Returns: { success, userId, userType, redirectUrl } or ApiError
 */
export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json();

    if (!body.identifier?.trim()) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập số điện thoại hoặc email.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    if (!body.password) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập mật khẩu.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const identifier = body.identifier.trim();

    // Determine if identifier is phone or email
    const isPhone = isValidVietnamesePhone(identifier);
    const { data: user } = isPhone
      ? await getUserByPhone(supabase, identifier)
      : await getUserByEmail(supabase, identifier);

    if (!user) {
      const error: ApiError = {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Thông tin đăng nhập không đúng. Vui lòng kiểm tra lại.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    // TODO: Replace with bcrypt.compare() when bcrypt is integrated
    if (user.password_hash !== body.password) {
      const error: ApiError = {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Thông tin đăng nhập không đúng. Vui lòng kiểm tra lại.',
      };
      return NextResponse.json(error, { status: 401 });
    }

    // Determine redirect URL based on user_type
    const redirectUrl = user.user_type === 'job_seeker' ? '/ho-so' : '/dashboard';

    const response = NextResponse.json({
      success: true,
      userId: user.id,
      userType: user.user_type,
      redirectUrl,
    });

    // Set session cookie for middleware auth checks
    setSessionCookie(response, {
      userId: user.id,
      userType: user.user_type,
    });

    return response;
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
