import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  createUser,
  getUserByPhone,
  getUserByEmail,
  createJobSeekerProfile,
  createEmployerProfile,
} from '@/lib/supabase/helpers';
import { isValidVietnamesePhone } from '@/lib/phone';
import { UserType } from '@/lib/types';
import type { ApiError } from '@/lib/types';

interface JobSeekerBody {
  userType: 'job_seeker';
  phone: string;
  email: string;
  fullName: string;
  password: string;
}

interface EmployerBody {
  userType: 'employer';
  businessName: string;
  businessEmail: string;
  phone: string;
  businessType: string;
  password: string;
}

type RegisterBody = JobSeekerBody | EmployerBody;

function isJobSeekerBody(body: RegisterBody): body is JobSeekerBody {
  return body.userType === 'job_seeker';
}

function validateJobSeeker(body: JobSeekerBody): string | null {
  if (!body.phone?.trim()) return 'Vui lòng nhập số điện thoại.';
  if (!isValidVietnamesePhone(body.phone)) return 'Số điện thoại không hợp lệ.';
  if (!body.email?.trim()) return 'Vui lòng nhập email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return 'Email không hợp lệ.';
  if (!body.fullName?.trim()) return 'Vui lòng nhập họ tên.';
  if (!body.password || body.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
  return null;
}

function validateEmployer(body: EmployerBody): string | null {
  if (!body.businessName?.trim()) return 'Vui lòng nhập tên doanh nghiệp.';
  if (!body.businessEmail?.trim()) return 'Vui lòng nhập email doanh nghiệp.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.businessEmail)) return 'Email không hợp lệ.';
  if (!body.phone?.trim()) return 'Vui lòng nhập số điện thoại.';
  if (!isValidVietnamesePhone(body.phone)) return 'Số điện thoại không hợp lệ.';
  if (!body.businessType?.trim()) return 'Vui lòng chọn loại hình doanh nghiệp.';
  if (!body.password || body.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
  return null;
}

/**
 * POST /api/auth/register
 *
 * Handles registration for both Job Seeker and Employer user types.
 * Validates required fields, checks for duplicate phone/email,
 * creates user + profile records.
 *
 * Body: JobSeekerBody | EmployerBody
 * Returns: { success: true, userId: string, userType: string } or ApiError
 */
export async function POST(request: NextRequest) {
  try {
    const body: RegisterBody = await request.json();

    if (!body.userType || ![UserType.JOB_SEEKER, UserType.EMPLOYER].includes(body.userType as UserType)) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: 'Loại tài khoản không hợp lệ.',
      };
      return NextResponse.json(error, { status: 400 });
    }

    // Validate required fields per user type
    const validationError = isJobSeekerBody(body)
      ? validateJobSeeker(body)
      : validateEmployer(body as EmployerBody);

    if (validationError) {
      const error: ApiError = {
        code: 'VALIDATION_ERROR',
        message: validationError,
      };
      return NextResponse.json(error, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check duplicate phone
    const { data: existingPhone } = await getUserByPhone(supabase, body.phone);
    if (existingPhone) {
      const error: ApiError = {
        code: 'AUTH_DUPLICATE_PHONE',
        message: 'Số điện thoại đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng số khác.',
      };
      return NextResponse.json(error, { status: 409 });
    }

    // Check duplicate email
    const email = isJobSeekerBody(body) ? body.email : (body as EmployerBody).businessEmail;
    const { data: existingEmail } = await getUserByEmail(supabase, email);
    if (existingEmail) {
      const error: ApiError = {
        code: 'AUTH_DUPLICATE_EMAIL',
        message: 'Email đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.',
      };
      return NextResponse.json(error, { status: 409 });
    }

    // Create user record
    // NOTE: In production, password should be hashed with bcrypt.
    // For now we store a placeholder hash — real hashing will be added
    // when bcrypt is integrated.
    const { data: user, error: userError } = await createUser(supabase, {
      phone: body.phone,
      email,
      password_hash: body.password, // TODO: hash with bcrypt
      user_type: body.userType,
    });

    if (userError || !user) {
      const error: ApiError = {
        code: 'SERVER_ERROR',
        message: 'Không thể tạo tài khoản. Vui lòng thử lại sau.',
        details: userError?.message,
      };
      return NextResponse.json(error, { status: 500 });
    }

    // Create profile based on user type
    if (isJobSeekerBody(body)) {
      const { error: profileError } = await createJobSeekerProfile(supabase, {
        user_id: user.id,
        full_name: body.fullName,
        date_of_birth: null,
        gender: null,
        avatar_url: null,
        address: null,
        current_location: null,
        school_name: null,
        major: null,
        skills: [],
        id_card_front_url: null,
        id_card_back_url: null,
        selfie_url: null,
      });

      if (profileError) {
        const error: ApiError = {
          code: 'SERVER_ERROR',
          message: 'Tạo tài khoản thành công nhưng không thể tạo hồ sơ. Vui lòng liên hệ hỗ trợ.',
          details: profileError.message,
        };
        return NextResponse.json(error, { status: 500 });
      }
    } else {
      const employerBody = body as EmployerBody;
      const { error: profileError } = await createEmployerProfile(supabase, {
        user_id: user.id,
        business_name: employerBody.businessName,
        business_email: employerBody.businessEmail,
        business_type: employerBody.businessType,
        address: null,
        business_license_url: null,
        business_photo_url: null,
      });

      if (profileError) {
        const error: ApiError = {
          code: 'SERVER_ERROR',
          message: 'Tạo tài khoản thành công nhưng không thể tạo hồ sơ. Vui lòng liên hệ hỗ trợ.',
          details: profileError.message,
        };
        return NextResponse.json(error, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      userType: body.userType,
      message: 'Đăng ký thành công!',
    });
  } catch {
    const error: ApiError = {
      code: 'SERVER_ERROR',
      message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
    };
    return NextResponse.json(error, { status: 500 });
  }
}
