import api from './api';
import type {
  AdminReview,
  AdminReviewsQuery,
  AuditLog,
  AuditQuery,
  IdentityDocument,
  Paginated,
  ReportQueueQuery,
  ReportView,
  VerificationQueueItem,
  VerificationView,
} from '@/types/api';

/**
 * Admin trust-and-safety moderation API — the admin surfaces across all four
 * capabilities (review moderation, verification review, report enforcement,
 * audit trail). Every route is ADMIN-only
 * (JwtAuthGuard + RolesGuard(ADMIN) + BlockedUserGuard).
 */
const adminModerationService = {
  // ─── Review moderation (prefix /admin/reviews) ──────────────────────────────

  /** GET /admin/reviews — moderation list incl. hidden, newest-first, paginated. */
  adminListReviews(query: AdminReviewsQuery = {}) {
    return api.get<Paginated<AdminReview>>('/admin/reviews', { params: query });
  },

  /** PATCH /admin/reviews/:id/hide — hide a visible review with a reason (≤1000). */
  hideReview(id: string, reason: string) {
    return api.patch<AdminReview>(`/admin/reviews/${id}/hide`, { reason });
  },

  /** PATCH /admin/reviews/:id/restore — restore a hidden review. */
  restoreReview(id: string) {
    return api.patch<AdminReview>(`/admin/reviews/${id}/restore`);
  },

  // ─── Verification review (prefix /admin/verifications) ──────────────────────

  /** GET /admin/verifications — PENDING_REVIEW queue, oldest-first, max 100/page. */
  verificationQueue(page = 1, limit = 20) {
    return api.get<Paginated<VerificationQueueItem>>('/admin/verifications', {
      params: { page, limit },
    });
  },

  /** GET /admin/verifications/:userId — a candidate's submitted identity documents. */
  getVerificationDocuments(userId: string) {
    return api.get<IdentityDocument[]>(`/admin/verifications/${userId}`);
  },

  /** PATCH /admin/verifications/:userId/approve — PENDING_REVIEW → VERIFIED. */
  approveVerification(userId: string) {
    return api.patch<VerificationView>(`/admin/verifications/${userId}/approve`);
  },

  /** PATCH /admin/verifications/:userId/reject — PENDING_REVIEW → REJECTED (+reason ≤1000). */
  rejectVerification(userId: string, reason: string) {
    return api.patch<VerificationView>(`/admin/verifications/${userId}/reject`, {
      reason,
    });
  },

  // ─── Report enforcement (prefix /admin/reports) ─────────────────────────────

  /** GET /admin/reports — report queue, newest-first, filterable, default 20 / max 100. */
  reportQueue(query: ReportQueueQuery = {}) {
    return api.get<Paginated<ReportView>>('/admin/reports', { params: query });
  },

  /** PATCH /admin/reports/:id/review — OPEN → UNDER_REVIEW (assign self). */
  reviewReport(id: string) {
    return api.patch<ReportView>(`/admin/reports/${id}/review`);
  },

  /** PATCH /admin/reports/:id/resolve — block target (Job→closed / User→blocked) + RESOLVED. */
  resolveReport(id: string) {
    return api.patch<ReportView>(`/admin/reports/${id}/resolve`);
  },

  /** PATCH /admin/reports/:id/dismiss — → DISMISSED (+reason ≤1000). */
  dismissReport(id: string, reason: string) {
    return api.patch<ReportView>(`/admin/reports/${id}/dismiss`, { reason });
  },

  // ─── Audit trail (prefix /admin/audit-logs) ─────────────────────────────────

  /** GET /admin/audit-logs — append-only audit trail, newest-first, filterable. */
  auditLogs(query: AuditQuery = {}) {
    return api.get<Paginated<AuditLog>>('/admin/audit-logs', { params: query });
  },
};

export default adminModerationService;
