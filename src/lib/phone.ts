/**
 * Phone number utilities for Vietnamese format validation and formatting.
 */

/**
 * Format a Vietnamese phone number to E.164 format.
 * Accepts 10-digit numbers starting with 0 (e.g. 0901234567 → +84901234567).
 */
export function formatVietnamesePhone(phone: string): string {
  const cleaned = phone.replace(/\s|-/g, '');
  if (/^0\d{9}$/.test(cleaned)) {
    return `+84${cleaned.slice(1)}`;
  }
  if (/^\+84\d{9}$/.test(cleaned)) {
    return cleaned;
  }
  throw new Error('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số bắt đầu bằng 0.');
}

/**
 * Validate that a phone string matches Vietnamese format (10 digits starting with 0).
 */
export function isValidVietnamesePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s|-/g, '');
  return /^0\d{9}$/.test(cleaned) || /^\+84\d{9}$/.test(cleaned);
}
