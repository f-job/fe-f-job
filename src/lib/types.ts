// ============================================================
// Shared TypeScript interfaces, types, and enums for F-Job
// ============================================================

// --- Enums ---

export enum UserType {
  JOB_SEEKER = 'job_seeker',
  EMPLOYER = 'employer',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum JobStatus {
  OPEN = 'open',
  FILLED = 'filled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VerificationStatusEnum {
  NOT_STARTED = 'not_started',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

// --- Types ---

export type TrustLevel =
  | 'new'
  | 'trustworthy'
  | 'reputable'
  | 'excellent'
  | 'top_worker';

export type VerificationStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'rejected';

// --- Interfaces ---

export interface JobCardProps {
  id: string;
  title: string;
  employerName: string;
  employerVerified: boolean;
  location: string;
  workDate: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  positionsAvailable: number;
  slug: string;
  matchPercentage?: number;
}

export interface FilterState {
  location: string | null;
  jobCategory: string | null;
  salaryRange: { min: number; max: number } | null;
  workDate: string | null;
  keyword: string;
}

export interface WorkerProfile {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  avatarUrl: string | null;
  address: string;
  currentLocation: string;
  schoolName: string | null;
  major: string | null;
  skills: string[];
  creditScore: number;
  trustLevel: TrustLevel;
  totalCompletedJobs: number;
  averageRating: number;
}

export interface JobPostingData {
  title: string;
  description: string;
  jobCategory: string;
  numberOfPositions: number;
  workDate: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  location: string;
  requirements: string;
}

export interface ApplicantSummary {
  applicationId: string;
  jobSeekerId: string;
  fullName: string;
  avatarUrl: string | null;
  creditScore: number;
  trustLevel: TrustLevel;
  averageRating: number;
  applicationStatus: 'pending' | 'accepted' | 'rejected';
}

export interface ReviewData {
  punctualityRating: number;
  attitudeRating: number;
  skillsRating: number;
  overallRating: number;
  comment: string;
}

export interface JobRecommendation {
  jobId: string;
  matchPercentage: number;
  matchFactors: {
    locationScore: number;
    scheduleScore: number;
    skillScore: number;
    employerTrustScore: number;
  };
}

export interface VerificationSubmission {
  type: 'job_seeker' | 'employer';
  documents: {
    idCardFront?: File;
    idCardBack?: File;
    selfie?: File;
    businessLicense?: File;
    businessPhoto?: File;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurrencePattern: 'weekly' | null;
}

export interface JobListing {
  id: string;
  title: string;
  description: string;
  jobCategory: string;
  numberOfPositions: number;
  workDate: string;
  startTime: string;
  endTime: string;
  hourlyWage: number;
  location: string;
  requirements: string;
  slug: string;
  status: JobStatus;
  employerVerificationStatus: VerificationStatus;
}
