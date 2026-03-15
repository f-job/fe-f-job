'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  activeListings: number;
  totalApplicants: number;
  completedJobs: number;
  averageWorkerRating: number;
}

const STAT_CARDS: {
  key: keyof DashboardStats;
  label: string;
  icon: string;
  format: (v: number) => string;
  color: string;
}[] = [
  {
    key: 'activeListings',
    label: 'Tin đang tuyển',
    icon: '📋',
    format: (v) => String(v),
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'totalApplicants',
    label: 'Tổng ứng viên',
    icon: '👥',
    format: (v) => String(v),
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  {
    key: 'completedJobs',
    label: 'Việc hoàn thành',
    icon: '✅',
    format: (v) => String(v),
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    key: 'averageWorkerRating',
    label: 'Đánh giá TB',
    icon: '⭐',
    format: (v) => (v > 0 ? v.toFixed(1) : '—'),
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
];

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    totalApplicants: 0,
    completedJobs: 0,
    averageWorkerRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) {
          setError('Không thể tải dữ liệu tổng quan');
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch {
        setError('Lỗi kết nối. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="mt-1 text-gray-600">Quản lý hoạt động tuyển dụng của bạn</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className={`border rounded-lg p-4 ${card.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{card.label}</span>
              <span className="text-xl">{card.icon}</span>
            </div>
            {loading ? (
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold">{card.format(stats[card.key])}</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/dang-tin"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">➕</span>
            <div>
              <p className="font-medium text-sm">Đăng tin mới</p>
              <p className="text-xs text-gray-500">Tạo bài đăng tuyển dụng</p>
            </div>
          </Link>
          <Link
            href="/dashboard/viec-lam"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <div>
              <p className="font-medium text-sm">Quản lý việc làm</p>
              <p className="text-xs text-gray-500">Xem và chỉnh sửa tin đăng</p>
            </div>
          </Link>
          <Link
            href="/dashboard/yeu-thich"
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl">❤️</span>
            <div>
              <p className="font-medium text-sm">Ứng viên yêu thích</p>
              <p className="text-xs text-gray-500">Danh sách đã lưu</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
