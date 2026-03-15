import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getJobs } from '@/lib/supabase/helpers';
import { getSession } from '@/lib/session';
import type { JobCardProps } from '@/lib/types';
import LoadMoreJobs from '@/components/LoadMoreJobs';
import RecommendedJobs from '@/components/RecommendedJobs';

// --- SEO Meta Tags ---
export const metadata: Metadata = {
  title: 'F-Job - Tìm việc làm thời vụ tại Đà Nẵng',
  description:
    'Nền tảng kết nối việc làm thời vụ hàng đầu Đà Nẵng. Tìm việc nhanh, uy tín, an toàn cho sinh viên và người lao động.',
  openGraph: {
    title: 'F-Job - Tìm việc làm thời vụ tại Đà Nẵng',
    description:
      'Nền tảng kết nối việc làm thời vụ hàng đầu Đà Nẵng. Tìm việc nhanh, uy tín, an toàn cho sinh viên và người lao động.',
    locale: 'vi_VN',
    type: 'website',
    siteName: 'F-Job',
  },
  keywords: ['việc làm thời vụ', 'tìm việc Đà Nẵng', 'việc làm sự kiện', 'sinh viên tìm việc'],
};

const PAGE_SIZE = 12;

// --- Data Fetching ---
async function getFeaturedJobs(client: ReturnType<typeof createServerSupabaseClient>) {
  const { data, error } = await getJobs(client, { status: 'open', limit: PAGE_SIZE, offset: 0 });
  if (error || !data) return [];

  const employerIds = [...new Set(data.map((j) => j.employer_id))];
  let employerMap: Record<string, { business_name: string; verification_status: string }> = {};

  if (employerIds.length > 0) {
    const { data: employers } = await client
      .from('employer_profiles')
      .select('user_id, business_name, verification_status')
      .in('user_id', employerIds);

    if (employers) {
      employerMap = Object.fromEntries(
        employers.map((e) => [
          e.user_id,
          { business_name: e.business_name, verification_status: e.verification_status },
        ]),
      );
    }
  }

  return data.map((job): JobCardProps => {
    const employer = employerMap[job.employer_id];
    return {
      id: job.id,
      title: job.title,
      employerName: employer?.business_name ?? 'Nhà tuyển dụng',
      employerVerified: employer?.verification_status === 'verified',
      location: job.location,
      workDate: job.work_date,
      startTime: job.start_time,
      endTime: job.end_time,
      hourlyWage: job.hourly_wage,
      positionsAvailable: job.number_of_positions,
      slug: job.slug,
    };
  });
}

async function getStatistics(client: ReturnType<typeof createServerSupabaseClient>) {
  const [seekersResult, employersResult, completedResult] = await Promise.all([
    client.from('job_seeker_profiles').select('id', { count: 'exact', head: true }),
    client.from('employer_profiles').select('id', { count: 'exact', head: true }),
    client.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  return {
    totalSeekers: seekersResult.count ?? 0,
    totalEmployers: employersResult.count ?? 0,
    completedJobs: completedResult.count ?? 0,
  };
}

async function getTotalOpenJobs(client: ReturnType<typeof createServerSupabaseClient>) {
  const { count } = await client
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');
  return count ?? 0;
}

// --- Page Component ---
export default async function LandingPage() {
  const client = createServerSupabaseClient();

  const [featuredJobs, stats, totalOpenJobs, session] = await Promise.all([
    getFeaturedJobs(client),
    getStatistics(client),
    getTotalOpenJobs(client),
    getSession(),
  ]);

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Statistics Section */}
      <StatisticsSection
        totalSeekers={stats.totalSeekers}
        totalEmployers={stats.totalEmployers}
        completedJobs={stats.completedJobs}
      />

      {/* Recommended Jobs Section (only for authenticated Job Seekers) */}
      <RecommendedJobs userType={session?.userType ?? null} />

      {/* Job Listings Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          Việc làm mới nhất
        </h2>
        <LoadMoreJobs initialJobs={featuredJobs} totalCount={totalOpenJobs} />
      </section>
    </main>
  );
}

// --- HeroSection ---
function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-16 text-center text-white sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Kết nối việc làm thời vụ
          <br />
          nhanh chóng và uy tín
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-primary-100 sm:mt-6 sm:text-lg">
          F-Job giúp sinh viên và người lao động tìm việc thời vụ tại Đà Nẵng.
          Nhà tuyển dụng dễ dàng tìm người phù hợp cho sự kiện của bạn.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/dang-ky/nguoi-tim-viec"
            className="inline-flex w-full items-center justify-center rounded-lg bg-white px-6 py-3
              text-sm font-semibold text-primary-700 shadow-sm transition-colors
              hover:bg-primary-50 sm:w-auto sm:text-base"
          >
            Tìm Việc Ngay
          </Link>
          <Link
            href="/dang-ky/nha-tuyen-dung"
            className="inline-flex w-full items-center justify-center rounded-lg border-2 border-white
              px-6 py-3 text-sm font-semibold text-white transition-colors
              hover:bg-white/10 sm:w-auto sm:text-base"
          >
            Tuyển Người
          </Link>
        </div>
      </div>
    </section>
  );
}

// --- Statistics Section ---
function StatisticsSection({
  totalSeekers,
  totalEmployers,
  completedJobs,
}: {
  totalSeekers: number;
  totalEmployers: number;
  completedJobs: number;
}) {
  const stats = [
    { label: 'Người tìm việc', value: totalSeekers, icon: UserIcon },
    { label: 'Nhà tuyển dụng', value: totalEmployers, icon: BuildingIcon },
    { label: 'Việc đã hoàn thành', value: completedJobs, icon: CheckIcon },
  ];

  return (
    <section className="border-b border-gray-100 bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center rounded-xl bg-white p-6 shadow-sm"
          >
            <stat.icon />
            <span className="mt-3 text-2xl font-bold text-primary-700 sm:text-3xl">
              {stat.value.toLocaleString('vi-VN')}
            </span>
            <span className="mt-1 text-sm text-gray-500">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Icons ---
function UserIcon() {
  return (
    <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
