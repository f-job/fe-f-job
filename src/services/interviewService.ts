import api from './api';
import type { Interview, UpdateInterviewPayload } from '@/types/api';

/**
 * Interview scheduling API — backend prefix `/employers/interviews`
 * (`InterviewsController`, guard `AuthGuard('jwt')`). Employer-facing.
 */
const interviewService = {
  /** GET /employers/interviews — own scheduled interviews. */
  list() {
    return api.get<Interview[]>('/employers/interviews');
  },

  /** POST /employers/interviews/:id/remind — send an interview reminder. */
  remind(id: string) {
    return api.post<{ message: string }>(`/employers/interviews/${id}/remind`);
  },

  /** PUT /employers/interviews/:id — reschedule / edit an interview. */
  update(id: string, payload: UpdateInterviewPayload) {
    return api.put<Interview>(`/employers/interviews/${id}`, payload);
  },

  /** DELETE /employers/interviews/:id — cancel an interview. */
  cancel(id: string) {
    return api.delete<{ message: string }>(`/employers/interviews/${id}`);
  },
};

export default interviewService;
