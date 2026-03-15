'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApplyButtonProps {
  jobId: string;
}

export default function ApplyButton({ jobId }: ApplyButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'duplicate' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleApply() {
    setIsLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        return;
      }

      // Handle specific error codes
      if (data.code === 'AUTH_UNAUTHORIZED') {
        router.push('/dang-nhap');
        return;
      }

      if (data.code === 'PROFILE_INCOMPLETE') {
        router.push('/ho-so');
        return;
      }

      if (data.code === 'APPLICATION_DUPLICATE') {
        setStatus('duplicate');
        return;
      }

      setStatus('error');
      setErrorMessage(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } catch {
      setStatus('error');
      setErrorMessage('Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-6 py-3 text-base font-semibold text-green-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Ứng tuyển thành công!
        </div>
        <p className="text-sm text-gray-500">Nhà tuyển dụng sẽ xem xét đơn của bạn.</p>
      </div>
    );
  }

  if (status === 'duplicate') {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-6 py-3 text-base font-semibold text-yellow-700">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Bạn đã ứng tuyển việc này rồi
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleApply}
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-8 py-3
          text-base font-semibold text-white shadow-sm transition-colors
          hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-60
          sm:w-auto"
      >
        {isLoading ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang gửi...
          </>
        ) : (
          'Ứng tuyển ngay'
        )}
      </button>
      {status === 'error' && errorMessage && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
