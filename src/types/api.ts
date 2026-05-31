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

// ─────────────────────────────────────────────────────────────────────────────
// New modules (mirrors recently-added backend controllers)
//   Profiles · Search & Metadata · Notifications · Chat · Referrals · Payouts
// ─────────────────────────────────────────────────────────────────────────────

// ─── Candidate Profile (self-service, prefix /profiles) ─────────────────────

export interface ExperienceItem {
  _id: string;
  id?: string;
  role: string;
  companyName: string;
  startDate: string;
  endDate?: string;
  location?: string;
  duration?: string;
  description?: string;
}

export interface EducationItem {
  _id: string;
  id?: string;
  school: string;
  major?: string;
  duration: string;
  degree?: string;
}

export interface SkillItem {
  _id: string;
  id?: string;
  name: string;
  /** Proficiency 1–5. */
  rating: number;
}

export interface CvFileItem {
  _id: string;
  id?: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  isPrimary: boolean;
  createdAt?: string;
}

export interface MyProfile {
  _id: string;
  id?: string;
  userId: string;
  fullName: string;
  phone?: string;
  address?: string;
  summary?: string;
  location?: string;
  district?: string;
  openToWork: boolean;
  avatarUrl?: string;
  experiences: ExperienceItem[];
  educations: EducationItem[];
  skills: SkillItem[];
  files: CvFileItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  address?: string;
  summary?: string;
  location?: string;
  district?: string;
}

export interface CreateExperiencePayload {
  role: string;
  companyName: string;
  startDate: string;
  endDate?: string;
  location?: string;
  duration?: string;
  description?: string;
}

export interface CreateEducationPayload {
  school: string;
  major?: string;
  duration: string;
  degree?: string;
}

export interface AddSkillPayload {
  name: string;
  rating: number;
}

// ─── Search & Metadata ──────────────────────────────────────────────────────

export interface SearchJobsQuery {
  keyword?: string;
  companyName?: string;
  province?: string;
  district?: string;
  industry?: string;
  level?: ExperienceLevel;
  jobType?: CasualJobType;
  salary_min?: number;
  salary_max?: number;
  is_urgent?: boolean;
  sort?: JobSortOption;
  page?: number;
  limit?: number;
}

export interface SearchCandidatesQuery {
  skills?: string;
  province?: string;
  summary?: string;
  openToWork?: boolean;
  page?: number;
  limit?: number;
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

export interface Province {
  id: string;
  name: string;
  slug: string;
  region?: string;
}

export interface District {
  id: string;
  name: string;
}

export interface DistrictsResponse {
  province: Province;
  districts: District[];
}

export interface SkillOption {
  id: string;
  name: string;
  category?: string;
}

export interface LevelOption {
  id: string;
  value: ExperienceLevel;
  label: string;
}

export interface JobTypeOption {
  id: string;
  value: CasualJobType;
  label: string;
}

// ─── Notifications ──────────────────────────────────────────────────────────

export type NotificationType =
  | 'APPLICATION_STATUS'
  | 'NEW_JOB'
  | 'SYSTEM'
  | 'SHIFT_REMINDER'
  | 'RECRUITMENT_MESSAGE';

export interface AppNotification {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

// ─── Chat & Messaging ───────────────────────────────────────────────────────

/** A user reference that may arrive as a bare id or a populated subset. */
export type UserRef = string | { _id: string; id?: string; fullName?: string; email?: string; role?: UserRole };

/** Resolve the id of a possibly-populated user reference. */
export function getRefId(ref: UserRef | null | undefined): string {
  if (!ref) return '';
  return typeof ref === 'string' ? ref : ref._id ?? ref.id ?? '';
}

export interface ChatParticipant {
  _id: string;
  id?: string;
  fullName?: string;
  email?: string;
  role?: UserRole;
}

/** Denormalized last-message snapshot on the conversation document. */
export interface LatestMessageSnapshot {
  text: string;
  senderId?: UserRef;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  id?: string;
  /** Raw ids (list endpoint) OR populated objects (create/detail endpoint). */
  participants: UserRef[];
  /** Only present on the GET /conversations list response (aggregation). */
  participantDetails?: ChatParticipant[];
  latestMessage?: LatestMessageSnapshot | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  _id: string;
  id?: string;
  conversationId: string;
  /** Populated to a {_id, fullName, email} object over REST + socket. */
  senderId: UserRef;
  text: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string;
}

// ─── Candidate search (Employer/Admin) ──────────────────────────────────────
// GET /search/candidates queries the shared `candidate_profiles` collection.
// Because the Profiles module writes rich subdocuments there, skills can arrive
// either as plain strings (legacy) or as {name, rating} objects, and the bio
// text may live under `bio` or `summary`. The type stays permissive and the UI
// normalises via the helpers below.

export interface CandidateSearchResult {
  _id: string;
  id?: string;
  userId: string;
  fullName: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  openToWork: boolean;
  skills: Array<string | SkillItem>;
  bio?: string;
  summary?: string;
  location?: string;
  district?: string;
  updatedAt?: string;
}

/** Normalise a skill entry (string or {name}) to its display label. */
export function skillLabel(skill: string | SkillItem): string {
  return typeof skill === 'string' ? skill : skill?.name ?? '';
}

/** Best-effort bio/summary text for a candidate search result. */
export function candidateBio(c: CandidateSearchResult): string {
  return c.bio ?? c.summary ?? '';
}

// ─── Referrals ──────────────────────────────────────────────────────────────

export interface ReferralInfo {
  referralCode: string;
  inviteUrl: string;
  totalReferrals: number;
  totalEarned: number;
}

export interface ReferralHistoryItem {
  _id: string;
  id?: string;
  refereeId?: { fullName?: string; email?: string } | string;
  rewardAmount: number;
  status: string;
  createdAt?: string;
}

// ─── Payouts ────────────────────────────────────────────────────────────────

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export interface PayoutBankInfo {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface Payout {
  _id: string;
  id?: string;
  userId: string;
  amount: number;
  bankInfo: PayoutBankInfo;
  status: PayoutStatus;
  transactionId?: string | null;
  adminNote?: string | null;
  processedAt?: string | null;
  createdAt?: string;
}

export interface PayoutSettings {
  _id?: string;
  id?: string;
  userId?: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  updatedAt?: string;
}

export interface PayoutEligibility {
  eligible: boolean;
  referralBalance: number;
  minimumAmount: number;
  hasSettings: boolean;
  reason?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Employer job posting (prefix /employers/jobs) + Admin moderation (/admin/jobs)
// ─────────────────────────────────────────────────────────────────────────────

/** Payload to create a job posting. Mirrors CreateEmployerJobDto. */
export interface CreateEmployerJobPayload {
  title: string;
  description: string;
  location: string;
  district?: string;
  salaryType: SalaryType;
  salaryAmount: number;
  level: ExperienceLevel;
  jobType: CasualJobType;
  industry: string;
  workingTimeText: string;
  slots?: number;
  expiresAt?: string;
  benefits?: string[];
  isUrgent?: boolean;
}

export type UpdateEmployerJobPayload = Partial<CreateEmployerJobPayload>;

export interface EmployerJobsQuery {
  status?: JobStatus;
  page?: number;
  limit?: number;
}

export interface AdminJobsQuery {
  status?: JobStatus;
  page?: number;
  limit?: number;
}

/** Snapshot of an application as returned by /employers/jobs/:id/applications. */
export interface EmployerJobApplication {
  _id: string;
  id?: string;
  jobId: string;
  candidateId: string;
  employerId: string;
  candidateName: string;
  candidatePhone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: string;
  noteByEmployer?: string;
  isViewed: boolean;
  createdAt?: string;
}

export interface EmployerJobApplicationsResponse {
  jobId: string;
  total: number;
  data: EmployerJobApplication[];
}

/** Human-readable label + badge variant for a job status. */
export function jobStatusLabel(status: JobStatus): string {
  switch (status) {
    case 'draft': return 'Nháp / Bị từ chối';
    case 'pending': return 'Chờ duyệt';
    case 'active': return 'Đang hiển thị';
    case 'closed': return 'Đã đóng';
    case 'expired': return 'Hết hạn';
    default: return status;
  }
}

export function jobStatusVariant(status: JobStatus): string {
  switch (status) {
    case 'draft': return 'secondary';
    case 'pending': return 'warning';
    case 'active': return 'success';
    case 'closed': return 'dark';
    case 'expired': return 'danger';
    default: return 'secondary';
  }
}
