import { formatVietnamesePhone, isValidVietnamesePhone } from '@/lib/phone';

describe('isValidVietnamesePhone', () => {
  it('accepts 10-digit number starting with 0', () => {
    expect(isValidVietnamesePhone('0901234567')).toBe(true);
  });

  it('accepts number with spaces', () => {
    expect(isValidVietnamesePhone('090 123 4567')).toBe(true);
  });

  it('accepts number with dashes', () => {
    expect(isValidVietnamesePhone('090-123-4567')).toBe(true);
  });

  it('accepts +84 international format', () => {
    expect(isValidVietnamesePhone('+84901234567')).toBe(true);
  });

  it('rejects number with fewer than 10 digits', () => {
    expect(isValidVietnamesePhone('090123456')).toBe(false);
  });

  it('rejects number with more than 10 digits', () => {
    expect(isValidVietnamesePhone('09012345678')).toBe(false);
  });

  it('rejects number not starting with 0', () => {
    expect(isValidVietnamesePhone('1901234567')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidVietnamesePhone('')).toBe(false);
  });
});

describe('formatVietnamesePhone', () => {
  it('converts 0-prefixed number to +84 format', () => {
    expect(formatVietnamesePhone('0901234567')).toBe('+84901234567');
  });

  it('handles spaces in input', () => {
    expect(formatVietnamesePhone('090 123 4567')).toBe('+84901234567');
  });

  it('handles dashes in input', () => {
    expect(formatVietnamesePhone('090-123-4567')).toBe('+84901234567');
  });

  it('passes through already-formatted +84 number', () => {
    expect(formatVietnamesePhone('+84901234567')).toBe('+84901234567');
  });

  it('throws on invalid phone number', () => {
    expect(() => formatVietnamesePhone('12345')).toThrow();
  });
});
