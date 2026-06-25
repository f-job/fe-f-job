import api from './api';
import type {
  BulkInterviewPayload,
  BulkRejectPayload,
  CandidateSearchResult,
  FavoriteCandidate,
  Paginated,
} from '@/types/api';

/**
 * Employer candidate sourcing, ATS view, favorites and bulk-email tools.
 *
 * Backed by two controllers that share the `/employers` prefix
 * (guard `AuthGuard('jwt')`):
 *   • EmployerCandidatesController — search / detail / download-cv / unlock / ats
 *   • EmployerToolsController      — bulk emails + favorites
 */
const employerCandidateService = {
  // ─── Candidate sourcing (EmployerCandidatesController) ──────────────────────

  /** GET /employers/candidates — search candidate pool (free-form query). */
  search(query: Record<string, unknown> = {}) {
    return api.get<Paginated<CandidateSearchResult>>('/employers/candidates', {
      params: query,
    });
  },

  /** GET /employers/candidates/:id — single candidate detail. */
  getById(id: string) {
    return api.get<CandidateSearchResult>(`/employers/candidates/${id}`);
  },

  /** GET /employers/candidates/:id/download-cv — fetch the candidate's CV. */
  downloadCv(id: string) {
    return api.get(`/employers/candidates/${id}/download-cv`);
  },

  /** POST /employers/candidates/:id/unlock — unlock a profile (spends credit). */
  unlock(id: string) {
    return api.post<{
      message: string;
      candidate?: CandidateSearchResult & { resumeUrl?: string };
    }>(`/employers/candidates/${id}/unlock`);
  },

  /** GET /employers/ats/:applicationId — ATS view for a given application. */
  ats(applicationId: string) {
    return api.get(`/employers/ats/${applicationId}`);
  },

  // ─── Favorites (EmployerToolsController) ────────────────────────────────────

  /** GET /employers/favorites — saved/favorited candidates. */
  favorites() {
    return api.get<FavoriteCandidate[]>('/employers/favorites');
  },

  /** POST /employers/favorites/:candidateId — add a candidate to favorites. */
  addFavorite(candidateId: string) {
    return api.post<{ message: string }>(`/employers/favorites/${candidateId}`);
  },

  /** DELETE /employers/favorites/:candidateId — remove a candidate from favorites. */
  removeFavorite(candidateId: string) {
    return api.delete<{ message: string }>(`/employers/favorites/${candidateId}`);
  },

  // ─── Bulk email tools (EmployerToolsController) ─────────────────────────────

  /** POST /employers/emails/bulk-reject — send rejection emails in bulk. */
  bulkReject(payload: BulkRejectPayload) {
    return api.post<{ message: string }>('/employers/emails/bulk-reject', payload);
  },

  /** POST /employers/emails/bulk-interview — send interview-invite emails in bulk. */
  bulkInterview(payload: BulkInterviewPayload) {
    return api.post<{ message: string }>('/employers/emails/bulk-interview', payload);
  },
};

export default employerCandidateService;
