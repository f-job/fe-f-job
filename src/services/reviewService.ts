import api from './api';
import type {
  CreateReviewPayload,
  Paginated,
  ReviewView,
  TrustView,
} from '@/types/api';

/**
 * Reviews & Trust Score API — Capability 1 (reviewer + authenticated read).
 * Backend routes live on the `/reviews` and `/profiles/:userId/trust` paths.
 * All endpoints require a valid JWT (JwtAuthGuard + BlockedUserGuard).
 */
const reviewService = {
  /** POST /reviews — leave a review for a Completed application (CANDIDATE | EMPLOYER). */
  create(payload: CreateReviewPayload) {
    return api.post<ReviewView>('/reviews', payload);
  },

  /** GET /reviews — a reviewee's visible reviews, newest-first, paginated (default 10, max 100). */
  listForReviewee(revieweeId: string, page = 1, limit = 10) {
    return api.get<Paginated<ReviewView>>('/reviews', {
      params: { revieweeId, page, limit },
    });
  },

  /** GET /profiles/:userId/trust — trust aggregates + composed verified badge. */
  getTrust(userId: string) {
    return api.get<TrustView>(`/profiles/${userId}/trust`);
  },
};

export default reviewService;
