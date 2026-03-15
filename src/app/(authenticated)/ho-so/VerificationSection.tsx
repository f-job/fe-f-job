'use client';

import { useState, useEffect, useRef } from 'react';
import type { VerificationStatus } from '@/lib/types';

interface VerificationData {
  verificationStatus: VerificationStatus;
  documents: Record<string, string | null>;
}

const STATUS_CONFIG: Record<
  VerificationStatus,
  { label: string; color: string; bgColor: string }
> = {
  not_started: {
    label: 'Chưa xác minh',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
  },
  pending: {
    label: 'Đang chờ xác minh',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
  verified: {
    label: 'Đã xác minh',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  rejected: {
    label: 'Bị từ chối',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
  },
};

const JOB_SEEKER_FIELDS = [
  { key: 'idCardFront', label: 'Mặt trước CCCD' },
  { key: 'idCardBack', label: 'Mặt sau CCCD' },
  { key: 'selfie', label: 'Ảnh chân dung (selfie)' },
] as const;

const EMPLOYER_FIELDS = [
  { key: 'businessLicense', label: 'Giấy phép kinh doanh' },
  { key: 'businessPhoto', label: 'Ảnh doanh nghiệp' },
] as const;

export default function VerificationSection({
  userType,
}: {
  userType: 'job_seeker' | 'employer';
}) {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRefs = useRef<Record<string, File | null>>({});

  const fields = userType === 'job_seeker' ? JOB_SEEKER_FIELDS : EMPLOYER_FIELDS;

  useEffect(() => {
    fetchVerification();
  }, []);

  async function fetchVerification() {
    try {
      setLoading(true);
      const res = await fetch('/api/verification');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Không thể tải thông tin xác minh.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(key: string, file: File | null) {
    fileRefs.current[key] = file;
  }

  async function handleSubmit() {
    setError('');
    setSuccess('');

    const formData = new FormData();
    for (const field of fields) {
      const file = fileRefs.current[field.key];
      if (file) {
        formData.append(field.key, file);
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/verification', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (res.ok) {
        setSuccess('Đã gửi yêu cầu xác minh thành công!');
        await fetchVerification();
      } else if (json.code === 'VERIFICATION_MISSING_DOCS') {
        setError('Vui lòng tải lên đầy đủ tài liệu bắt buộc.');
      } else {
        setError(json.message || 'Không thể gửi yêu cầu xác minh.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-sm text-gray-500">Đang tải thông tin xác minh...</p>
      </div>
    );
  }

  const status = data?.verificationStatus ?? 'not_started';
  const config = STATUS_CONFIG[status];
  const canSubmit = status === 'not_started' || status === 'rejected';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Xác minh tài khoản</h2>
        <VerificationBadge status={status} />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600">{success}</div>
      )}

      {status === 'verified' && (
        <p className="text-sm text-green-600">
          Tài khoản của bạn đã được xác minh thành công.
        </p>
      )}

      {status === 'pending' && (
        <p className="text-sm text-yellow-600">
          Tài liệu của bạn đang được xem xét. Vui lòng chờ kết quả.
        </p>
      )}

      {canSubmit && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {status === 'rejected'
              ? 'Yêu cầu xác minh trước đó bị từ chối. Vui lòng tải lại tài liệu.'
              : 'Tải lên tài liệu để xác minh tài khoản của bạn.'}
          </p>

          {fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {field.label} <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) =>
                  handleFileChange(field.key, e.target.files?.[0] ?? null)
                }
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
                aria-label={field.label}
              />
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Đang gửi...' : 'Gửi xác minh'}
          </button>
        </div>
      )}
    </div>
  );
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bgColor} ${config.color}`}
      data-testid="verification-badge"
    >
      {status === 'verified' && (
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {config.label}
    </span>
  );
}
