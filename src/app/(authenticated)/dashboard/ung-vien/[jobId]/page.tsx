'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { TrustLevel } from '@/lib/types';
import ReviewForm from '@/components/ReviewForm';
import BookmarkButton from '@/components/BookmarkButton';

interface Applicant {
  applicationId: string;
  jobSeekerId: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  creditScore: number;
  trustLevel: TrustLevel;
  averageRating: number;
  applicationStatus: 'pending' | 'accepted' | 'rejected';
}

interface JobInfo {
  id: string;
  title: string;
  location: string;
  work_date: string;
}

const TRUST_LEVEL_BADGE: Record<TrustLevel, { label: string; className: string }> = {
  new: { label: 'Mới', className: 'bg-gray-100 text-gray-600' },
  trustworthy: { label: 'Đáng tin', className: 'bg-blue-100 text-blue-700' },
  reputable: { label: 'Uy tín', className: 'bg-green-100 text-green-700' },
  excellent: { label: 'Xuất sắc', className: 'bg-purple-100 text-purple-700' },
  top_worker: { label: 'Top Worker', className: 'bg-yellow-100 text-yellow-700' },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: 'Đã chấp nhận', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Đã từ chối', className: 'bg-red-100 text-red-700' },
};

export default function ApplicantListPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/applicants`);
      if (!res.ok) {
        setError('Không thể tải danh sách ứng viên.');
        return;
      }
      const data = await res.json();
      setJobInfo(data.job ?? null);
      setApplicants(data.applicants ?? []);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  async function handleStatusChange(applicationId: string, status: 'accepted' | 'rejected') {
    setActionLoading(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'Đã xảy ra lỗi.');
        return;
      }
      // Refresh the list
      await fetchApplicants();
    } catch {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setActionLoading(null);
    }
  }

  function formatRating(rating: number) {
    return rating > 0 ? rating.toFixed(1) : '—';
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/viec-lam"
          className="text-sm text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Quay lại danh sách việc làm
        </Link>
        <h1 className="text-2xl font-bold">Danh sách ứng viên</h1>
        {jobInfo && (
          <p className="mt-1 text-gray-600">
            {jobInfo.title} — 📍 {jobInfo.location} — 📅{' '}
            {new Date(jobInfo.work_date).toLocaleDateString('vi-VN')}
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Applicant List */}
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
      ) : applicants.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Chưa có ứng viên nào</p>
          <p className="text-sm">Khi có người ứng tuyển, họ sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicants.map((applicant) => {
            const trustBadge = TRUST_LEVEL_BADGE[applicant.trustLevel];
            const statusBadge = STATUS_BADGE[applicant.applicationStatus];
            const isActioning = actionLoading === applicant.applicationId;

            return (
              <div
                key={applicant.applicationId}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar & Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 flex items-center justify-center overflow-hidden">
                      {applicant.avatarUrl ? (
                        <img
                          src={applicant.avatarUrl}
                          alt={applicant.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-lg">👤</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/ho-so/${applicant.userId}`}
                        className="font-semibold text-base hover:text-blue-600 hover:underline truncate block"
                      >
                        {applicant.fullName}
                      </Link>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${trustBadge.className}`}>
                          {trustBadge.label}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 text-sm text-gray-600 shrink-0">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{applicant.creditScore}</p>
                      <p className="text-xs">Điểm uy tín</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">⭐ {formatRating(applicant.averageRating)}</p>
                      <p className="text-xs">Đánh giá</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {applicant.applicationStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(applicant.applicationId, 'accepted')}
                          disabled={isActioning}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isActioning ? '...' : 'Chấp nhận'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(applicant.applicationId, 'rejected')}
                          disabled={isActioning}
                          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isActioning ? '...' : 'Từ chối'}
                        </button>
                      </>
                    )}
                    <Link
                      href={`/ho-so/${applicant.userId}`}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Xem hồ sơ
                    </Link>
                    <BookmarkButton jobSeekerId={applicant.userId} />
                    {applicant.applicationStatus === 'accepted' && (
                      <button
                        onClick={() =>
                          setReviewingId(
                            reviewingId === applicant.applicationId
                              ? null
                              : applicant.applicationId,
                          )
                        }
                        className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                      >
                        Đánh giá
                      </button>
                    )}
                  </div>
                </div>
                {reviewingId === applicant.applicationId && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <ReviewForm
                      applicationId={applicant.applicationId}
                      revieweeId={applicant.userId}
                      reviewType="employer_to_seeker"
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
