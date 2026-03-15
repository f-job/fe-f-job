import Link from 'next/link';
import type { JobCardProps } from '@/lib/types';

function formatWage(wage: number): string {
  return `${wage.toLocaleString('vi-VN')}đ/giờ`;
}

function formatWorkDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const day = dayNames[date.getDay()];
  return `${day}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

export default function JobCard({
  title,
  employerName,
  employerVerified,
  location,
  workDate,
  startTime,
  endTime,
  hourlyWage,
  positionsAvailable,
  slug,
  matchPercentage,
}: JobCardProps) {
  return (
    <Link
      href={`/viec-lam/${slug}`}
      className="relative block rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow
        hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        sm:p-5"
      aria-label={`Xem chi tiết: ${title}`}
    >
      {/* Match percentage badge */}
      {matchPercentage != null && (
        <span
          className="absolute -top-2 -right-2 z-10 inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white shadow"
          aria-label={`Phù hợp ${matchPercentage}%`}
        >
          {matchPercentage}% phù hợp
        </span>
      )}

      {/* Wage badge */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-gray-900 line-clamp-2 sm:text-lg">
          {title}
        </h3>
        <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 sm:text-sm">
          {formatWage(hourlyWage)}
        </span>
      </div>

      {/* Employer */}
      <div className="mb-2 flex items-center gap-1.5 text-sm text-gray-600">
        <span className="truncate">{employerName}</span>
        {employerVerified && (
          <span
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-green-100 p-0.5"
            title="Đã xác minh"
            aria-label="Nhà tuyển dụng đã xác minh"
          >
            <svg
              className="h-3.5 w-3.5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </div>

      {/* Details grid */}
      <div className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-gray-500 xs:grid-cols-2">
        {/* Location */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{location}</span>
        </div>

        {/* Work date */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatWorkDate(workDate)}</span>
        </div>

        {/* Time range */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTimeRange(startTime, endTime)}</span>
        </div>

        {/* Positions */}
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{positionsAvailable} vị trí</span>
        </div>
      </div>
    </Link>
  );
}
