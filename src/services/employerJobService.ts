import api from './api';
import type {
  BackendJob,
  CreateEmployerJobPayload,
  EmployerJobApplicationsResponse,
  EmployerJobsQuery,
  Paginated,
  UpdateEmployerJobPayload,
} from '@/types/api';

/**
 * Employer job-posting API — backend prefix `/employers/jobs`.
 * All endpoints require a JWT belonging to a user with an employer profile.
 */
const employerJobService = {
  /** POST /employers/jobs — create a new posting (starts as `pending`). */
  create(payload: CreateEmployerJobPayload) {
    return api.post<BackendJob>('/employers/jobs', payload);
  },

  /** GET /employers/jobs — own postings, optional status filter + pagination. */
  list(query: EmployerJobsQuery = {}) {
    return api.get<Paginated<BackendJob>>('/employers/jobs', { params: query });
  },

  /** GET /employers/jobs/:id — own posting detail. */
  getById(id: string) {
    return api.get<BackendJob>(`/employers/jobs/${id}`);
  },

  /** PUT /employers/jobs/:id — edit a posting. */
  update(id: string, payload: UpdateEmployerJobPayload) {
    return api.put<BackendJob>(`/employers/jobs/${id}`, payload);
  },

  /** DELETE /employers/jobs/:id — soft-delete (→ closed). */
  remove(id: string) {
    return api.delete<BackendJob>(`/employers/jobs/${id}`);
  },

  /** POST /employers/jobs/:id/refresh — bump to top. */
  refresh(id: string) {
    return api.post<{ message: string; job: BackendJob }>(`/employers/jobs/${id}/refresh`);
  },

  /** POST /employers/jobs/:id/duplicate — clone as a new `pending` posting. */
  duplicate(id: string) {
    return api.post<BackendJob>(`/employers/jobs/${id}/duplicate`);
  },

  /** PUT /employers/jobs/:id/close — close the posting. */
  close(id: string) {
    return api.put<BackendJob>(`/employers/jobs/${id}/close`);
  },

  /** PUT /employers/jobs/:id/extend — extend expiry by 7 days. */
  extend(id: string) {
    return api.put<{ message: string; expiresAt: string }>(`/employers/jobs/${id}/extend`);
  },

  /** GET /employers/jobs/:id/applications — applicants for a posting. */
  applications(id: string) {
    return api.get<EmployerJobApplicationsResponse>(`/employers/jobs/${id}/applications`);
  },
};

export default employerJobService;
