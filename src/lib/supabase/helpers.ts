import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// Typed query helpers for each F-Job table.
// All helpers accept a SupabaseClient so they work with both
// the browser client and the server client.
// ============================================================

// --- Users ---

export interface UserRow {
  id: string;
  phone: string;
  email: string;
  password_hash: string;
  user_type: 'job_seeker' | 'employer';
  status: 'pending' | 'verified' | 'suspended';
  created_at: string;
  updated_at: string;
}

export async function getUserById(client: SupabaseClient, id: string) {
  return client.from('users').select('*').eq('id', id).single<UserRow>();
}

export async function getUserByPhone(client: SupabaseClient, phone: string) {
  return client.from('users').select('*').eq('phone', phone).single<UserRow>();
}

export async function getUserByEmail(client: SupabaseClient, email: string) {
  return client.from('users').select('*').eq('email', email).single<UserRow>();
}

export async function createUser(
  client: SupabaseClient,
  data: Omit<UserRow, 'id' | 'status' | 'created_at' | 'updated_at'>,
) {
  return client.from('users').insert(data).select().single<UserRow>();
}


// --- Job Seeker Profiles ---

export interface JobSeekerProfileRow {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  avatar_url: string | null;
  address: string | null;
  current_location: string | null;
  school_name: string | null;
  major: string | null;
  skills: string[];
  id_card_front_url: string | null;
  id_card_back_url: string | null;
  selfie_url: string | null;
  verification_status: 'not_started' | 'pending' | 'verified' | 'rejected';
  credit_score: number;
  created_at: string;
}

export async function getJobSeekerProfile(client: SupabaseClient, userId: string) {
  return client
    .from('job_seeker_profiles')
    .select('*')
    .eq('user_id', userId)
    .single<JobSeekerProfileRow>();
}

export async function createJobSeekerProfile(
  client: SupabaseClient,
  data: Omit<JobSeekerProfileRow, 'id' | 'verification_status' | 'credit_score' | 'created_at'>,
) {
  return client.from('job_seeker_profiles').insert(data).select().single<JobSeekerProfileRow>();
}

export async function updateJobSeekerProfile(
  client: SupabaseClient,
  userId: string,
  data: Partial<Omit<JobSeekerProfileRow, 'id' | 'user_id' | 'created_at'>>,
) {
  return client
    .from('job_seeker_profiles')
    .update(data)
    .eq('user_id', userId)
    .select()
    .single<JobSeekerProfileRow>();
}

// --- Employer Profiles ---

export interface EmployerProfileRow {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string | null;
  business_type: string | null;
  address: string | null;
  business_license_url: string | null;
  business_photo_url: string | null;
  verification_status: 'not_started' | 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export async function getEmployerProfile(client: SupabaseClient, userId: string) {
  return client
    .from('employer_profiles')
    .select('*')
    .eq('user_id', userId)
    .single<EmployerProfileRow>();
}

export async function createEmployerProfile(
  client: SupabaseClient,
  data: Omit<EmployerProfileRow, 'id' | 'verification_status' | 'created_at'>,
) {
  return client.from('employer_profiles').insert(data).select().single<EmployerProfileRow>();
}

export async function updateEmployerProfile(
  client: SupabaseClient,
  userId: string,
  data: Partial<Omit<EmployerProfileRow, 'id' | 'user_id' | 'created_at'>>,
) {
  return client
    .from('employer_profiles')
    .update(data)
    .eq('user_id', userId)
    .select()
    .single<EmployerProfileRow>();
}


// --- Jobs ---

export interface JobRow {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  job_category: string;
  number_of_positions: number;
  work_date: string;
  start_time: string;
  end_time: string;
  hourly_wage: number;
  location: string;
  requirements: string | null;
  slug: string;
  status: 'open' | 'filled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export async function getJobs(
  client: SupabaseClient,
  options?: { status?: string; employerId?: string; limit?: number; offset?: number },
) {
  let query = client.from('jobs').select('*');
  if (options?.status) query = query.eq('status', options.status);
  if (options?.employerId) query = query.eq('employer_id', options.employerId);
  query = query.order('created_at', { ascending: false });
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1);
  return query.returns<JobRow[]>();
}

export async function getJobBySlug(client: SupabaseClient, slug: string) {
  return client.from('jobs').select('*').eq('slug', slug).single<JobRow>();
}

export async function getJobById(client: SupabaseClient, id: string) {
  return client.from('jobs').select('*').eq('id', id).single<JobRow>();
}

export async function createJob(
  client: SupabaseClient,
  data: Omit<JobRow, 'id' | 'status' | 'created_at' | 'updated_at'>,
) {
  return client.from('jobs').insert(data).select().single<JobRow>();
}

export async function updateJob(
  client: SupabaseClient,
  id: string,
  data: Partial<Omit<JobRow, 'id' | 'employer_id' | 'created_at' | 'updated_at'>>,
) {
  return client.from('jobs').update(data).eq('id', id).select().single<JobRow>();
}

// --- Availabilities ---

export interface AvailabilityRow {
  id: string;
  job_seeker_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_pattern: 'weekly' | null;
  created_at: string;
}

export async function getAvailabilities(client: SupabaseClient, jobSeekerId: string) {
  return client
    .from('availabilities')
    .select('*')
    .eq('job_seeker_id', jobSeekerId)
    .order('date', { ascending: true })
    .returns<AvailabilityRow[]>();
}

export async function createAvailability(
  client: SupabaseClient,
  data: Omit<AvailabilityRow, 'id' | 'created_at'>,
) {
  return client.from('availabilities').insert(data).select().single<AvailabilityRow>();
}

export async function deleteAvailability(client: SupabaseClient, id: string) {
  return client.from('availabilities').delete().eq('id', id);
}


// --- Applications ---

export interface ApplicationRow {
  id: string;
  job_id: string;
  job_seeker_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  applied_at: string;
  updated_at: string;
}

export async function getApplicationsByJob(client: SupabaseClient, jobId: string) {
  return client
    .from('applications')
    .select('*')
    .eq('job_id', jobId)
    .order('applied_at', { ascending: false })
    .returns<ApplicationRow[]>();
}

export async function getApplicationsByJobSeeker(client: SupabaseClient, jobSeekerId: string) {
  return client
    .from('applications')
    .select('*')
    .eq('job_seeker_id', jobSeekerId)
    .order('applied_at', { ascending: false })
    .returns<ApplicationRow[]>();
}

export async function createApplication(
  client: SupabaseClient,
  data: Omit<ApplicationRow, 'id' | 'status' | 'applied_at' | 'updated_at'>,
) {
  return client.from('applications').insert(data).select().single<ApplicationRow>();
}

export async function updateApplicationStatus(
  client: SupabaseClient,
  id: string,
  status: ApplicationRow['status'],
) {
  return client.from('applications').update({ status }).eq('id', id).select().single<ApplicationRow>();
}

// --- Reviews ---

export interface ReviewRow {
  id: string;
  application_id: string;
  reviewer_id: string;
  reviewee_id: string;
  punctuality_rating: number;
  attitude_rating: number;
  skills_rating: number;
  overall_rating: number;
  comment: string | null;
  review_type: 'employer_to_seeker' | 'seeker_to_employer';
  created_at: string;
}

export async function getReviewsByUser(client: SupabaseClient, revieweeId: string) {
  return client
    .from('reviews')
    .select('*')
    .eq('reviewee_id', revieweeId)
    .order('created_at', { ascending: false })
    .returns<ReviewRow[]>();
}

export async function createReview(
  client: SupabaseClient,
  data: Omit<ReviewRow, 'id' | 'created_at'>,
) {
  return client.from('reviews').insert(data).select().single<ReviewRow>();
}

// --- Credit Score History ---

export interface CreditScoreHistoryRow {
  id: string;
  user_id: string;
  score_change: number;
  reason: string;
  application_id: string | null;
  created_at: string;
}

export async function getCreditScoreHistory(client: SupabaseClient, userId: string) {
  return client
    .from('credit_score_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .returns<CreditScoreHistoryRow[]>();
}

export async function createCreditScoreEntry(
  client: SupabaseClient,
  data: Omit<CreditScoreHistoryRow, 'id' | 'created_at'>,
) {
  return client.from('credit_score_history').insert(data).select().single<CreditScoreHistoryRow>();
}

// --- Favorite Workers ---

export interface FavoriteWorkerRow {
  id: string;
  employer_id: string;
  job_seeker_id: string;
  created_at: string;
}

export async function getFavoriteWorkers(client: SupabaseClient, employerId: string) {
  return client
    .from('favorite_workers')
    .select('*')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
    .returns<FavoriteWorkerRow[]>();
}

export async function addFavoriteWorker(
  client: SupabaseClient,
  data: Omit<FavoriteWorkerRow, 'id' | 'created_at'>,
) {
  return client.from('favorite_workers').insert(data).select().single<FavoriteWorkerRow>();
}

export async function removeFavoriteWorker(
  client: SupabaseClient,
  employerId: string,
  jobSeekerId: string,
) {
  return client
    .from('favorite_workers')
    .delete()
    .eq('employer_id', employerId)
    .eq('job_seeker_id', jobSeekerId);
}
