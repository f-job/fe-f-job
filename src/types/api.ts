// ─────────────────────────────────────────────────────────────────────────────
// Shared API types mirroring the be-f-job (NestJS) backend.
//
// NOTE on identifiers:
//   Most list/detail endpoints use Mongoose `.lean()`, which returns the raw
//   `_id` field (serialized to a hex string over HTTP) and NOT the `id` virtual.
//   A few endpoints (e.g. create) return full documents that expose both
//   `id` and `_id`. To stay safe, entities expose `_id` plus an optional `id`,
//   and the `getEntityId` helper resolves whichever is present.
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'USER' | 'CANDIDATE' | 'EMPLOYER';
export type UserStatus = 'active' | 'blocked';
export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK';

/** Pagination envelope returned by paginated list endpoints. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  note?: string;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Resolve the canonical id of any backend entity (`_id` or `id`). */
export function getEntityId(entity: { _id?: string; id?: string } | null | undefined): string {
  return entity?._id ?? entity?.id ?? '';
}

// ─── Users ──────────────────────────────────────────────────────────────────

export interface BackendUser {
  _id: string;
  id?: string;
  fullName?: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: boolean;
  provider?: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Candidates ───────────────────────────────────────────────────────────────

export interface CandidateProfile {
  _id: string;
  id?: string;
  userId: string;
  fullName: string;
  phone?: string;
  address?: string;
  resumeUrl?: string;
  avatarUrl?: string;
  openToWork: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Shape of each row returned by GET /users/candidates and GET /users/candidates/:id */
export interface CandidateDetail {
  user: BackendUser;
  profile: CandidateProfile | null;
}

export interface UpdateCandidatePayload {
  fullName?: string;
  phone?: string;
  address?: string;
  resumeUrl?: string;
  avatarUrl?: string;
}

// ─── Employers ─────────────────────────────────────────────────────────────────

export type EmployerStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'BLOCKED';

/** userId is populated with a subset of the User document by the backend. */
export interface EmployerPopulatedUser {
  _id: string;
  id?: string;
  email?: string;
  fullName?: string;
  status?: UserStatus;
}

export interface EmployerProfile {
  _id: string;
  id?: string;
  userId: EmployerPopulatedUser | string;
  companyName: string;
  companyDescription?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  logoUrl?: string;
  bannerUrl?: string;
  galleryImages?: string[];
  contactEmail?: string;
  contactPhone?: string;
  city?: string;
  country?: string;
  status: EmployerStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectedReason?: string;
  blockedAt?: string;
  blockedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateEmployerPayload {
  companyName?: string;
  companyDescription?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export type JobStatus = 'draft' | 'pending' | 'active' | 'closed' | 'expired';
export type ExperienceLevel = 'No Experience' | '< 6 Months' | '> 6 Months';
export type CasualJobType = 'Part-time' | 'Event' | 'Seasonal';
export type SalaryType = 'hourly' | 'daily' | 'fixed';
export type JobSortOption = 'newest' | 'salary_high' | 'salary_low';

export interface BackendJob {
  _id: string;
  id?: string;
  employerId: string;
  title: string;
  description: string;
  companyName: string;
  companyLogoUrl?: string;
  location: string;
  district?: string;
  salaryType: SalaryType;
  salaryAmount: number;
  level: ExperienceLevel;
  jobType: CasualJobType;
  industry: string;
  workingTimeText: string;
  slots: number;
  expiresAt?: string;
  benefits: string[];
  status: JobStatus;
  isUrgent: boolean;
  isPinned: boolean;
  rejectionReason?: string;
  applicationCount: number;
  viewCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListJobsQuery {
  keyword?: string;
  location?: string;
  district?: string;
  salary_min?: number;
  salary_max?: number;
  level?: ExperienceLevel;
  job_type?: CasualJobType;
  industry?: string;
  is_urgent?: boolean;
  sort?: JobSortOption;
  page?: number;
  limit?: number;
}

export interface IndustryStat {
  industry: string;
  count: number;
}

// ─── Applications ──────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'Applied'
  | 'Viewed'
  | 'Scheduled'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn';

export type CvType = 'online' | 'pdf' | 'quick';

/** When populated, jobId carries a lightweight snapshot of the target job. */
export interface ApplicationJobSnapshot {
  _id: string;
  id?: string;
  title?: string;
  companyName?: string;
  companyLogoUrl?: string;
  location?: string;
  salaryType?: SalaryType;
  salaryAmount?: number;
  workingTimeText?: string;
  status?: JobStatus;
  expiresAt?: string;
}

export interface Application {
  _id: string;
  id?: string;
  candidateId: string;
  jobId: string | ApplicationJobSnapshot;
  cvType: CvType;
  cvPdfUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  employerNote?: string;
  scheduledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateApplicationPayload {
  jobId: string;
  cvType: CvType;
  cvPdfUrl?: string;
  coverLetter?: string;
}

export interface ApplicationStatusSnapshot {
  status: ApplicationStatus;
  scheduledAt?: string;
  employerNote?: string;
  updatedAt?: string;
}
