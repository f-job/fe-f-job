'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';

interface ApplicationItem {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  applied_at: string;
  job: {
    id: string;
    title: string;
    location: string;
    work_date: string;
    start_time: string;
    end_time: string;
    hourly_wage: number;
    slug: string;
    employer_name: string;
    employer_user_id?: string;
  };
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Đã chấp nhận', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Đã từ chối', className: 'bg-red-100 text-red-700' },
  completed: { label: 'Hoàn thành', className: 'bg-purple-100 text-purple-700' },
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const res = await fetch('/api/applications');
        if (!res.ok) {
          setError('Không thể tải danh sách đơn ứng tuyển.');
          return;
        }
        const data = await res.json();
        setApplications(data.applications ?? []);
      } catch {
        setError('Lỗi kết nối. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  }

  function formatWage(wage: number) {
    return new Intl.NumberFormat('vi-VN').format(wage) + 'đ/giờ';
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Đơn ứng tuyển của tôi</h1>
        <p className="mt-1 text-gray-600">Theo dõi trạng thái các đơn ứng tuyển</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Chưa có đơn ứng tuyển nào</p>
          <p className="text-sm">
            Hãy tìm việc phù hợp và ứng tuyển ngay!
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Tìm việc ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const badge = STATUS_BADGE[app.status];
            return (
              <div
                key={app.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/viec-lam/${app.job.slug}`}
                        className="font-semibold text-base hover:text-blue-600 hover:underline truncate"
                      >
                        {app.job.title}
                      </Link>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      🏢 {app.job.employer_name}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>📍 {app.job.location}</span>
                      <span>📅 {formatDate(app.job.work_date)}</span>
                      <span>🕐 {app.job.start_time} - {app.job.end_time}</span>
                      <span>💰 {formatWage(app.job.hourly_wage)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Ứng tuyển: {formatDate(app.applied_at)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link
                      href={`/viec-lam/${app.job.slug}`}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors inline-block"
                    >
                      Xem chi tiết
                    </Link>
                    {app.status === 'completed' && app.job.employer_user_id && (
                      <button
                        onClick={() =>
                          setReviewingId(reviewingId === app.id ? null : app.id)
                        }
                        className="ml-2 px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors inline-block"
                      >
                        Đánh giá
                      </button>
                    )}
                  </div>
                </div>
                {reviewingId === app.id && app.job.employer_user_id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <ReviewForm
                      applicationId={app.id}
                      revieweeId={app.job.employer_user_id}
                      reviewType="seeker_to_employer"
                      onSuccess={() => setReviewingId(null)}
                      onCancel={() => setReviewingId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
