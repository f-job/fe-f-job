import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getJobSeekerProfile,
  getEmployerProfile,
  updateJobSeekerProfile,
  updateEmployerProfile,
} from '@/lib/supabase/helpers';
import { uploadVerificationDoc } from '@/lib/supabase/storage';
import { validateVerificationDocuments, DOC_TYPE_MAP } from '@/lib/verification';

/**
 * GET /api/verification
 * Returns the current verification status and document URLs for the authenticated user.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chưa đăng nhập' },
      { status: 401 },
    );
  }

  const client = createServerSupabaseClient();

  if (session.userType === 'job_seeker') {
    const { data, error } = await getJobSeekerProfile(client, session.userId);
    if (error || !data) {
      return NextResponse.json(
        { code: 'SERVER_ERROR', message: 'Không thể tải thông tin xác minh' },
        { status: 500 },
      );
    }
    return NextResponse.json({
      verificationStatus: data.verification_status,
      documents: {
        idCardFrontUrl: data.id_card_front_url,
        idCardBackUrl: data.id_card_back_url,
        selfieUrl: data.selfie_url,
      },
    });
  }

  // employer
  const { data, error } = await getEmployerProfile(client, session.userId);
  if (error || !data) {
    return NextResponse.json(
      { code: 'SERVER_ERROR', message: 'Không thể tải thông tin xác minh' },
      { status: 500 },
    );
  }
  return NextResponse.json({
    verificationStatus: data.verification_status,
    documents: {
      businessLicenseUrl: data.business_license_url,
      businessPhotoUrl: data.business_photo_url,
    },
  });
}

/**
 * POST /api/verification
 * Accept multipart form data with document uploads.
 * For job_seeker: require idCardFront, idCardBack, selfie.
 * For employer: require businessLicense, businessPhoto.
 * Upload files to Supabase Storage, update profile with URLs, set status to 'pending'.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { code: 'AUTH_UNAUTHORIZED', message: 'Chưa đăng nhập' },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ' },
      { status: 400 },
    );
  }

  // Extract files from form data
  const documents = {
    idCardFront: formData.get('idCardFront') as File | null,
    idCardBack: formData.get('idCardBack') as File | null,
    selfie: formData.get('selfie') as File | null,
    businessLicense: formData.get('businessLicense') as File | null,
    businessPhoto: formData.get('businessPhoto') as File | null,
  };

  // Validate required documents per user type
  const validation = validateVerificationDocuments(session.userType, documents);
  if (!validation.valid) {
    return NextResponse.json(
      {
        code: 'VERIFICATION_MISSING_DOCS',
        message: 'Thiếu tài liệu xác minh bắt buộc',
        details: { missingFields: validation.missingFields },
      },
      { status: 400 },
    );
  }

  const client = createServerSupabaseClient();

  try {
    if (session.userType === 'job_seeker') {
      // Upload all three documents
      const frontPath = await uploadVerificationDoc(
        client, session.userId, documents.idCardFront!, DOC_TYPE_MAP.idCardFront,
      );
      const backPath = await uploadVerificationDoc(
        client, session.userId, documents.idCardBack!, DOC_TYPE_MAP.idCardBack,
      );
      const selfiePath = await uploadVerificationDoc(
        client, session.userId, documents.selfie!, DOC_TYPE_MAP.selfie,
      );

      // Update profile with URLs and set status to pending
      const { error } = await updateJobSeekerProfile(client, session.userId, {
        id_card_front_url: frontPath,
        id_card_back_url: backPath,
        selfie_url: selfiePath,
        verification_status: 'pending',
      });

      if (error) {
        return NextResponse.json(
          { code: 'SERVER_ERROR', message: 'Không thể cập nhật hồ sơ xác minh' },
          { status: 500 },
        );
      }
    } else {
      // employer — upload two documents
      const licensePath = await uploadVerificationDoc(
        client, session.userId, documents.businessLicense!, DOC_TYPE_MAP.businessLicense,
      );
      const photoPath = await uploadVerificationDoc(
        client, session.userId, documents.businessPhoto!, DOC_TYPE_MAP.businessPhoto,
      );

      const { error } = await updateEmployerProfile(client, session.userId, {
        business_license_url: licensePath,
        business_photo_url: photoPath,
        verification_status: 'pending',
      });

      if (error) {
        return NextResponse.json(
          { code: 'SERVER_ERROR', message: 'Không thể cập nhật hồ sơ xác minh' },
          { status: 500 },
        );
      }
    }

    return NextResponse.json(
      { message: 'Đã gửi yêu cầu xác minh thành công', verificationStatus: 'pending' },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống';
    return NextResponse.json(
      { code: 'SERVER_ERROR', message },
      { status: 500 },
    );
  }
}
