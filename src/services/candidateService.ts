import api from './api';
import type {
  CandidateDetail,
  Paginated,
  UpdateCandidatePayload,
} from '@/types/api';

export interface ListCandidatesQuery {
  keyword?: string;
  page?: number;
  limit?: number;
}

/**
 * Candidate management API — backend prefix `/users/candidates`.
 * Most endpoints require an ADMIN token; profile update / open-to-work are
 * also allowed for the candidate themselves (self-service).
 */
const candidateService = {
  /** GET /users/candidates — paginated list (Admin). */
  list(query: ListCandidatesQuery = {}) {
    return api.get<Paginated<CandidateDetail>>('/users/candidates', { params: query });
  },

  /** GET /users/candidates/:id — full candidate detail (Admin). */
  getById(id: string) {
    return api.get<CandidateDetail>(`/users/candidates/${id}`);
  },

  /** PUT /users/candidates/:id — update candidate profile (self or Admin). */
  update(id: string, payload: UpdateCandidatePayload) {
    return api.put(`/users/candidates/${id}`, payload);
  },

  /** PUT /users/candidates/:id/status — toggle open-to-work (self or Admin). */
  setOpenToWork(id: string, openToWork: boolean) {
    return api.put(`/users/candidates/${id}/status`, { openToWork });
  },

  /** PUT /users/candidates/:id/block — block a candidate (Admin). */
  block(id: string) {
    return api.put(`/users/candidates/${id}/block`);
  },

  /** PUT /users/candidates/:id/unblock — reinstate a candidate (Admin). */
  unblock(id: string) {
    return api.put(`/users/candidates/${id}/unblock`);
  },

  /** DELETE /users/candidates/:id — delete account + profile (Admin). */
  remove(id: string) {
    return api.delete(`/users/candidates/${id}`);
  },
};

export default candidateService;
