import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getJobs } from '@/lib/supabase/helpers';
import { getSession } from '@/lib/session';
import type { JobCardProps } from '@/lib/types';
import LoadMoreJobs from '@/components/LoadMoreJobs';
import RecommendedJobs from '@/components/RecommendedJobs';
import HeroSearch from '@/components/HeroSearch';
import LocationTabs from '@/components/LocationTabs';

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
  const [seekersResult, employersResult, completedResult, openResult] = await Promise.all([
    client.from('job_seeker_profiles').select('id', { count: 'exact', head: true }),
    client.from('employer_profiles').select('id', { count: 'exact', head: true }),
    client.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    client.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);

  return {
    totalSeekers: seekersResult.count ?? 0,
    totalEmployers: employersResult.count ?? 0,
    completedJobs: completedResult.count ?? 0,
    openJobs: openResult.count ?? 0,
  };
}

async function getTotalOpenJobs(client: ReturnType<typeof createServerSupabaseClient>) {
  const { count } = await client
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open');
  return count ?? 0;
}

const POPULAR_CATEGORIES = [
  { label: 'Phục vụ sự kiện', icon: '🎪' },
  { label: 'Nhà hàng/Khách sạn', icon: '🍽️' },
  { label: 'Bán hàng', icon: '🛒' },
  { label: 'Truyền thông', icon: '📢' },
  { label: 'Hành chính', icon: '📋' },
  { label: 'Kho vận', icon: '📦' },
];

export default async function LandingPage() {
  const client = createServerSupabaseClient();

  const [featuredJobs, stats, totalOpenJobs, session] = await Promise.all([
    getFeaturedJobs(client),
    getStatistics(client),
    getTotalOpenJobs(client),
    getSession(),
  ]);

  const today = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-blue-400 pb-6 pt-28 sm:pt-32">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <h1 className="mb-6 text-center text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            F-Job - Tìm việc làm thời vụ, Tuyển dụng hiệu quả
          </h1>

          {/* Search Bar */}
          <HeroSearch />

          {/* Hero Content Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left: Popular Categories */}
            <div className="rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur lg:col-span-3">
              <h3 className="mb-3 text-sm font-bold text-gray-700">Danh mục phổ biến</h3>
              <ul className="space-y-1">
                {POPULAR_CATEGORIES.map((cat) => (
                  <li key={cat.label}>
                    <Link
                      href={`/viec-lam?category=${encodeURIComponent(cat.label)}`}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <svg className="ml-auto h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Center: Banner */}
            <div className="flex flex-col gap-4 lg:col-span-6">
              <div className="relative flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-primary-700 to-blue-600 p-6 text-white shadow-lg sm:p-8">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold sm:text-2xl">Tiếp lợi thế,<br />nối thành công</h2>
                  <p className="mt-2 max-w-sm text-sm text-primary-100">
                    F-Job - Hệ sinh thái kết nối việc làm thời vụ hàng đầu tại Đà Nẵng
                  </p>
                  <Link
                    href="/dang-ky/nguoi-tim-viec"
                    className="mt-4 inline-flex items-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-primary-700 shadow transition-colors hover:bg-primary-50"
                  >
                    Tìm việc ngay
                    <svg className="ml-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
                {/* Decorative circles */}
                <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-6 -right-2 h-28 w-28 rounded-full bg-white/5" />
              </div>
            </div>

            {/* Right: Stats Card */}
            <div className="flex flex-col gap-4 lg:col-span-3">
              <div className="rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
                    📊 Thị trường việc làm
                  </span>
                  <span className="text-xs text-gray-400">{today}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Việc đang tuyển</span>
                    <span className="text-lg font-bold text-primary-600">{stats.openJobs.toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Việc đã hoàn thành</span>
                    <span className="text-lg font-bold text-green-600">{stats.completedJobs.toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Người tìm việc</span>
                    <span className="text-lg font-bold text-blue-600">{stats.totalSeekers.toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Nhà tuyển dụng</span>
                    <span className="text-lg font-bold text-orange-500">{stats.totalEmployers.toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Jobs (authenticated job seekers only) */}
      <RecommendedJobs userType={session?.userType ?? null} />

      {/* Job Listings Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Việc làm tốt nhất
          </h2>
          <Link href="/viec-lam" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
            Xem tất cả →
          </Link>
        </div>

        {/* Location filter tabs */}
        <LocationTabs />

        {/* Hint */}
        <div className="mb-5 flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Gợi ý: Bấm vào tiêu đề việc làm để xem thêm thông tin chi tiết</span>
        </div>

        <LoadMoreJobs initialJobs={featuredJobs} totalCount={totalOpenJobs} />
      </section>
    </main>
  );
}
