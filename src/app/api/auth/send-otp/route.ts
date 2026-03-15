import { NextRequest, NextResponse } from 'next/server';
import { isValidVietnamesePhone } from '@/lib/phone';
import type { ApiError } from '@/lib/types';

/**
 * POST /api/auth/send-otp
 *
 * Validates the phone number on the server side.
 * The actual OTP sending happens client-side via Firebase's signInWithPhoneNumber
 * (which requires RecaptchaVerifier in the browser). This route serves as a
 * pre-validation step and can be extended for rate-limiting or logging.
 *
 * Body: { phone: string }
 * Returns: { success: true, message: string } or ApiError
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng nhập số điện thoại.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    if (!isValidVietnamesePhone(phone)) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Phone is valid — client can proceed with Firebase signInWithPhoneNumber
    return NextResponse.json({
      success: true,
      message: 'Số điện thoại hợp lệ. Vui lòng xác nhận reCAPTCHA để nhận mã OTP.',
    });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
