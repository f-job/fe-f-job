import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';
import reviewService from '@services/reviewService';
import { getErrorMessage } from '@utils/format';

const COMMENT_MAX = 1000;

/**
 * Friendly Vietnamese copy for the review-specific backend error codes.
 * The backend returns errors as `{ errorCode, message }`; we surface a clear
 * message for the codes the review flow can hit and otherwise fall back to the
 * server message (via getErrorMessage).
 */
const REVIEW_ERROR_COPY: Record<string, string> = {
  ERR_5001: 'Chỉ có thể đánh giá khi công việc đã hoàn thành.',
  ERR_4002: 'Bạn đã đánh giá đơn ứng tuyển này rồi.',
  ERR_2001: 'Bạn không có quyền đánh giá đơn ứng tuyển này.',
  ERR_2003: 'Tài khoản của bạn đang bị khóa.',
};

/** Pull the backend errorCode → friendly message, else the raw server message. */
function resolveReviewError(error: unknown): string {
  const errorCode = (
    error as { response?: { data?: { errorCode?: string } } }
  ).response?.data?.errorCode;
  if (errorCode && REVIEW_ERROR_COPY[errorCode]) {
    return REVIEW_ERROR_COPY[errorCode];
  }
  return getErrorMessage(error, 'Không thể gửi đánh giá. Vui lòng thử lại.');
}

interface ReviewFormModalProps {
  show: boolean;
  /** The Completed application being reviewed. */
  applicationId: string;
  /** Contextual heading, e.g. "Đánh giá ứng viên" for employers. */
  title?: string;
  onClose: () => void;
  /** Called after a review is successfully created (e.g. to reload the list). */
  onSubmitted?: () => void;
}

/**
 * Star-rating review submission form (Req 1, 6.7).
 *
 * A 1–5 star selector (required) plus an optional comment (≤1000 chars with a
 * live counter). Posts to POST /reviews; the backend resolves direction and
 * reviewee from the Completed application.
 */
export default function ReviewFormModal({
  show,
  applicationId,
  title = 'Đánh giá công việc',
  onClose,
  onSubmitted,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset the form each time the modal is (re)opened.
  useEffect(() => {
    if (show) {
      setRating(0);
      setHover(0);
      setComment('');
      setError('');
      setSubmitting(false);
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;
    setSubmitting(true);
    setError('');
    try {
      const trimmed = comment.trim();
      await reviewService.create({
        applicationId,
        rating,
        ...(trimmed ? { comment: trimmed } : {}),
      });
      toast.success('Đã gửi đánh giá. Cảm ơn bạn!');
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(resolveReviewError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h6">{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label className="d-block">
              Mức đánh giá <span className="text-danger">*</span>
            </Form.Label>
            <div
              className="fs-3 lh-1"
              role="radiogroup"
              aria-label="Chọn số sao đánh giá từ 1 đến 5"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hover || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    className="btn btn-link p-0 me-1 border-0 text-decoration-none"
                    style={{
                      color: filled ? '#ffc107' : '#d0d0d0',
                      lineHeight: 1,
                    }}
                    aria-label={`${star} sao`}
                    aria-pressed={star === rating}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >
                    {filled ? '★' : '☆'}
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <Form.Text className="text-muted">{rating}/5 sao</Form.Text>
            )}
          </Form.Group>

          <Form.Group>
            <Form.Label>Nhận xét (không bắt buộc)</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              maxLength={COMMENT_MAX}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về công việc này..."
            />
            <Form.Text className="text-muted d-block text-end">
              {comment.length}/{COMMENT_MAX}
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || rating < 1 || rating > 5}
          >
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
