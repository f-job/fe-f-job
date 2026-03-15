'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import OTPInput from '@/app/components/OTPInput';
import { isValidVietnamesePhone } from '@/lib/phone';
import { setupRecaptcha, sendOtp, verifyOtp } from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

type Step = 'form' | 'otp';

export default function JobSeekerRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP state
  const [otp, setOtp] = useState('');
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const validateForm = useCallback((): string | null => {
    if (!fullName.trim()) return 'Vui lòng nhập họ tên.';
    if (!phone.trim()) return 'Vui lòng nhập số điện thoại.';
    if (!isValidVietnamesePhone(phone)) return 'Số điện thoại không hợp lệ. Nhập 10 chữ số bắt đầu bằng 0.';
    if (!email.trim()) return 'Vui lòng nhập email.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email không hợp lệ.';
    if (!password) return 'Vui lòng nhập mật khẩu.';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
    if (password !== confirmPassword) return 'Mật khẩu xác nhận không khớp.';
    return null;
  }, [fullName, phone, email, password, confirmPassword]);

  const handleSendOtp = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const recaptchaVerifier = setupRecaptcha('send-otp-btn');
      const confirmation = await sendOtp(phone, recaptchaVerifier);
      confirmationRef.current = confirmation;
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [phone, validateForm]);

  const handleVerifyAndRegister = useCallback(async (otpCode: string) => {
    if (!confirmationRef.current) {
      setError('Phiên xác thực đã hết hạn. Vui lòng thử lại.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify OTP via Firebase
      await verifyOtp(confirmationRef.current, otpCode);

      // Register via API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: 'job_seeker',
          phone,
          email,
          fullName,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        return;
      }

      // Redirect to profile setup
      router.push('/ho-so');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xác thực OTP thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [phone, email, fullName, password, router]);

  const handleResendOtp = useCallback(async () => {
    try {
      const recaptchaVerifier = setupRecaptcha('send-otp-btn');
      const confirmation = await sendOtp(phone, recaptchaVerifier);
      confirmationRef.current = confirmation;
    } catch {
      setError('Không thể gửi lại mã OTP. Vui lòng thử lại.');
    }
  }, [phone]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Đăng ký người tìm việc</h1>
        <p className="mt-1 text-sm text-gray-600">
          Tạo tài khoản để bắt đầu tìm việc thời vụ
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {step === 'form' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              id="send-otp-btn"
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300
                disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>

            <p className="text-center text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <a href="/dang-nhap" className="font-medium text-blue-600 hover:text-blue-800">
                Đăng nhập
              </a>
            </p>
          </form>
        )}

        {step === 'otp' && (
          <div className="mt-6 space-y-6">
            <p className="text-center text-sm text-gray-600">
              Mã xác thực đã được gửi đến <span className="font-medium">{phone}</span>
            </p>

            <OTPInput
              value={otp}
              onChange={setOtp}
              onComplete={handleVerifyAndRegister}
              onResend={handleResendOtp}
              disabled={loading}
            />

            {loading && (
              <p className="text-center text-sm text-gray-500">Đang xác thực...</p>
            )}

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtp('');
                setError('');
              }}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              ← Quay lại
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
