import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Supabase Storage bucket names and upload helpers for
// verification documents and user avatars.
// ============================================================

export const STORAGE_BUCKETS = {
  /** CCCD images, selfies, business licenses, business photos */
  VERIFICATION_DOCS: 'verification-docs',
  /** User avatar images */
  AVATARS: 'avatars',
} as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf'];

/**
 * Ensure the required storage buckets exist.
 * Call once during app bootstrap or in a setup script.
 */
export async function ensureStorageBuckets(client: SupabaseClient) {
  const buckets = [
    { name: STORAGE_BUCKETS.VERIFICATION_DOCS, public: false },
    { name: STORAGE_BUCKETS.AVATARS, public: true },
  ];

  for (const bucket of buckets) {
    const { data } = await client.storage.getBucket(bucket.name);
    if (!data) {
      await client.storage.createBucket(bucket.name, { public: bucket.public });
    }
  }
}

/**
 * Upload a verification document (CCCD, selfie, business license, etc.).
 * Returns the storage path on success.
 */
export async function uploadVerificationDoc(
  client: SupabaseClient,
  userId: string,
  file: File,
  docType: 'id_card_front' | 'id_card_back' | 'selfie' | 'business_license' | 'business_photo',
) {
  validateFile(file, ALLOWED_DOC_TYPES);

  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${userId}/${docType}.${ext}`;

  const { data, error } = await client.storage
    .from(STORAGE_BUCKETS.VERIFICATION_DOCS)
    .upload(path, file, { upsert: true });

  if (error) throw error;
  return data.path;
}

/**
 * Upload a user avatar image. Returns the public URL.
 */
export async function uploadAvatar(
  client: SupabaseClient,
  userId: string,
  file: File,
) {
  validateFile(file, ALLOWED_IMAGE_TYPES);

  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${userId}/avatar.${ext}`;

  const { data, error } = await client.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data: urlData } = client.storage
    .from(STORAGE_BUCKETS.AVATARS)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Get a signed URL for a private verification document.
 * Expires after the given number of seconds (default 60).
 */
export async function getVerificationDocUrl(
  client: SupabaseClient,
  path: string,
  expiresIn = 60,
) {
  const { data, error } = await client.storage
    .from(STORAGE_BUCKETS.VERIFICATION_DOCS)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

// --- Internal ---

function validateFile(file: File, allowedTypes: string[]) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type "${file.type}" is not allowed. Accepted: ${allowedTypes.join(', ')}`);
  }
}
