import api from './api';
import type {
  Paginated,
  ReferralHistoryItem,
  ReferralInfo,
} from '@/types/api';

/**
 * Referral program API — backend prefix `/referrals`.
 * `POST /referrals/apply` is CANDIDATE-only; the rest require any auth token.
 */
const referralService = {
  /** POST /referrals/apply — apply a friend's referral code (Candidate). */
  apply(referralCode: string) {
    return api.post<{ message: string; rewardAmount: number }>(
      '/referrals/apply',
      { referralCode },
    );
  },

  /** GET /referrals/my — own code + invite URL + summary. */
  getMine() {
    return api.get<ReferralInfo>('/referrals/my');
  },

  /** GET /referrals/history — paginated referral log. */
  history(page = 1, limit = 10) {
    return api.get<Paginated<ReferralHistoryItem>>('/referrals/history', {
      params: { page, limit },
    });
  },

  /** GET /referrals/balance — current reward wallet balance. */
  balance() {
    return api.get<{ referralBalance: number }>('/referrals/balance');
  },
};

export default referralService;
