import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getJobBySlug, type EmployerProfileRow } from '@/lib/supabase/helpers';
import ApplyButton from '@/components/ApplyButton';

// --- Helpers ---

function formatWage(wage: number): string {
  return `${wage.toLocaleString('vi-VN')}đ/giờ`;
}

function formatWorkDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const day = dayNames[date.getDay()];
  return `${day}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

// --- Data Fetching ---

async function getJobData(slug: string) {
  const client = createServerSupabaseClient();
  const { data: job, error } = await getJobBySlug(client, slug);
  if (error || !job) return null;

  const { data: employer } = await client
    .from('employer_profiles')
    .select('business_name, verification_status, business_type, address')
    .eq('user_id', job.employer_id)
    .single<Pick<EmployerProfileRow, 'business_name' | 'verification_status' | 'business_type' | 'address'>>();

  return { job, employer };
}

// --- Dynamic Metadata ---

interface JobDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: JobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getJobData(slug);

  if (!data) {
    return {
      title: 'Không tìm thấy việc làm - F-Job',
      description: 'Việc làm bạn tìm kiếm không tồn tại hoặc đã bị xóa.',
    };
  }

  const { job } = data;
  const description = job.description.length > 160
    ? job.description.slice(0, 157) + '...'
    : job.description;

  return {
    title: `${job.title} - F-Job`,
    description,
    openGraph: {
      title: `${job.title} - F-Job`,
      description,
      locale: 'vi_VN',
      type: 'article',
      siteName: 'F-Job',
    },
  };
}


// --- Page Component ---

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;
  const data = await getJobData(slug);

  if (!data) {
    notFound();
  }

  const { job, employer } = data;
  const employerName = employer?.business_name ?? 'Nhà tuyển dụng';
  const employerVerified = employer?.verification_status === 'verified';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Back link */}
      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách việc làm
        </Link>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{job.title}</h1>

          {/* Employer info */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-base text-gray-700 sm:text-lg">{employerName}</span>
            {employerVerified && (
              <span
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-green-100 p-0.5"
                title="Đã xác minh"
                aria-label="Nhà tuyển dụng đã xác minh"
              >
                <svg
                  className="h-4 w-4 text-green-600"
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

          {/* Job details grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              icon={<LocationIcon />}
              label="Địa điểm"
              value={job.location}
            />
            <DetailItem
              icon={<CalendarIcon />}
              label="Ngày làm việc"
              value={formatWorkDate(job.work_date)}
            />
            <DetailItem
              icon={<ClockIcon />}
              label="Thời gian"
              value={formatTimeRange(job.start_time, job.end_time)}
            />
            <DetailItem
              icon={<WageIcon />}
              label="Lương"
              value={formatWage(job.hourly_wage)}
              highlight
            />
          </div>

          {/* Positions available */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <UsersIcon />
            <span>
              <span className="font-semibold text-gray-900">{job.number_of_positions}</span> vị trí đang tuyển
            </span>
          </div>
        </div>

        {/* Job description */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Mô tả công việc</h2>
          <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700 sm:text-base">
            {job.description}
          </div>
        </section>

        {/* Requirements */}
        {job.requirements && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Yêu cầu</h2>
            <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700 sm:text-base">
              {job.requirements}
            </div>
          </section>
        )}

        {/* Employer info section */}
        {employer && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Thông tin nhà tuyển dụng</h2>
            <div className="mt-3 space-y-2 text-sm text-gray-700 sm:text-base">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500">Tên doanh nghiệp:</span>
                <span>{employer.business_name}</span>
                {employerVerified && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Đã xác minh
                  </span>
                )}
              </div>
              {employer.business_type && (
                <div>
                  <span className="font-medium text-gray-500">Loại hình:</span>{' '}
                  <span>{employer.business_type}</span>
                </div>
              )}
              {employer.address && (
                <div>
                  <span className="font-medium text-gray-500">Địa chỉ:</span>{' '}
                  <span>{employer.address}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Apply button */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ApplyButton jobId={job.id} />
        </div>
      </article>
    </main>
  );
}


// --- Sub-components ---

function DetailItem({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
      <div className="shrink-0 text-gray-400">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? 'text-primary-700' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

// --- Icons ---

function LocationIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function WageIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
