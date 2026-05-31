import api from './api';
import type { SubmitVerificationPayload, VerificationView } from '@/types/api';

/**
 * Candidate Identity Verification API — Capability 3 (candidate surface).
 * Backend prefix `/verification`. Both routes are candidate-only
 * (JwtAuthGuard + RolesGuard(CANDIDATE) + BlockedUserGuard).
 */
const verificationService = {
  /** POST /verification/submit — submit 1–5 identity documents (UNVERIFIED/REJECTED → PENDING_REVIEW). */
  submit(payload: SubmitVerificationPayload) {
    return api.post<VerificationView>('/verification/submit', payload);
  },

  /** GET /verification/me — own verification status + submitted documents. */
  getMine() {
    return api.get<VerificationView>('/verification/me');
  },
};

export default verificationService;
