'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { JobPostingData } from '@/lib/types';

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

const initialFormData: JobPostingData = {
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
};

export default function PostJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<JobPostingData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof JobPostingData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof JobPostingData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề';
    if (!formData.description.trim()) newErrors.description = 'Vui lòng nhập mô tả công việc';
    if (!formData.jobCategory) newErrors.jobCategory = 'Vui lòng chọn loại công việc';
    if (!formData.numberOfPositions || formData.numberOfPositions < 1)
      newErrors.numberOfPositions = 'Số lượng phải lớn hơn 0';
    if (!formData.workDate) newErrors.workDate = 'Vui lòng chọn ngày làm việc';
    if (!formData.startTime) newErrors.startTime = 'Vui lòng chọn giờ bắt đầu';
    if (!formData.endTime) newErrors.endTime = 'Vui lòng chọn giờ kết thúc';
    if (!formData.hourlyWage || formData.hourlyWage < 1)
      newErrors.hourlyWage = 'Mức lương phải lớn hơn 0';
    if (!formData.location) newErrors.location = 'Vui lòng chọn khu vực';
    if (!formData.requirements.trim()) newErrors.requirements = 'Vui lòng nhập yêu cầu';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numberOfPositions' || name === 'hourlyWage' ? Number(value) : value,
    }));
    // Clear field error on change
    if (errors[name as keyof JobPostingData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'VERIFICATION_REQUIRED') {
          setSubmitError('Bạn cần xác minh doanh nghiệp trước khi đăng tin tuyển dụng.');
        } else if (data.code === 'JOB_MISSING_FIELDS') {
          setSubmitError('Vui lòng điền đầy đủ thông tin bắt buộc.');
        } else {
          setSubmitError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        }
        return;
      }

      router.push('/dashboard/viec-lam');
    } catch {
      setSubmitError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Đăng tin tuyển dụng</h1>
      <p className="text-gray-600 mb-6">Tạo bài đăng việc làm thời vụ mới</p>

      {submitError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tiêu đề */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Tiêu đề công việc <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={formData.title}
            onChange={handleChange}
            placeholder="VD: Nhân viên phục vụ sự kiện Đà Nẵng"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Mô tả */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả công việc <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả chi tiết công việc..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Loại công việc & Khu vực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="jobCategory" className="block text-sm font-medium text-gray-700 mb-1">
              Loại công việc <span className="text-red-500">*</span>
            </label>
            <select
              id="jobCategory"
              name="jobCategory"
              value={formData.jobCategory}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn loại --</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.jobCategory && <p className="text-red-500 text-xs mt-1">{errors.jobCategory}</p>}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Khu vực <span className="text-red-500">*</span>
            </label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Chọn quận --</option>
              {DA_NANG_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
          </div>
        </div>

        {/* Số lượng & Lương */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="numberOfPositions" className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng tuyển <span className="text-red-500">*</span>
            </label>
            <input
              id="numberOfPositions"
              name="numberOfPositions"
              type="number"
              min={1}
              value={formData.numberOfPositions}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.numberOfPositions && <p className="text-red-500 text-xs mt-1">{errors.numberOfPositions}</p>}
          </div>

          <div>
            <label htmlFor="hourlyWage" className="block text-sm font-medium text-gray-700 mb-1">
              Lương theo giờ (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              id="hourlyWage"
              name="hourlyWage"
              type="number"
              min={1}
              value={formData.hourlyWage}
              onChange={handleChange}
              placeholder="VD: 50000"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.hourlyWage && <p className="text-red-500 text-xs mt-1">{errors.hourlyWage}</p>}
          </div>
        </div>

        {/* Ngày & Giờ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="workDate" className="block text-sm font-medium text-gray-700 mb-1">
              Ngày làm việc <span className="text-red-500">*</span>
            </label>
            <input
              id="workDate"
              name="workDate"
              type="date"
              value={formData.workDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.workDate && <p className="text-red-500 text-xs mt-1">{errors.workDate}</p>}
          </div>

          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Giờ bắt đầu <span className="text-red-500">*</span>
            </label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              Giờ kết thúc <span className="text-red-500">*</span>
            </label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
          </div>
        </div>

        {/* Yêu cầu */}
        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
            Yêu cầu ứng viên <span className="text-red-500">*</span>
          </label>
          <textarea
            id="requirements"
            name="requirements"
            rows={3}
            value={formData.requirements}
            onChange={handleChange}
            placeholder="VD: Ngoại hình ưa nhìn, giao tiếp tốt..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.requirements && <p className="text-red-500 text-xs mt-1">{errors.requirements}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Đang đăng tin...' : 'Đăng tin tuyển dụng'}
        </button>
      </form>
    </main>
  );
}
