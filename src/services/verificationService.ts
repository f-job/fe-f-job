import api from './api';
import type { VerificationView, SubmitVerificationPayload } from '@/types/api';

export interface VerifyIdentityPayload {
  fullName: string;
  idNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  verificationMethod: 'cccd_qr' | 'cccd_ocr' | 'manual';
  consentGiven?: boolean;
}

export interface VerificationStatus {
  isVerified: boolean;
  verifiedAt?: string;
  fullName?: string;
  idNumberMasked?: string;
  dateOfBirth?: string;
  verificationMethod?: string;
}

const verificationService = {
  /**
   * Submit verification data extracted from CCCD
   */
  verifyIdentity(payload: VerifyIdentityPayload) {
    return api.post<VerificationStatus>('/verification/verify', payload);
  },

  /**
   * Get current verification status
   */
  getStatus() {
    return api.get<VerificationStatus>('/verification/status');
  },

  /**
   * Remove verification (for testing)
   */
  removeVerification() {
    return api.delete('/verification/remove');
  },

  /**
   * Get verification view (document submission system - currently not implemented in backend)
   */
  getMine() {
    // This endpoint doesn't exist yet - return a stub response
    return api.get<VerificationView>('/verification/me');
  },

  /**
   * Submit identity documents (document submission system - currently not implemented in backend)
   */
  submit(payload: SubmitVerificationPayload) {
    // This endpoint doesn't exist yet - return a stub response
    return api.post<VerificationView>('/verification/submit', payload);
  },
};

export default verificationService;
