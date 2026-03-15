import {
  calculateLocationProximity,
  calculateScheduleOverlap,
  calculateSkillMatch,
  calculateEmployerTrust,
  calculateMatchPercentage,
  buildRecommendations,
} from '@/lib/matching';
import type { WorkerProfile, JobListing, AvailabilitySlot } from '@/lib/types';
import { JobStatus } from '@/lib/types';

describe('calculateLocationProximity', () => {
  it('returns 25 for exact match', () => {
    expect(calculateLocationProximity('Hải Châu', 'Hải Châu')).toBe(25);
  });

  it('returns 25 for case-insensitive match', () => {
    expect(calculateLocationProximity('hải châu', 'Hải Châu')).toBe(25);
  });

  it('returns 0 for different locations', () => {
    expect(calculateLocationProximity('Hải Châu', 'Sơn Trà')).toBe(0);
  });

  it('returns 0 for empty worker location', () => {
    expect(calculateLocationProximity('', 'Hải Châu')).toBe(0);
  });
});

describe('calculateScheduleOverlap', () => {
  it('returns 25 for full overlap', () => {
    const slots: AvailabilitySlot[] = [
      { date: '2024-06-15', startTime: '08:00', endTime: '17:00', isRecurring: false, recurrencePattern: null },
    ];
    expect(calculateScheduleOverlap(slots, '2024-06-15', '08:00', '17:00')).toBe(25);
  });

  it('returns 0 when no matching date', () => {
    const slots: AvailabilitySlot[] = [
      { date: '2024-06-14', startTime: '08:00', endTime: '17:00', isRecurring: false, recurrencePattern: null },
    ];
    expect(calculateScheduleOverlap(slots, '2024-06-15', '08:00', '17:00')).toBe(0);
  });

  it('returns proportional score for partial overlap', () => {
    const slots: AvailabilitySlot[] = [
      { date: '2024-06-15', startTime: '10:00', endTime: '14:00', isRecurring: false, recurrencePattern: null },
    ];
    // Job is 08:00–16:00 (8h), overlap is 10:00–14:00 (4h) → 4/8 * 25 ≈ 13
    expect(calculateScheduleOverlap(slots, '2024-06-15', '08:00', '16:00')).toBe(13);
  });

  it('returns 0 for empty availability', () => {
    expect(calculateScheduleOverlap([], '2024-06-15', '08:00', '17:00')).toBe(0);
  });
});

describe('calculateSkillMatch', () => {
  it('returns 25 when all requirements match', () => {
    expect(calculateSkillMatch(['phục vụ', 'giao tiếp'], 'phục vụ, giao tiếp')).toBe(25);
  });

  it('returns proportional score for partial match', () => {
    // 1 out of 2 requirements matched → 13
    expect(calculateSkillMatch(['phục vụ'], 'phục vụ, giao tiếp')).toBe(13);
  });

  it('returns 0 when no skills match', () => {
    expect(calculateSkillMatch(['lái xe'], 'phục vụ, giao tiếp')).toBe(0);
  });

  it('returns 0 for empty skills', () => {
    expect(calculateSkillMatch([], 'phục vụ')).toBe(0);
  });
});

describe('calculateEmployerTrust', () => {
  it('returns 25 for verified employer', () => {
    expect(calculateEmployerTrust('verified')).toBe(25);
  });

  it('returns 15 for pending employer', () => {
    expect(calculateEmployerTrust('pending')).toBe(15);
  });

  it('returns 0 for not_started', () => {
    expect(calculateEmployerTrust('not_started')).toBe(0);
  });

  it('returns 0 for rejected', () => {
    expect(calculateEmployerTrust('rejected')).toBe(0);
  });
});

describe('calculateMatchPercentage', () => {
  const baseWorker: WorkerProfile = {
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '2000-01-01',
    gender: 'male',
    avatarUrl: null,
    address: 'Đà Nẵng',
    currentLocation: 'Hải Châu',
    schoolName: null,
    major: null,
    skills: ['phục vụ', 'giao tiếp'],
    creditScore: 20,
    trustLevel: 'trustworthy',
    totalCompletedJobs: 5,
    averageRating: 4.5,
  };

  const baseJob: JobListing = {
    id: '1',
    title: 'Nhân viên phục vụ',
    description: 'Phục vụ sự kiện',
    jobCategory: 'Sự kiện',
    numberOfPositions: 5,
    workDate: '2024-06-15',
    startTime: '08:00',
    endTime: '17:00',
    hourlyWage: 30000,
    location: 'Hải Châu',
    requirements: 'phục vụ, giao tiếp',
    slug: 'nhan-vien-phuc-vu',
    status: JobStatus.OPEN,
    employerVerificationStatus: 'verified',
  };

  const baseAvailability: AvailabilitySlot[] = [
    { date: '2024-06-15', startTime: '08:00', endTime: '17:00', isRecurring: false, recurrencePattern: null },
  ];

  it('returns 100 for a perfect match', () => {
    expect(calculateMatchPercentage(baseWorker, baseJob, baseAvailability)).toBe(100);
  });

  it('returns a value between 0 and 100', () => {
    const score = calculateMatchPercentage(baseWorker, baseJob, []);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns lower score when location differs', () => {
    const worker = { ...baseWorker, currentLocation: 'Sơn Trà' };
    const score = calculateMatchPercentage(worker, baseJob, baseAvailability);
    expect(score).toBeLessThan(100);
  });
});


describe('buildRecommendations', () => {
  const baseWorker: WorkerProfile = {
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '2000-01-01',
    gender: 'male',
    avatarUrl: null,
    address: 'Đà Nẵng',
    currentLocation: 'Hải Châu',
    schoolName: null,
    major: null,
    skills: ['phục vụ', 'giao tiếp'],
    creditScore: 20,
    trustLevel: 'trustworthy',
    totalCompletedJobs: 5,
    averageRating: 4.5,
  };

  const makeJob = (overrides: Partial<JobListing & { id: string }> = {}): JobListing & { id: string } => ({
    id: '1',
    title: 'Nhân viên phục vụ',
    description: 'Phục vụ sự kiện',
    jobCategory: 'Sự kiện',
    numberOfPositions: 5,
    workDate: '2024-06-15',
    startTime: '08:00',
    endTime: '17:00',
    hourlyWage: 30000,
    location: 'Hải Châu',
    requirements: 'phục vụ, giao tiếp',
    slug: 'nhan-vien-phuc-vu',
    status: JobStatus.OPEN,
    employerVerificationStatus: 'verified',
    ...overrides,
  });

  const baseAvailability: AvailabilitySlot[] = [
    { date: '2024-06-15', startTime: '08:00', endTime: '17:00', isRecurring: false, recurrencePattern: null },
  ];

  it('returns only jobs with match >= 50%', () => {
    const highMatchJob = makeJob({ id: 'high', location: 'Hải Châu', employerVerificationStatus: 'verified' });
    // This job has different location + no schedule overlap + no skill match + not verified = 0
    const lowMatchJob = makeJob({
      id: 'low',
      location: 'Sơn Trà',
      workDate: '2024-06-20',
      requirements: 'lái xe',
      employerVerificationStatus: 'not_started',
    });

    const results = buildRecommendations(baseWorker, [highMatchJob, lowMatchJob], baseAvailability);

    expect(results.length).toBe(1);
    expect(results[0].jobId).toBe('high');
    expect(results[0].matchPercentage).toBeGreaterThanOrEqual(50);
  });

  it('sorts results by match percentage descending', () => {
    const perfectJob = makeJob({ id: 'perfect' });
    // Pending employer → 15 instead of 25, so total = 90
    const goodJob = makeJob({ id: 'good', employerVerificationStatus: 'pending' });

    const results = buildRecommendations(baseWorker, [goodJob, perfectJob], baseAvailability);

    expect(results.length).toBe(2);
    expect(results[0].jobId).toBe('perfect');
    expect(results[0].matchPercentage).toBeGreaterThanOrEqual(results[1].matchPercentage);
  });

  it('returns empty array when no jobs match >= 50%', () => {
    const badJob = makeJob({
      id: 'bad',
      location: 'Sơn Trà',
      workDate: '2024-06-20',
      requirements: 'lái xe',
      employerVerificationStatus: 'not_started',
    });

    const results = buildRecommendations(baseWorker, [badJob], baseAvailability);
    expect(results).toEqual([]);
  });

  it('includes correct matchFactors breakdown', () => {
    const job = makeJob();
    const results = buildRecommendations(baseWorker, [job], baseAvailability);

    expect(results.length).toBe(1);
    const factors = results[0].matchFactors;
    expect(factors.locationScore).toBe(25);
    expect(factors.scheduleScore).toBe(25);
    expect(factors.skillScore).toBe(25);
    expect(factors.employerTrustScore).toBe(25);
    expect(results[0].matchPercentage).toBe(100);
  });

  it('returns empty array when given no jobs', () => {
    const results = buildRecommendations(baseWorker, [], baseAvailability);
    expect(results).toEqual([]);
  });
});
