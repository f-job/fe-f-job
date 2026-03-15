import { generateVietnameseSlug } from '@/lib/slug';

describe('generateVietnameseSlug', () => {
  it('converts a Vietnamese job title to a URL-safe slug', () => {
    expect(generateVietnameseSlug('Nhân viên phục vụ sự kiện Đà Nẵng')).toBe(
      'nhan-vien-phuc-vu-su-kien-da-nang',
    );
  });

  it('produces lowercase output', () => {
    const slug = generateVietnameseSlug('TUYỂN DỤNG');
    expect(slug).toBe(slug.toLowerCase());
  });

  it('contains only lowercase letters, numbers, and hyphens', () => {
    const slug = generateVietnameseSlug('Lễ tân khách sạn 5 sao!');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('is deterministic (same input → same output)', () => {
    const input = 'Nhân viên bán hàng';
    expect(generateVietnameseSlug(input)).toBe(generateVietnameseSlug(input));
  });

  it('handles strings with special characters', () => {
    const slug = generateVietnameseSlug('Việc làm @Đà Nẵng #2024');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});
