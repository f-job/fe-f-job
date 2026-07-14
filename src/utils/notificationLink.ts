import type { AppNotification } from '@/types/api';

function metadataId(
  metadata: AppNotification['metadata'],
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value ? value : undefined;
}

function withQuery(path: string, values: Record<string, string | undefined>) {
  const query = new URLSearchParams(
    Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

/**
 * Resolves a notification to the most relevant page for the recipient.
 * Notifications without an actionable resource deliberately return null: a
 * click still marks them read, but it does not send the user somewhere random.
 */
export function notificationLink(
  notification: AppNotification,
  role?: string,
): string | null {
  const metadata = notification.metadata;
  const applicationId = metadataId(metadata, 'applicationId');
  const jobId = metadataId(metadata, 'jobId');
  const employerView = role === 'EMPLOYER' || role === 'ADMIN';

  switch (notification.type) {
    case 'NEW_JOB':
      return jobId ? `/viec-lam/${encodeURIComponent(jobId)}` : '/viec-lam';
    case 'RECRUITMENT_MESSAGE':
      return '/tin-nhan';
    case 'APPLICATION_STATUS':
    case 'JOB_COMPLETED':
    case 'SHIFT_REMINDER':
      return withQuery(
        employerView ? '/nha-tuyen-dung/tin-dang' : '/don-ung-tuyen',
        { applicationId, jobId },
      );
    case 'REVIEW_RECEIVED':
      return employerView ? '/nha-tuyen-dung/ho-so' : '/ho-so';
    case 'VERIFICATION_RESULT':
      return '/xac-minh-danh-tinh';
    case 'REPORT_UPDATE':
      return role === 'ADMIN' ? '/admin/reports' : null;
    default:
      return null;
  }
}
