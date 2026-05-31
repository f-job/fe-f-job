import type {
  ApplicationStatus,
  EmployerStatus,
  SalaryType,
} from '@/types/api';

export { getEntityId, getRefId } from '@/types/api';

/** Extract a human-readable message from an axios/unknown error. */
export function getErrorMessage(error: unknown, fallback: string): string {
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const message = err.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return message || fallback;
}

const VND = new Intl.NumberFormat('vi-VN');

/** Render a casual wage in VND with the correct per-unit suffix. */
export function formatSalary(amount: number, type: SalaryType): string {
  const suffix =
    type === 'hourly' ? '/giờ' : type === 'daily' ? '/ngày' : '/gói';
  return `${VND.format(amount)}đ${suffix}`;
}

export function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

export function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}

// ─── Status → Bootstrap badge variant ──────────────────────────────────────────

export function employerStatusVariant(status: EmployerStatus): string {
  switch (status) {
    case 'APPROVED': return 'success';
    case 'PENDING_APPROVAL': return 'warning';
    case 'REJECTED': return 'danger';
    case 'BLOCKED': return 'dark';
    default: return 'secondary';
  }
}

export function employerStatusLabel(status: EmployerStatus): string {
  switch (status) {
    case 'APPROVED': return 'Đã duyệt';
    case 'PENDING_APPROVAL': return 'Chờ duyệt';
    case 'REJECTED': return 'Bị từ chối';
    case 'BLOCKED': return 'Bị khóa';
    default: return status;
  }
}

export function applicationStatusVariant(status: ApplicationStatus): string {
  switch (status) {
    case 'Applied': return 'secondary';
    case 'Viewed': return 'info';
    case 'Scheduled': return 'primary';
    case 'Accepted': return 'success';
    case 'Rejected': return 'danger';
    case 'Withdrawn': return 'dark';
    default: return 'secondary';
  }
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case 'Applied': return 'Đã ứng tuyển';
    case 'Viewed': return 'Đã xem';
    case 'Scheduled': return 'Đã hẹn lịch';
    case 'Accepted': return 'Được nhận';
    case 'Rejected': return 'Bị từ chối';
    case 'Withdrawn': return 'Đã rút';
    default: return status;
  }
}

// ─── Payout status → badge variant / label ─────────────────────────────────────

import type { NotificationType, PayoutStatus } from '@/types/api';

export function payoutStatusVariant(status: PayoutStatus): string {
  switch (status) {
    case 'completed': return 'success';
    case 'pending': return 'secondary';
    case 'processing': return 'info';
    case 'rejected': return 'danger';
    default: return 'secondary';
  }
}

export function payoutStatusLabel(status: PayoutStatus): string {
  switch (status) {
    case 'completed': return 'Đã chi trả';
    case 'pending': return 'Chờ duyệt';
    case 'processing': return 'Đang xử lý';
    case 'rejected': return 'Bị từ chối';
    default: return status;
  }
}

// ─── Notification type → icon / label ───────────────────────────────────────────

export function notificationIcon(type: NotificationType): string {
  switch (type) {
    case 'APPLICATION_STATUS': return 'bi-file-earmark-check';
    case 'NEW_JOB': return 'bi-briefcase';
    case 'SHIFT_REMINDER': return 'bi-alarm';
    case 'RECRUITMENT_MESSAGE': return 'bi-chat-dots';
    case 'SYSTEM': return 'bi-info-circle';
    default: return 'bi-bell';
  }
}

/** Compact relative time (e.g. "5 phút trước"). Falls back to locale date. */
export function timeAgo(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Vừa xong';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} giờ trước`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

/** Format a VND amount with thousands separators and the đ suffix. */
export function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)}đ`;
}
