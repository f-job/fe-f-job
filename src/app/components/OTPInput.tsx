'use client';

import { useRef, useState, useEffect, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  onResend?: () => void;
  resendCooldown?: number; // seconds
  disabled?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  resendCooldown = 60,
  disabled = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(resendCooldown);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const focusInput = useCallback((index: number) => {
    const input = inputRefs.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const handleChange = useCallback(
    (index: number, digit: string) => {
      if (!/^\d?$/.test(digit)) return;

      const chars = value.split('');
      chars[index] = digit;
      const newValue = chars.join('').slice(0, length);
      onChange(newValue);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }

      if (newValue.length === length && /^\d+$/.test(newValue)) {
        onComplete?.(newValue);
      }
    },
    [value, length, onChange, onComplete, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!value[index] && index > 0) {
          focusInput(index - 1);
          handleChange(index - 1, '');
        } else {
          handleChange(index, '');
        }
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' && index > 0) {
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        focusInput(index + 1);
      }
    },
    [value, length, focusInput, handleChange],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (pasted) {
        onChange(pasted);
        const nextIndex = Math.min(pasted.length, length - 1);
        focusInput(nextIndex);
        if (pasted.length === length) {
          onComplete?.(pasted);
        }
      }
    },
    [length, onChange, onComplete, focusInput],
  );

  const handleResend = useCallback(() => {
    if (!canResend) return;
    setCountdown(resendCooldown);
    setCanResend(false);
    onResend?.();
  }, [canResend, resendCooldown, onResend]);

  const digits = value.padEnd(length, '').split('').slice(0, length);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            onFocus={(e) => e.target.select()}
            className="h-12 w-10 rounded-lg border border-gray-300 text-center text-lg font-semibold
              focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
              disabled:bg-gray-100 disabled:text-gray-400
              sm:h-14 sm:w-12 sm:text-xl"
            aria-label={`Chữ số ${index + 1}`}
          />
        ))}
      </div>

      {onResend && (
        <div className="text-sm text-gray-600">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Gửi lại mã OTP
            </button>
          ) : (
            <span>
              Gửi lại mã sau <span className="font-medium text-blue-600">{countdown}s</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
