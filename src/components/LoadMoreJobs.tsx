'use client';

import { useState, useTransition, useCallback, useEffect, useRef } from 'react';
import JobCard from '@/components/JobCard';
import FilterPanel from '@/components/FilterPanel';
import type { JobCardProps, FilterState } from '@/lib/types';

const PAGE_SIZE = 12;

interface LoadMoreJobsProps {
  initialJobs: JobCardProps[];
  totalCount: number;
}

const INITIAL_FILTERS: FilterState = {
  location: null,
  jobCategory: null,
  salaryRange: null,
  workDate: null,
  keyword: '',
};

function buildFilterParams(filters: FilterState): string {
  const params = new URLSearchParams();
  params.set('status', 'open');
  if (filters.location) params.set('location', filters.location);
  if (filters.jobCategory) params.set('jobCategory', filters.jobCategory);
  if (filters.salaryRange) {
    params.set('salaryMin', String(filters.salaryRange.min));
    params.set('salaryMax', String(filters.salaryRange.max));
  }
  if (filters.workDate) params.set('workDate', filters.workDate);
  if (filters.keyword.trim()) params.set('keyword', filters.keyword.trim());
  return params.toString();
}

function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.location !== null ||
    filters.jobCategory !== null ||
    filters.salaryRange !== null ||
    filters.workDate !== null ||
    filters.keyword.trim() !== ''
  );
}

export default function LoadMoreJobs({ initialJobs, totalCount }: LoadMoreJobsProps) {
  const [jobs, setJobs] = useState<JobCardProps[]>(initialJobs);
  const [matchingCount, setMatchingCount] = useState(totalCount);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [isPending, startTransition] = useTransition();
  const [isFiltering, setIsFiltering] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFilterActive = hasActiveFilters(filters);

  const hasMore = jobs.length < matchingCount;

  // Fetch jobs with current filters
  const fetchFilteredJobs = useCallback(
    async (currentFilters: FilterState, offset = 0, append = false) => {
      const params = buildFilterParams(currentFilters);
      const res = await fetch(
        `/api/jobs?${params}&limit=${PAGE_SIZE}&offset=${offset}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const newJobs: JobCardProps[] = (data.jobs ?? []).map(mapJobResponse);

      if (append) {
        setJobs((prev) => [...prev, ...newJobs]);
      } else {
        setJobs(newJobs);
      }
      setMatchingCount(data.totalCount ?? newJobs.length);
    },
    [],
  );

  // Handle filter changes with debounce for keyword, immediate for selects
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);

      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      const isKeywordChange = newFilters.keyword !== filters.keyword;
      const delay = isKeywordChange ? 300 : 0;

      setIsFiltering(true);
      debounceRef.current = setTimeout(() => {
        startTransition(async () => {
          await fetchFilteredJobs(newFilters);
          setIsFiltering(false);
        });
      }, delay);
    },
    [filters.keyword, fetchFilteredJobs],
  );

  // Reset to initial data when filters are cleared
  useEffect(() => {
    if (!isFilterActive) {
      setJobs(initialJobs);
      setMatchingCount(totalCount);
    }
  }, [isFilterActive, initialJobs, totalCount]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function loadMore() {
    startTransition(async () => {
      await fetchFilteredJobs(filters, jobs.length, true);
    });
  }

  return (
    <div>
      <FilterPanel
        filters={filters}
        onFilterChange={handleFilterChange}
        matchingCount={matchingCount}
      />

      {(isPending || isFiltering) && (
        <div className="mb-4 flex justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" role="status">
            <span className="sr-only">Đang tải...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard key={job.id} {...job} />
        ))}
      </div>

      {jobs.length === 0 && !isPending && !isFiltering && (
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="mt-3 text-base font-medium text-gray-600">
            Không tìm thấy việc làm phù hợp
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Thử mở rộng tiêu chí tìm kiếm hoặc xóa bộ lọc để xem thêm kết quả
          </p>
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white
              transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Đang tải...' : 'Xem thêm việc làm'}
          </button>
        </div>
      )}
    </div>
  );
}

function mapJobResponse(job: Record<string, unknown>): JobCardProps {
  return {
    id: job.id as string,
    title: job.title as string,
    employerName: (job.employer_name as string) ?? 'Nhà tuyển dụng',
    employerVerified: (job.employer_verified as boolean) ?? false,
    location: job.location as string,
    workDate: job.work_date as string,
    startTime: job.start_time as string,
    endTime: job.end_time as string,
    hourlyWage: job.hourly_wage as number,
    positionsAvailable: job.number_of_positions as number,
    slug: job.slug as string,
  };
}
