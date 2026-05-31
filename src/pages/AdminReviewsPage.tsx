import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  InputGroup,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import adminModerationService from '@services/adminModerationService';
import type { AdminReview, PaginationMeta, ReviewDirection } from '@/types/api';
import { formatDateTime, getEntityId, getErrorMessage } from '@utils/format';

type HiddenFilter = 'all' | 'visible' | 'hidden';

const FILTERS: { value: HiddenFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'visible', label: 'Đang hiển thị' },
  { value: 'hidden', label: 'Đã ẩn' },
];

const MAX_REASON = 1000;

function directionLabel(direction: ReviewDirection): string {
  return direction === 'CANDIDATE_TO_EMPLOYER'
    ? 'Ứng viên → NTD'
    : 'NTD → Ứng viên';
}

function renderStars(rating: number): string {
  const safe = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(safe) + '☆'.repeat(5 - safe);
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<HiddenFilter>('all');
  const [revieweeId, setRevieweeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [hiding, setHiding] = useState<AdminReview | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (targetPage: number, f: HiddenFilter, reviewee: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await adminModerationService.adminListReviews({
          hidden: f === 'all' ? undefined : f === 'hidden',
          revieweeId: reviewee.trim() || undefined,
          page: targetPage,
          limit: 10,
        });
        setReviews(res.data.data);
        setMeta(res.data.meta);
        setPage(targetPage);
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải danh sách đánh giá'));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1, filter, revieweeId);
  }, [load, filter, revieweeId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setRevieweeId(searchTerm);
  };

  const handleHide = async () => {
    if (!hiding) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập lý do ẩn đánh giá');
      return;
    }
    setSubmitting(true);
    try {
      await adminModerationService.hideReview(getEntityId(hiding), trimmed);
      toast.success('Đã ẩn đánh giá');
      setHiding(null);
      setReason('');
      await load(page, filter, revieweeId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ẩn đánh giá'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async (review: AdminReview) => {
    try {
      await adminModerationService.restoreReview(getEntityId(review));
      toast.success('Đã khôi phục đánh giá');
      await load(page, filter, revieweeId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể khôi phục đánh giá'));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Kiểm duyệt đánh giá</h1>
          <p className="text-muted mb-0">Ẩn hoặc khôi phục các đánh giá vi phạm.</p>
        </div>
        <Button variant="outline-secondary" onClick={() => load(page, filter, revieweeId)}>
          <i className="bi bi-arrow-clockwise me-2" />Tải lại
        </Button>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3 align-items-center">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'primary' : 'outline-secondary'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
        <Form className="ms-auto" style={{ minWidth: 280 }} onSubmit={handleSearch}>
          <InputGroup size="sm">
            <Form.Control
              placeholder="Lọc theo ID người được đánh giá"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" variant="outline-secondary">
              <i className="bi bi-search" />
            </Button>
            {revieweeId && (
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setRevieweeId('');
                }}
              >
                <i className="bi bi-x-lg" />
              </Button>
            )}
          </InputGroup>
        </Form>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : reviews.length === 0 ? (
            <Alert variant="info" className="mb-0">Không có đánh giá nào trong mục này.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Điểm</th>
                  <th>Nội dung</th>
                  <th>Người được đánh giá</th>
                  <th>Chiều</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={getEntityId(review)}>
                    <td className="text-warning text-nowrap" title={`${review.rating}/5`}>
                      {renderStars(review.rating)}
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div className="text-truncate" title={review.comment}>
                        {review.comment || <span className="text-muted">(không có nội dung)</span>}
                      </div>
                    </td>
                    <td className="text-muted small">{review.revieweeId}</td>
                    <td className="small">{directionLabel(review.direction)}</td>
                    <td>
                      {review.hidden ? (
                        <Badge bg="dark">Đã ẩn</Badge>
                      ) : (
                        <Badge bg="success">Hiển thị</Badge>
                      )}
                    </td>
                    <td className="text-nowrap small">{formatDateTime(review.createdAt)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2 flex-wrap">
                        {review.hidden ? (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => handleRestore(review)}
                          >
                            Khôi phục
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-dark"
                            onClick={() => {
                              setHiding(review);
                              setReason('');
                            }}
                          >
                            Ẩn
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => load(page - 1, filter, revieweeId)}
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
            onClick={() => load(page + 1, filter, revieweeId)}
          >
            Trang sau
          </Button>
        </div>
      )}

      {/* Hide reason modal */}
      <Modal show={!!hiding} onHide={() => setHiding(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Ẩn đánh giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>
              Lý do ẩn <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              maxLength={MAX_REASON}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vd: Nội dung xúc phạm, spam, sai sự thật..."
            />
            <Form.Text className="text-muted">
              {reason.length}/{MAX_REASON} ký tự
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setHiding(null)}>Hủy</Button>
          <Button variant="dark" onClick={handleHide} disabled={submitting || !reason.trim()}>
            {submitting ? 'Đang xử lý...' : 'Ẩn đánh giá'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
