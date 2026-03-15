import {
  getScoreChange,
  CREDIT_SCORE_CHANGES,
  CREDIT_SCORE_REASON_LABELS,
  INITIAL_CREDIT_SCORE,
  type CreditScoreReason,
} from '@/lib/creditScore';

describe('Credit Score Rules', () => {
  describe('INITIAL_CREDIT_SCORE', () => {
    it('should be 0 for new accounts', () => {
      expect(INITIAL_CREDIT_SCORE).toBe(0);
    });
  });

  describe('CREDIT_SCORE_CHANGES', () => {
    it('awards +1 for job completion', () => {
      expect(CREDIT_SCORE_CHANGES.job_complete).toBe(1);
    });

    it('awards +0.5 for 5-star rating', () => {
      expect(CREDIT_SCORE_CHANGES.five_star_rating).toBe(0.5);
    });

    it('deducts -2 for no-show', () => {
      expect(CREDIT_SCORE_CHANGES.no_show).toBe(-2);
    });

    it('deducts -0.5 for late cancellation', () => {
      expect(CREDIT_SCORE_CHANGES.late_cancel).toBe(-0.5);
    });
  });

  describe('CREDIT_SCORE_REASON_LABELS', () => {
    it('has Vietnamese labels for all reasons', () => {
      const reasons: CreditScoreReason[] = [
        'job_complete',
        'five_star_rating',
        'no_show',
        'late_cancel',
      ];
      for (const reason of reasons) {
        expect(CREDIT_SCORE_REASON_LABELS[reason]).toBeTruthy();
        expect(typeof CREDIT_SCORE_REASON_LABELS[reason]).toBe('string');
      }
    });
  });

  describe('getScoreChange', () => {
    it('returns +1 for job_complete', () => {
      expect(getScoreChange('job_complete')).toBe(1);
    });

    it('returns +0.5 for five_star_rating', () => {
      expect(getScoreChange('five_star_rating')).toBe(0.5);
    });

    it('returns -2 for no_show', () => {
      expect(getScoreChange('no_show')).toBe(-2);
    });

    it('returns -0.5 for late_cancel', () => {
      expect(getScoreChange('late_cancel')).toBe(-0.5);
    });

    it('returns null for unknown reason', () => {
      expect(getScoreChange('unknown_reason')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(getScoreChange('')).toBeNull();
    });
  });
});
