import type { TrustLevel } from './types';

/**
 * Maps a credit score to the corresponding trust level tier.
 *
 * Tiers:
 *   New         0–10
 *   Trustworthy 11–30
 *   Reputable   31–50
 *   Excellent   51–100
 *   Top Worker  >100
 */
export function getTrustLevel(creditScore: number): TrustLevel {
  if (creditScore > 100) return 'top_worker';
  if (creditScore >= 51) return 'excellent';
  if (creditScore >= 31) return 'reputable';
  if (creditScore >= 11) return 'trustworthy';
  return 'new';
}

// --- Credit Score Change Rules ---

export type CreditScoreReason =
  | 'job_complete'
  | 'five_star_rating'
  | 'no_show'
  | 'late_cancel';

export const CREDIT_SCORE_CHANGES: Record<CreditScoreReason, number> = {
  job_complete: 1,
  five_star_rating: 0.5,
  no_show: -2,
  late_cancel: -0.5,
};

export const CREDIT_SCORE_REASON_LABELS: Record<CreditScoreReason, string> = {
  job_complete: 'Hoàn thành công việc',
  five_star_rating: 'Nhận đánh giá 5 sao',
  no_show: 'Không đến làm việc',
  late_cancel: 'Hủy việc muộn',
};

/** Initial credit score for new accounts */
export const INITIAL_CREDIT_SCORE = 0;

/**
 * Validates that a reason is a known credit score reason
 * and returns the corresponding score change.
 * Returns null if the reason is invalid.
 */
export function getScoreChange(reason: string): number | null {
  if (reason in CREDIT_SCORE_CHANGES) {
    return CREDIT_SCORE_CHANGES[reason as CreditScoreReason];
  }
  return null;
}
