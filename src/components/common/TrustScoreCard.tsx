import { useEffect, useState } from 'react';
import { Badge, Card, Spinner } from 'react-bootstrap';
import reviewService from '@services/reviewService';
import type { TrustView } from '@/types/api';
import { getErrorMessage } from '@utils/format';

interface TrustScoreCardProps {
  /** The User._id whose trust aggregates should be displayed. */
  userId: string;
}

/** Render a 5-star line for a 0–5 rating, rounded to the nearest whole star. */
function renderStars(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/**
 * Presentational trust summary card — fetches GET /profiles/:userId/trust and
 * renders the Trust Score, a star rendering of the average rating, the review
 * count, a provisional hint, and the composed Verified badge.
 */
export default function TrustScoreCard({ userId }: TrustScoreCardProps) {
  const [trust, setTrust] = useState<TrustView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    reviewService
      .getTrust(userId)
      .then(({ data }) => {
        if (active) setTrust(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Không thể tải điểm uy tín'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Điểm uy tín</h6>
          {trust?.verified && (
            <Badge bg="success" className="d-flex align-items-center gap-1">
              <i className="bi bi-patch-check"></i>Đã xác minh
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="text-center py-3">
            <Spinner size="sm" />
            <p className="text-muted small mt-2 mb-0">Đang tải...</p>
          </div>
        ) : error ? (
          <p className="text-muted small mb-0">{error}</p>
        ) : trust ? (
          <div className="text-center">
            <div className="display-5 fw-bold text-primary lh-1">
              {trust.trustScore}
              <span className="fs-6 fw-normal text-muted">/100</span>
            </div>
            <div className="text-warning fs-5 mt-2">{renderStars(trust.averageRating)}</div>
            <div className="text-muted small">
              {trust.averageRating.toFixed(1)} · {trust.reviewCount} đánh giá
            </div>
            {trust.provisional && (
              <Badge bg="warning" text="dark" className="mt-2">
                <i className="bi bi-hourglass-split me-1"></i>Tạm tính
              </Badge>
            )}
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
