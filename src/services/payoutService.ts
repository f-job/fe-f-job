import api from './api';
import type {
  Paginated,
  Payout,
  PayoutEligibility,
  PayoutSettings,
} from '@/types/api';

/** Minimum payout amount enforced by the backend (VND). */
export const MIN_PAYOUT_AMOUNT = 50_000;

/**
 * Payout / withdrawal API — backend prefix `/payouts`.
 * All endpoints require an authenticated token.
 */
const payoutService = {
  /** POST /payouts/request — submit a withdrawal request. */
  request(amount: number) {
    return api.post<Payout>('/payouts/request', { amount });
  },

  /** GET /payouts/my — paginated payout history. */
  list(page = 1, limit = 10) {
    return api.get<Paginated<Payout>>('/payouts/my', { params: { page, limit } });
  },

  /** GET /payouts/my/settings — saved bank account (null if not set). */
  getSettings() {
    return api.get<PayoutSettings | null>('/payouts/my/settings');
  },

  /** PUT /payouts/my/settings — create / replace bank account. */
  updateSettings(payload: Omit<PayoutSettings, '_id' | 'id' | 'userId' | 'updatedAt'>) {
    return api.put<PayoutSettings>('/payouts/my/settings', payload);
  },

  /** GET /payouts/my/settings/validate — pre-flight eligibility check. */
  validate() {
    return api.get<PayoutEligibility>('/payouts/my/settings/validate');
  },

  /** GET /payouts/my/:id — single payout detail. */
  getById(id: string) {
    return api.get<Payout>(`/payouts/my/${id}`);
  },
};

export default payoutService;
