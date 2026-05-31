import api from './api';
import type { EmployerProfile, UpdateEmployerPayload } from '@/types/api';

/**
 * Employer management API — backend prefix `/employers`.
 * List/detail are public in the current backend; update/verify/reject/block/
 * delete require a JWT (admin moderation flow).
 */
const employerService = {
  /** GET /employers — all employer profiles (newest first). */
  list() {
    return api.get<EmployerProfile[]>('/employers');
  },

  /** GET /employers/id/:id — single employer profile detail. */
  getById(id: string) {
    return api.get<EmployerProfile>(`/employers/id/${id}`);
  },

  /** PUT /employers/:id — update employer profile. */
  update(id: string, payload: UpdateEmployerPayload) {
    return api.put<EmployerProfile>(`/employers/${id}`, payload);
  },

  /** PUT /employers/:id/verify — approve / verify the employer. */
  verify(id: string) {
    return api.put<EmployerProfile>(`/employers/${id}/verify`);
  },

  /** PUT /employers/:id/reject — reject verification with a reason. */
  reject(id: string, reason: string) {
    return api.put<EmployerProfile>(`/employers/${id}/reject`, { reason });
  },

  /** PUT /employers/:id/block — block the employer + user account. */
  block(id: string, blockedReason: string) {
    return api.put<{ message: string }>(`/employers/${id}/block`, { blockedReason });
  },

  /** DELETE /employers/:id — delete the employer + user account. */
  remove(id: string) {
    return api.delete<{ message: string }>(`/employers/${id}`);
  },
};

export default employerService;
