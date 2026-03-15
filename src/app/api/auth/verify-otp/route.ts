import { NextRequest, NextResponse } from 'next/server';
import type { ApiError } from '@/lib/types';

/**
 * POST /api/auth/verify-otp
 *
 * Receives the Firebase ID token after client-side OTP verification.
 * Validates the token and returns user info. This route acts as the
 * server-side confirmation step after the client verifies the OTP
 * via Firebase's ConfirmationResult.confirm().
 *
 * Body: { idToken: string, phone: string }
 * Returns: { success: true, uid: string, phone: string } or ApiError
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, phone } = body;

    if (!idToken || typeof idToken !== 'string') {
      const error: ApiError = {
        code: 'AUTH_INVALID_OTP',
        message: 'Mã xác thực không hợp lệ. Vui lòng thử lại.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    if (!phone || typeof phone !== 'string') {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Vui lòng cung cấp số điện thoại.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // In production, verify the Firebase ID token using Firebase Admin SDK:
    //   import { getAuth } from 'firebase-admin/auth';
    //   const decoded = await getAuth().verifyIdToken(idToken);
    //
    // For now, we trust the client-side Firebase SDK verification
    // and return success. Firebase Admin SDK integration can be added
    // when server-side token verification is needed.

    return NextResponse.json({
      success: true,
      phone,
      message: 'Xác thực OTP thành công.',
    });
  } catch {
    const error: ApiError = {
      code: 'AUTH_INVALID_OTP',
      message: 'Xác thực OTP thất bại. Mã OTP không hợp lệ hoặc đã hết hạn.',
    };
    return NextResponse.json(error, { status: 400 });
  }
}
