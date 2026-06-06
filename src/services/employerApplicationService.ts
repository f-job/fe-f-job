import api from './api';
import type {
  Application,
  RejectApplicationPayload,
  ScheduleInterviewPayload,
  UpdateApplicationStagePayload,
} from '@/types/api';

/**
 * Employer-side application lifecycle (ATS pipeline + terminal transitions).
 *
 * Two backend surfaces:
 *   • EmployerJobsController ATS routes  → `/employers/jobs/ats/:applicationId/*`
 *       stage / schedule / accept / reject
 *   • EmployerApplicationsController     → `/employers/applications/:id/*`
 *       complete / no-show  (EMPLOYER, JWT + Roles + BlockedUser guards)
 */
const employerApplicationService = {
  // ─── ATS pipeline (prefix /employers/jobs/ats) ──────────────────────────────

  /** PUT /employers/jobs/ats/:applicationId/stage — move the application stage. */
  updateStage(applicationId: string, payload: UpdateApplicationStagePayload) {
    return api.put<Application>(`/employers/jobs/ats/${applicationId}/stage`, payload);
  },

  /** POST /employers/jobs/ats/:applicationId/schedule — schedule an interview. */
  schedule(applicationId: string, payload: ScheduleInterviewPayload) {
    return api.post<Application>(`/employers/jobs/ats/${applicationId}/schedule`, payload);
  },

  /** POST /employers/jobs/ats/:applicationId/accept — accept the candidate. */
  accept(applicationId: string) {
    return api.post<Application>(`/employers/jobs/ats/${applicationId}/accept`);
  },

  /** POST /employers/jobs/ats/:applicationId/reject — reject with a reason. */
  reject(applicationId: string, payload: RejectApplicationPayload) {
    return api.post<Application>(`/employers/jobs/ats/${applicationId}/reject`, payload);
  },

  // ─── Terminal transitions (prefix /employers/applications) ──────────────────

  /** PUT /employers/applications/:id/complete — Accepted → Completed. */
  complete(id: string) {
    return api.put<Application>(`/employers/applications/${id}/complete`);
  },

  /** PUT /employers/applications/:id/no-show — Accepted → NoShow. */
  noShow(id: string) {
    return api.put<Application>(`/employers/applications/${id}/no-show`);
  },
};

export default employerApplicationService;
