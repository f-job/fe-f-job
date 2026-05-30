import type {
  ApplicationStatus,
  EmployerStatus,
  SalaryType,
} from '@/types/api';

export { getEntityId } from '@/types/api';

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
