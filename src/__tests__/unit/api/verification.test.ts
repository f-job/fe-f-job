/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

// --- Mocks ---

const mockGetSession = jest.fn();
jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

const mockCreateServerSupabaseClient = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: () => mockCreateServerSupabaseClient(),
}));

const mockGetJobSeekerProfile = jest.fn();
const mockGetEmployerProfile = jest.fn();
const mockUpdateJobSeekerProfile = jest.fn();
const mockUpdateEmployerProfile = jest.fn();
jest.mock('@/lib/supabase/helpers', () => ({
  getJobSeekerProfile: (...args: unknown[]) => mockGetJobSeekerProfile(...args),
  getEmployerProfile: (...args: unknown[]) => mockGetEmployerProfile(...args),
  updateJobSeekerProfile: (...args: unknown[]) => mockUpdateJobSeekerProfile(...args),
  updateEmployerProfile: (...args: unknown[]) => mockUpdateEmployerProfile(...args),
}));

const mockUploadVerificationDoc = jest.fn();
jest.mock('@/lib/supabase/storage', () => ({
  uploadVerificationDoc: (...args: unknown[]) => mockUploadVerificationDoc(...args),
}));

import { GET, POST } from '@/app/api/verification/route';

// Helper to create a File-like blob for FormData in Node
function createMockFile(name: string, type = 'image/jpeg'): File {
  const blob = new Blob(['fake-content'], { type });
  return new File([blob], name, { type });
}

function createFormData(files: Record<string, File>): FormData {
  const fd = new FormData();
  for (const [key, file] of Object.entries(files)) {
    fd.append(key, file);
  }
  return fd;
}

function createPostRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost:3000/api/verification', {
    method: 'POST',
    body: formData,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateServerSupabaseClient.mockReturnValue({});
});

// ============================================================
// GET /api/verification
// ============================================================

describe('GET /api/verification', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns verification status for job_seeker', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u1', userType: 'job_seeker' });
    mockGetJobSeekerProfile.mockResolvedValue({
      data: {
        verification_status: 'pending',
        id_card_front_url: 'front.jpg',
        id_card_back_url: 'back.jpg',
        selfie_url: 'selfie.jpg',
      },
      error: null,
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.verificationStatus).toBe('pending');
    expect(data.documents.idCardFrontUrl).toBe('front.jpg');
    expect(data.documents.idCardBackUrl).toBe('back.jpg');
    expect(data.documents.selfieUrl).toBe('selfie.jpg');
  });

  it('returns verification status for employer', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u2', userType: 'employer' });
    mockGetEmployerProfile.mockResolvedValue({
      data: {
        verification_status: 'verified',
        business_license_url: 'license.pdf',
        business_photo_url: 'photo.jpg',
      },
      error: null,
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.verificationStatus).toBe('verified');
    expect(data.documents.businessLicenseUrl).toBe('license.pdf');
    expect(data.documents.businessPhotoUrl).toBe('photo.jpg');
  });

  it('returns 500 when profile fetch fails', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u1', userType: 'job_seeker' });
    mockGetJobSeekerProfile.mockResolvedValue({ data: null, error: new Error('db error') });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });
});

// ============================================================
// POST /api/verification
// ============================================================

describe('POST /api/verification', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const fd = createFormData({});
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('returns VERIFICATION_MISSING_DOCS when job_seeker is missing documents', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u1', userType: 'job_seeker' });

    // Only provide 1 of 3 required docs
    const fd = createFormData({
      idCardFront: createMockFile('front.jpg'),
    });
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VERIFICATION_MISSING_DOCS');
    expect(data.details.missingFields).toContain('idCardBack');
    expect(data.details.missingFields).toContain('selfie');
  });

  it('returns VERIFICATION_MISSING_DOCS when job_seeker sends no documents', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u1', userType: 'job_seeker' });

    const fd = createFormData({});
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VERIFICATION_MISSING_DOCS');
    expect(data.details.missingFields).toHaveLength(3);
  });

  it('returns VERIFICATION_MISSING_DOCS when employer is missing documents', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u2', userType: 'employer' });

    // Only provide 1 of 2 required docs
    const fd = createFormData({
      businessLicense: createMockFile('license.pdf', 'application/pdf'),
    });
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VERIFICATION_MISSING_DOCS');
    expect(data.details.missingFields).toContain('businessPhoto');
  });

  it('returns VERIFICATION_MISSING_DOCS when employer sends no documents', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u2', userType: 'employer' });

    const fd = createFormData({});
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VERIFICATION_MISSING_DOCS');
    expect(data.details.missingFields).toHaveLength(2);
  });

  it('succeeds for job_seeker with all 3 required documents', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u1', userType: 'job_seeker' });
    mockUploadVerificationDoc.mockResolvedValue('u1/id_card_front.jpg');
    mockUpdateJobSeekerProfile.mockResolvedValue({ data: {}, error: null });

    const fd = createFormData({
      idCardFront: createMockFile('front.jpg'),
      idCardBack: createMockFile('back.jpg'),
      selfie: createMockFile('selfie.jpg'),
    });
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.verificationStatus).toBe('pending');
    expect(mockUploadVerificationDoc).toHaveBeenCalledTimes(3);
    expect(mockUpdateJobSeekerProfile).toHaveBeenCalledWith(
      expect.anything(),
      'u1',
      expect.objectContaining({ verification_status: 'pending' }),
    );
  });

  it('succeeds for employer with all 2 required documents', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u2', userType: 'employer' });
    mockUploadVerificationDoc.mockResolvedValue('u2/business_license.pdf');
    mockUpdateEmployerProfile.mockResolvedValue({ data: {}, error: null });

    const fd = createFormData({
      businessLicense: createMockFile('license.pdf', 'application/pdf'),
      businessPhoto: createMockFile('photo.jpg'),
    });
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.verificationStatus).toBe('pending');
    expect(mockUploadVerificationDoc).toHaveBeenCalledTimes(2);
    expect(mockUpdateEmployerProfile).toHaveBeenCalledWith(
      expect.anything(),
      'u2',
      expect.objectContaining({ verification_status: 'pending' }),
    );
  });

  it('returns 500 when profile update fails', async () => {
    mockGetSession.mockResolvedValue({ userId: 'u1', userType: 'job_seeker' });
    mockUploadVerificationDoc.mockResolvedValue('path.jpg');
    mockUpdateJobSeekerProfile.mockResolvedValue({
      data: null,
      error: new Error('update failed'),
    });

    const fd = createFormData({
      idCardFront: createMockFile('front.jpg'),
      idCardBack: createMockFile('back.jpg'),
      selfie: createMockFile('selfie.jpg'),
    });
    const req = createPostRequest(fd);
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.code).toBe('SERVER_ERROR');
  });
});
