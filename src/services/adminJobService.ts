import api from './api';
import type { AdminJobsQuery, BackendJob, Paginated } from '@/types/api';

/**
 * Admin job moderation API — backend prefix `/admin/jobs`.
 * Requires an ADMIN token (JwtAuthGuard + RolesGuard).
 */
const adminJobService = {
  /** GET /admin/jobs/pending — jobs awaiting approval. */
  pending(page = 1, limit = 10) {
    return api.get<Paginated<BackendJob>>('/admin/jobs/pending', {
      params: { page, limit },
    });
  },

  /** GET /admin/jobs — all jobs, optional ?status filter. */
  list(query: AdminJobsQuery = {}) {
    return api.get<Paginated<BackendJob>>('/admin/jobs', { params: query });
  },

  /** GET /admin/jobs/:id — job detail for moderation. */
  getById(id: string) {
    return api.get<BackendJob>(`/admin/jobs/${id}`);
  },

  /** PUT /admin/jobs/:id/approve — pending → active. */
  approve(id: string) {
    return api.put<BackendJob>(`/admin/jobs/${id}/approve`);
  },

  /** PUT /admin/jobs/:id/reject — pending → draft (+reason). */
  reject(id: string, reason?: string) {
    return api.put<BackendJob>(`/admin/jobs/${id}/reject`, { reason });
  },

  /** PUT /admin/jobs/:id/hide — any → closed (+reason). */
  hide(id: string, reason?: string) {
    return api.put<BackendJob>(`/admin/jobs/${id}/hide`, { reason });
  },

  /** PUT /admin/jobs/:id/urgent — set/toggle the urgent flag. */
  setUrgent(id: string, isUrgent?: boolean) {
    return api.put<BackendJob>(`/admin/jobs/${id}/urgent`, { isUrgent });
  },
};

export default adminJobService;
