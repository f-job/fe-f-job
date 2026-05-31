import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import adminModerationService from '@services/adminModerationService';
import type {
  IdentityDocument,
  PaginationMeta,
  VerificationQueueItem,
} from '@/types/api';
import { formatDateTime, getErrorMessage } from '@utils/format';

const MAX_REASON = 1000;

function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminVerificationsPage() {
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Document viewer modal
  const [viewing, setViewing] = useState<VerificationQueueItem | null>(null);
  const [documents, setDocuments] = useState<IdentityDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');

  // Reject reason modal
  const [rejecting, setRejecting] = useState<VerificationQueueItem | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminModerationService.verificationQueue(targetPage, 10);
      setQueue(res.data.data);
      setMeta(res.data.meta);
      setPage(targetPage);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải hàng đợi xác minh'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const openDocuments = async (item: VerificationQueueItem) => {
    setViewing(item);
    setDocuments([]);
    setDocsError('');
    setDocsLoading(true);
    try {
      const res = await adminModerationService.getVerificationDocuments(item.userId);
      setDocuments(res.data);
    } catch (err) {
      setDocsError(getErrorMessage(err, 'Không thể tải tài liệu'));
    } finally {
      setDocsLoading(false);
    }
  };

  const handleApprove = async (item: VerificationQueueItem) => {
    try {
      await adminModerationService.approveVerification(item.userId);
      toast.success('Đã duyệt xác minh danh tính');
      await load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể duyệt xác minh'));
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setSubmitting(true);
    try {
      await adminModerationService.rejectVerification(rejecting.userId, trimmed);
      toast.success('Đã từ chối xác minh');
      setRejecting(null);
      setReason('');
      await load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể từ chối xác minh'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Hàng đợi xác minh</h1>
          <p className="text-muted mb-0">Xem tài liệu và duyệt / từ chối yêu cầu xác minh danh tính.</p>
        </div>
        <Button variant="outline-secondary" onClick={() => load(page)}>
          <i className="bi bi-arrow-clockwise me-2" />Tải lại
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : queue.length === 0 ? (
            <Alert variant="info" className="mb-0">Không có yêu cầu xác minh nào đang chờ.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Ứng viên</th>
                  <th>User ID</th>
                  <th>Ngày gửi</th>
                  <th>Số tài liệu</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.userId}>
                    <td className="fw-500">{item.fullName}</td>
                    <td className="text-muted small">{item.userId}</td>
                    <td className="text-nowrap small">{formatDateTime(item.verificationSubmittedAt)}</td>
                    <td>
                      <Badge bg="secondary">{item.documentCount}</Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2 flex-wrap">
                        <Button size="sm" variant="outline-secondary" onClick={() => openDocuments(item)}>
                          Xem tài liệu
                        </Button>
                        <Button size="sm" variant="outline-success" onClick={() => handleApprove(item)}>
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => {
                            setRejecting(item);
                            setReason('');
                          }}
                        >
                          Từ chối
                        </Button>
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
          <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1)}>
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

      {/* Document viewer modal */}
      <Modal show={!!viewing} onHide={() => setViewing(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6">Tài liệu của {viewing?.fullName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {docsLoading ? (
            <div className="text-center py-4">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải tài liệu...</p>
            </div>
          ) : docsError ? (
            <Alert variant="danger" className="mb-0">{docsError}</Alert>
          ) : documents.length === 0 ? (
            <Alert variant="info" className="mb-0">Không có tài liệu nào.</Alert>
          ) : (
            <Table responsive className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Tên tệp</th>
                  <th>Định dạng</th>
                  <th>Dung lượng</th>
                  <th className="text-end">Liên kết</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, idx) => (
                  <tr key={doc._id ?? doc.id ?? `${doc.fileUrl}-${idx}`}>
                    <td className="text-break">{doc.fileName}</td>
                    <td className="small text-muted">{doc.mimeType}</td>
                    <td className="small">{formatFileSize(doc.fileSize)}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="bi bi-box-arrow-up-right me-1" />Mở
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          {viewing && (
            <>
              <Button
                variant="success"
                onClick={() => {
                  handleApprove(viewing);
                  setViewing(null);
                }}
              >
                Duyệt
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setRejecting(viewing);
                  setReason('');
                  setViewing(null);
                }}
              >
                Từ chối
              </Button>
            </>
          )}
          <Button variant="outline-secondary" onClick={() => setViewing(null)}>Đóng</Button>
        </Modal.Footer>
      </Modal>

      {/* Reject reason modal */}
      <Modal show={!!rejecting} onHide={() => setRejecting(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Từ chối xác minh</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">Ứng viên: <strong>{rejecting?.fullName}</strong></p>
          <Form.Group>
            <Form.Label>
              Lý do từ chối <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              maxLength={MAX_REASON}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vd: Tài liệu mờ, không khớp thông tin..."
            />
            <Form.Text className="text-muted">
              {reason.length}/{MAX_REASON} ký tự
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setRejecting(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleReject} disabled={submitting || !reason.trim()}>
            {submitting ? 'Đang xử lý...' : 'Từ chối'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
