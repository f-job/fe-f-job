'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { TrustLevel } from '@/lib/types';
import { getTrustLevel } from '@/lib/creditScore';

interface FavoriteWorker {
  id: string;
  jobSeekerId: string;
  createdAt: string;
  fullName: string;
  avatarUrl: string | null;
  creditScore: number;
  skills: string[];
  currentLocation: string;
  averageRating: number;
}

const TRUST_LEVEL_BADGE: Record<TrustLevel, { label: string; className: string }> = {
  new: { label: 'Mới', className: 'bg-gray-100 text-gray-600' },
  trustworthy: { label: 'Đáng tin', className: 'bg-blue-100 text-blue-700' },
  reputable: { label: 'Uy tín', className: 'bg-green-100 text-green-700' },
  excellent: { label: 'Xuất sắc', className: 'bg-purple-100 text-purple-700' },
  top_worker: { label: 'Top Worker', className: 'bg-yellow-100 text-yellow-700' },
};

export default function FavoriteWorkersPage() {
  const [favorites, setFavorites] = useState<FavoriteWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/favorites');
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Không thể tải danh sách yêu thích.');
        return;
      }
      const data = await res.json();
      setFavorites(data.favorites ?? []);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  async function handleRemove(jobSeekerId: string) {
    setRemovingId(jobSeekerId);
    try {
      const res = await fetch(`/api/favorites?jobSeekerId=${jobSeekerId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        alert('Không thể xóa ứng viên khỏi danh sách yêu thích.');
        return;
      }
      setFavorites((prev) => prev.filter((f) => f.jobSeekerId !== jobSeekerId));
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setRemovingId(null);
    }
  }

  function formatRating(rating: number) {
    return rating > 0 ? rating.toFixed(1) : '—';
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Quay lại Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Ứng viên yêu thích</h1>
        <p className="mt-1 text-gray-600">
          Danh sách ứng viên bạn đã đánh dấu để tuyển dụng sau
        </p>
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
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">💛</p>
          <p className="text-lg mb-2">Chưa có ứng viên yêu thích</p>
          <p className="text-sm">
            Bấm nút ❤️ trên hồ sơ ứng viên để lưu vào danh sách này.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((worker) => {
            const trustLevel = getTrustLevel(worker.creditScore);
            const trustBadge = TRUST_LEVEL_BADGE[trustLevel];
            const isRemoving = removingId === worker.jobSeekerId;

            return (
              <div
                key={worker.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                      {worker.avatarUrl ? (
                        <img
                          src={worker.avatarUrl}
                          alt={worker.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-lg">👤</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/ho-so/${worker.jobSeekerId}`}
                        className="font-semibold text-base hover:text-blue-600 hover:underline truncate block"
                      >
                        {worker.fullName}
                      </Link>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${trustBadge.className}`}
                        >
                          {trustBadge.label}
                        </span>
                        {worker.currentLocation && (
                          <span className="text-xs text-gray-500">
                            📍 {worker.currentLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-600 shrink-0">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{worker.creditScore}</p>
                      <p className="text-xs">Điểm uy tín</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">
                        ⭐ {formatRating(worker.averageRating)}
                      </p>
                      <p className="text-xs">Đánh giá</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {worker.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 shrink-0 max-w-[200px]">
                      {worker.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {worker.skills.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{worker.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/ho-so/${worker.jobSeekerId}`}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Xem hồ sơ
                    </Link>
                    <button
                      onClick={() => handleRemove(worker.jobSeekerId)}
                      disabled={isRemoving}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isRemoving ? '...' : 'Bỏ yêu thích'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
