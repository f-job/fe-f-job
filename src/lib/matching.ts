import type { WorkerProfile, JobListing, AvailabilitySlot, VerificationStatus } from './types';

/**
 * Calculates how close two location strings match (0–25).
 * Exact match → 25, otherwise 0.
 */
export function calculateLocationProximity(
  workerLocation: string,
  jobLocation: string,
): number {
  if (!workerLocation || !jobLocation) return 0;
  const normalize = (s: string) => s.trim().toLowerCase();
  return normalize(workerLocation) === normalize(jobLocation) ? 25 : 0;
}

/**
 * Calculates schedule overlap between worker availability and a job's date/time (0–25).
 * Full overlap → 25, partial overlap → proportional, no overlap → 0.
 */
export function calculateScheduleOverlap(
  availability: AvailabilitySlot[],
  jobDate: string,
  jobStart: string,
  jobEnd: string,
): number {
  if (!availability.length || !jobDate || !jobStart || !jobEnd) return 0;

  const matchingSlot = availability.find((slot) => slot.date === jobDate);
  if (!matchingSlot) return 0;

  const toMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const slotStart = toMinutes(matchingSlot.startTime);
  const slotEnd = toMinutes(matchingSlot.endTime);
  const jStart = toMinutes(jobStart);
  const jEnd = toMinutes(jobEnd);

  const overlapStart = Math.max(slotStart, jStart);
  const overlapEnd = Math.min(slotEnd, jEnd);
  const overlap = Math.max(0, overlapEnd - overlapStart);

  const jobDuration = jEnd - jStart;
  if (jobDuration <= 0) return 0;

  return Math.round((overlap / jobDuration) * 25);
}


/**
 * Calculates how well a worker's skills match the job requirements (0–25).
 * Score is proportional to the fraction of required keywords found in worker skills.
 */
export function calculateSkillMatch(
  workerSkills: string[],
  jobRequirements: string,
): number {
  if (!workerSkills.length || !jobRequirements) return 0;

  const normalize = (s: string) => s.trim().toLowerCase();
  const normalizedSkills = workerSkills.map(normalize);

  const requirementWords = jobRequirements
    .toLowerCase()
    .split(/[,;.\n]+/)
    .map((w) => w.trim())
    .filter(Boolean);

  if (requirementWords.length === 0) return 0;

  const matched = requirementWords.filter((req) =>
    normalizedSkills.some(
      (skill) => skill.includes(req) || req.includes(skill),
    ),
  );

  return Math.round((matched.length / requirementWords.length) * 25);
}

/**
 * Calculates employer trust score based on verification status (0–25).
 * Verified → 25, Pending → 15, Not started / Rejected → 0.
 */
export function calculateEmployerTrust(
  verificationStatus: VerificationStatus,
): number {
  switch (verificationStatus) {
    case 'verified':
      return 25;
    case 'pending':
      return 15;
    default:
      return 0;
  }
}

/**
 * Calculates the overall match percentage (0–100) between a job seeker and a job.
 *
 * Components (each 0–25):
 *   - Location proximity
 *   - Schedule overlap
 *   - Skill match
 *   - Employer trust
 */
export function calculateMatchPercentage(
  jobSeeker: WorkerProfile,
  job: JobListing,
  availability: AvailabilitySlot[],
): number {
  const locationScore = calculateLocationProximity(
    jobSeeker.currentLocation,
    job.location,
  );
  const scheduleScore = calculateScheduleOverlap(
    availability,
    job.workDate,
    job.startTime,
    job.endTime,
  );
  const skillScore = calculateSkillMatch(jobSeeker.skills, job.requirements);
  const trustScore = calculateEmployerTrust(job.employerVerificationStatus);

  return locationScore + scheduleScore + skillScore + trustScore;
}

/**
 * Builds a full list of job recommendations for a given job seeker.
 *
 * Steps:
 *  1. Fetch the seeker's profile and availability slots
 *  2. Fetch all open jobs (with employer verification status)
 *  3. Score each job using calculateMatchPercentage
 *  4. Filter to match >= 50%
 *  5. Sort descending by match percentage
 */
export interface RecommendationResult {
  jobId: string;
  matchPercentage: number;
  matchFactors: {
    locationScore: number;
    scheduleScore: number;
    skillScore: number;
    employerTrustScore: number;
  };
}

export function buildRecommendations(
  jobSeeker: WorkerProfile,
  jobs: Array<JobListing & { id: string }>,
  availability: AvailabilitySlot[],
): RecommendationResult[] {
  const results: RecommendationResult[] = [];

  for (const job of jobs) {
    const locationScore = calculateLocationProximity(jobSeeker.currentLocation, job.location);
    const scheduleScore = calculateScheduleOverlap(availability, job.workDate, job.startTime, job.endTime);
    const skillScore = calculateSkillMatch(jobSeeker.skills, job.requirements);
    const employerTrustScore = calculateEmployerTrust(job.employerVerificationStatus);
    const matchPercentage = locationScore + scheduleScore + skillScore + employerTrustScore;

    if (matchPercentage >= 50) {
      results.push({
        jobId: job.id,
        matchPercentage,
        matchFactors: {
          locationScore,
          scheduleScore,
          skillScore,
          employerTrustScore,
        },
      });
    }
  }

  results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return results;
}

