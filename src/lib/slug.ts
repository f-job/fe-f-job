import slugify from 'slugify';

/**
 * Generates a URL-safe slug from a Vietnamese string.
 *
 * Example:
 *   "Nhân viên phục vụ sự kiện Đà Nẵng"
 *   → "nhan-vien-phuc-vu-su-kien-da-nang"
 */
export function generateVietnameseSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    locale: 'vi',
  });
}
