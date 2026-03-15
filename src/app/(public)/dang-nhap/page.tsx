'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      if (!identifier.trim()) {
        setError('Vui lòng nhập số điện thoại hoặc email.');
        return;
      }
      if (!password) {
        setError('Vui lòng nhập mật khẩu.');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
          return;
        }

        // Redirect based on user_type: job_seeker → /ho-so, employer → /dashboard
        router.push(data.redirectUrl);
      } catch {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    },
    [identifier, password, router],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Đăng nhập</h1>
        <p className="mt-1 text-sm text-gray-600">
          Đăng nhập để tìm việc hoặc tuyển dụng
        </p>

        {error && (
          <div
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700"
            >
              Số điện thoại hoặc email{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="0901234567 hoặc email@example.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300
              disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
          <p>
            Chưa có tài khoản?
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/dang-ky/nguoi-tim-viec"
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Đăng ký tìm việc
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="/dang-ky/nha-tuyen-dung"
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Đăng ký tuyển dụng
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
