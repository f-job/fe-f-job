// ============================================================
// Verification document validation logic for F-Job.
// Validates required documents per user type before submission.
// ============================================================

export interface VerificationDocuments {
  idCardFront?: File | null;
  idCardBack?: File | null;
  selfie?: File | null;
  businessLicense?: File | null;
  businessPhoto?: File | null;
}

export interface ValidationResult {
  valid: boolean;
  missingFields: string[];
}

const JOB_SEEKER_REQUIRED_DOCS = ['idCardFront', 'idCardBack', 'selfie'] as const;
const EMPLOYER_REQUIRED_DOCS = ['businessLicense', 'businessPhoto'] as const;

/**
 * Validate that all required verification documents are present for the given user type.
 * Returns { valid, missingFields }.
 */
export function validateVerificationDocuments(
  userType: 'job_seeker' | 'employer',
  documents: VerificationDocuments,
): ValidationResult {
  const requiredDocs =
    userType === 'job_seeker' ? JOB_SEEKER_REQUIRED_DOCS : EMPLOYER_REQUIRED_DOCS;

  const missingFields: string[] = [];

  for (const field of requiredDocs) {
    const doc = documents[field];
    if (!doc || (doc instanceof File && doc.size === 0)) {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Map form field names to Supabase Storage doc type identifiers.
 */
export const DOC_TYPE_MAP: Record<string, 'id_card_front' | 'id_card_back' | 'selfie' | 'business_license' | 'business_photo'> = {
  idCardFront: 'id_card_front',
  idCardBack: 'id_card_back',
  selfie: 'selfie',
  businessLicense: 'business_license',
  businessPhoto: 'business_photo',
};

/**
 * Vietnamese labels for verification statuses.
 */
export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  not_started: 'Chưa xác minh',
  pending: 'Đang chờ xác minh',
  verified: 'Đã xác minh',
  rejected: 'Bị từ chối',
};
