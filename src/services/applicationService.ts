import api from './api';
import type {
  Application,
  ApplicationStatusSnapshot,
  CreateApplicationPayload,
  Paginated,
} from '@/types/api';

/**
 * Candidate application API — backend prefix `/applications`.
 * Every endpoint requires a CANDIDATE token.
 */
const applicationService = {
  /** POST /applications — apply to a job shift. */
  apply(payload: CreateApplicationPayload) {
    return api.post<Application>('/applications', payload);
  },

  /** GET /applications/my — own application history (paginated). */
  listMine(page = 1, limit = 10) {
    return api.get<Paginated<Application>>('/applications/my', { params: { page, limit } });
  },

  /** GET /applications/:jobId/check — has the candidate already applied? */
  checkApplied(jobId: string) {
    return api.get<{ applied: boolean }>(`/applications/${jobId}/check`);
  },

  /** GET /applications/:id/status — lightweight status snapshot. */
  getStatus(id: string) {
    return api.get<ApplicationStatusSnapshot>(`/applications/${id}/status`);
  },

  /** GET /applications/:id — full application detail. */
  getById(id: string) {
    return api.get<Application>(`/applications/${id}`);
  },

  /** DELETE /applications/:id — withdraw an application (only while "Applied"). */
  withdraw(id: string) {
    return api.delete(`/applications/${id}`);
  },
};

export default applicationService;
