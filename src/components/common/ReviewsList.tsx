import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import reviewService from '@services/reviewService';
import type { PaginationMeta, ReviewView } from '@/types/api';
import { formatDateTime, getErrorMessage } from '@utils/format';

interface ReviewsListProps {
  /** The User._id whose visible reviews should be listed. */
  revieweeId: string;
  /** Page size (default 10, max 100 server-side). */
  limit?: number;
}

/** Render a 5-star line for a 1–5 rating, rounded to the nearest whole star. */
function renderStars(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/**
 * Presentational paginated reviews list — fetches GET /reviews for a reviewee
 * (visible-only, newest-first) and renders each review's stars, reviewer name,
 * timestamp, and comment with prev/next pagination.
 */
export default function ReviewsList({ revieweeId, limit = 10 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (targetPage: number) => {
      if (!revieweeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const { data } = await reviewService.listForReviewee(revieweeId, targetPage, limit);
        setReviews(data.data);
        setMeta(data.meta);
        setPage(targetPage);
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải đánh giá'));
      } finally {
        setLoading(false);
      }
    },
    [revieweeId, limit],
  );

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body>
        <h6 className="fw-bold mb-3">Đánh giá</h6>

        {loading ? (
          <div className="text-center py-4">
            <Spinner />
            <p className="text-muted small mt-3 mb-0">Đang tải đánh giá...</p>
          </div>
        ) : error ? (
          <Alert variant="danger" className="mb-0">
            {error}
          </Alert>
        ) : reviews.length === 0 ? (
          <p className="text-muted small mb-0">Chưa có đánh giá nào.</p>
        ) : (
          <>
            {reviews.map((review) => (
              <div key={review.id} className="border-start border-3 border-warning ps-3 mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <strong>{review.reviewerDisplayName}</strong>
                  <span className="text-warning">{renderStars(review.rating)}</span>
                </div>
                <div className="text-muted small">{formatDateTime(review.createdAt)}</div>
                {review.comment ? (
                  <div className="small mt-1">{review.comment}</div>
                ) : (
                  <div className="small mt-1 text-muted fst-italic">Không có nhận xét</div>
                )}
              </div>
            ))}

            {meta && meta.totalPages > 1 && (
              <div className="d-flex justify-content-center gap-2 mt-3">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                >
                  Trang trước
                </Button>
                <span className="align-self-center small text-muted">
                  Trang {meta.page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => load(page + 1)}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}
