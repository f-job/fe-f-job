'use client';

import { useState, useEffect } from 'react';
import JobCard from '@/components/JobCard';
import type { JobCardProps, JobRecommendation } from '@/lib/types';

interface RecommendedJobsProps {
  /** Pre-fetched session info passed from the server component */
  userType: string | null;
}

interface RecommendationWithJob extends JobRecommendation {
  job: JobCardProps;
}

export default function RecommendedJobs({ userType }: RecommendedJobsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationWithJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isJobSeeker = userType === 'job_seeker';

  useEffect(() => {
    if (!isJobSeeker) return;

    let cancelled = false;

    async function fetchRecommendations() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch recommendations from AI endpoint
        const recRes = await fetch('/api/ai/recommendations');
        if (!recRes.ok) {
          // 401/403 means not authenticated or not a job seeker — silently hide section
          if (recRes.status === 401 || recRes.status === 403) {
            setRecommendations([]);
            return;
          }
          throw new Error('Không thể tải gợi ý việc làm');
        }

        const recData = await recRes.json();
        const recs: JobRecommendation[] = recData.recommendations ?? [];

        if (recs.length === 0) {
          setRecommendations([]);
          return;
        }

        // 2. Fetch job details for each recommended job
        const jobIds = recs.map((r) => r.jobId);
        const jobsRes = await fetch(`/api/jobs?ids=${jobIds.join(',')}&limit=${jobIds.length}`);
        let jobMap: Record<string, JobCardProps> = {};

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const jobs: Record<string, unknown>[] = jobsData.jobs ?? [];
          jobMap = Object.fromEntries(
            jobs.map((j) => [
              j.id as string,
              {
                id: j.id as string,
                title: j.title as string,
                employerName: (j.employer_name as string) ?? 'Nhà tuyển dụng',
                employerVerified: (j.employer_verified as boolean) ?? false,
                location: j.location as string,
                workDate: j.work_date as string,
                startTime: j.start_time as string,
                endTime: j.end_time as string,
                hourlyWage: j.hourly_wage as number,
                positionsAvailable: j.number_of_positions as number,
                slug: j.slug as string,
              } satisfies JobCardProps,
            ]),
          );
        }

        if (cancelled) return;

        // 3. Merge recommendations with job data
        const merged: RecommendationWithJob[] = recs
          .filter((r) => jobMap[r.jobId])
          .map((r) => ({
            ...r,
            job: { ...jobMap[r.jobId], matchPercentage: r.matchPercentage },
          }));

        setRecommendations(merged);
      } catch {
        if (!cancelled) {
          setError('Không thể tải gợi ý việc làm. Vui lòng thử lại sau.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      cancelled = true;
    };
  }, [isJobSeeker]);

  // Don't render anything if not a job seeker
  if (!isJobSeeker) return null;

  // Don't render if no recommendations and not loading
  if (!isLoading && !error && recommendations.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        Gợi ý dành cho bạn
      </h2>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div
            className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent"
            role="status"
          >
            <span className="sr-only">Đang tải gợi ý...</span>
          </div>
        </div>
      )}

      {error && (
        <p className="py-4 text-center text-sm text-red-500">{error}</p>
      )}

      {!isLoading && !error && recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => (
            <JobCard key={rec.jobId} {...rec.job} />
          ))}
        </div>
      )}
    </section>
  );
}
