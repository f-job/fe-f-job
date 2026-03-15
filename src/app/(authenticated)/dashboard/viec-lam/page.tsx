'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import type { JobPostingData } from '@/lib/types';

type JobStatus = 'open' | 'filled' | 'completed' | 'cancelled';

interface JobItem {
  id: string;
  title: string;
  location: string;
  work_date: string;
  start_time: string;
  end_time: string;
  hourly_wage: number;
  number_of_positions: number;
  status: JobStatus;
  slug: string;
  description: string;
  job_category: string;
  requirements: string | null;
  created_at: string;
}

const STATUS_OPTIONS: { value: '' | JobStatus; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'open', label: 'Đang tuyển' },
  { value: 'filled', label: 'Đã đủ' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_BADGE: Record<JobStatus, { label: string; className: string }> = {
  open: { label: 'Đang tuyển', className: 'bg-green-100 text-green-700' },
  filled: { label: 'Đã đủ', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành', className: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-500' },
};

const JOB_CATEGORIES = [
  'Phục vụ sự kiện',
  'Nhân viên bán hàng',
  'Lễ tân',
  'Nhân viên kho',
  'Truyền thông',
  'Hỗ trợ kỹ thuật',
  'Nhân viên vệ sinh',
  'Khác',
];

const DA_NANG_DISTRICTS = [
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
  'Hòa Vang',
];

export default function MyJobListingsPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | JobStatus>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [editForm, setEditForm] = useState<JobPostingData & { status: JobStatus }>({
    title: '',
    description: '',
    jobCategory: '',
    numberOfPositions: 1,
    workDate: '',
    startTime: '',
    endTime: '',
    hourlyWage: 0,
    location: '',
    requirements: '',
    status: 'open',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');

      const res = await fetch(`/api/jobs?employer=me&${params.toString()}`);
      if (!res.ok) {
        setError('Không thể tải danh sách việc làm');
        return;
      }
      const data = await res.json();
      setJobs(data.jobs ?? []);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  function openEditModal(job: JobItem) {
    setEditingJob(job);
    setEditForm({
      title: job.title,
      description: job.description,
      jobCategory: job.job_category,
      numberOfPositions: job.number_of_positions,
      workDate: job.work_date,
      startTime: job.start_time,
      endTime: job.end_time,
      hourlyWage: job.hourly_wage,
      location: job.location,
      requirements: job.requirements ?? '',
      status: job.status,
    });
    setEditErrors({});
    setEditSubmitError(null);
  }

  function closeEditModal() {
    setEditingJob(null);
  }

  function handleEditChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === 'numberOfPositions' || name === 'hourlyWage' ? Number(value) : value,
    }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function validateEditForm(): boolean {
    const newErrors: Record<string, string> = {};
    if (!editForm.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
    if (!editForm.description.trim()) newErrors.description = 'Vui lòng nhập mô tả';
    if (!editForm.jobCategory) newErrors.jobCategory = 'Vui lòng chọn loại công việc';
    if (!editForm.numberOfPositions || editForm.numberOfPositions < 1)
      newErrors.numberOfPositions = 'Số lượng phải lớn hơn 0';
    if (!editForm.workDate) newErrors.workDate = 'Vui lòng chọn ngày';
    if (!editForm.startTime) newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    if (!editForm.endTime) newErrors.endTime = 'Vui lòng chọn giờ kết thúc';
    if (!editForm.hourlyWage || editForm.hourlyWage < 1)
      newErrors.hourlyWage = 'Mức lương phải lớn hơn 0';
    if (!editForm.location) newErrors.location = 'Vui lòng chọn khu vực';
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingJob) return;
    setEditSubmitError(null);

    if (!validateEditForm()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditSubmitError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        return;
      }

      closeEditModal();
      fetchJobs();
    } catch {
      setEditSubmitError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Việc làm của tôi</h1>
          <p className="mt-1 text-gray-600">Quản lý các tin tuyển dụng đã đăng</p>
        </div>
        <Link
          href="/dashboard/dang-tin"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          ➕ Đăng tin mới
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Job List */}
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
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Chưa có tin tuyển dụng nào</p>
          <p className="text-sm">
            {statusFilter
              ? 'Không có tin nào với trạng thái này.'
              : 'Bắt đầu bằng cách đăng tin tuyển dụng đầu tiên.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const badge = STATUS_BADGE[job.status];
            return (
              <div
                key={job.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base truncate">{job.title}</h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>📍 {job.location}</span>
                      <span>📅 {formatDate(job.work_date)}</span>
                      <span>
                        🕐 {job.start_time} - {job.end_time}
                      </span>
                      <span>💰 {formatWage(job.hourly_wage)}</span>
                      <span>👥 {job.number_of_positions} vị trí</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/dashboard/ung-vien/${job.id}`}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Ứng viên
                    </Link>
                    <button
                      onClick={() => openEditModal(job)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Chỉnh sửa tin tuyển dụng</h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {editSubmitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                {editSubmitError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Trạng thái */}
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  id="edit-status"
                  name="status"
                  value={editForm.status}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.filter((o) => o.value !== '').map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiêu đề */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-title"
                  name="title"
                  type="text"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editErrors.title && <p className="text-red-500 text-xs mt-1">{editErrors.title}</p>}
              </div>

              {/* Mô tả */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.description}</p>
                )}
              </div>

              {/* Loại & Khu vực */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-jobCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại công việc <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-jobCategory"
                    name="jobCategory"
                    value={editForm.jobCategory}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn loại --</option>
                    {JOB_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {editErrors.jobCategory && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.jobCategory}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1">
                    Khu vực <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="edit-location"
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn quận --</option>
                    {DA_NANG_DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {editErrors.location && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.location}</p>
                  )}
                </div>
              </div>

              {/* Số lượng & Lương */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-numberOfPositions" className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng tuyển <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-numberOfPositions"
                    name="numberOfPositions"
                    type="number"
                    min={1}
                    value={editForm.numberOfPositions}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editErrors.numberOfPositions && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.numberOfPositions}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-hourlyWage" className="block text-sm font-medium text-gray-700 mb-1">
                    Lương theo giờ (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-hourlyWage"
                    name="hourlyWage"
                    type="number"
                    min={1}
                    value={editForm.hourlyWage}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editErrors.hourlyWage && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.hourlyWage}</p>
                  )}
                </div>
              </div>

              {/* Ngày & Giờ */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="edit-workDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày làm việc <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-workDate"
                    name="workDate"
                    type="date"
                    value={editForm.workDate}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editErrors.workDate && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.workDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-startTime"
                    name="startTime"
                    type="time"
                    value={editForm.startTime}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editErrors.startTime && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.startTime}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="edit-endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Giờ kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-endTime"
                    name="endTime"
                    type="time"
                    value={editForm.endTime}
                    onChange={handleEditChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {editErrors.endTime && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.endTime}</p>
                  )}
                </div>
              </div>

              {/* Yêu cầu */}
              <div>
                <label htmlFor="edit-requirements" className="block text-sm font-medium text-gray-700 mb-1">
                  Yêu cầu ứng viên
                </label>
                <textarea
                  id="edit-requirements"
                  name="requirements"
                  rows={2}
                  value={editForm.requirements}
                  onChange={handleEditChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
