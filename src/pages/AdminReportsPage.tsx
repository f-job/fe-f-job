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
  PaginationMeta,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  ReportView,
} from '@/types/api';
import { formatDateTime, getEntityId, getErrorMessage } from '@utils/format';

const MAX_REASON = 1000;

const STATUS_FILTERS: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'OPEN', label: 'Mới' },
  { value: 'UNDER_REVIEW', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
  { value: 'DISMISSED', label: 'Đã bỏ qua' },
];

const TARGET_FILTERS: { value: ReportTargetType | 'all'; label: string }[] = [
  { value: 'all', label: 'Mọi đối tượng' },
  { value: 'JOB', label: 'Tin tuyển dụng' },
  { value: 'USER', label: 'Người dùng' },
];

function statusVariant(status: ReportStatus): string {
  switch (status) {
    case 'OPEN': return 'secondary';
    case 'UNDER_REVIEW': return 'info';
    case 'RESOLVED': return 'success';
    case 'DISMISSED': return 'dark';
    default: return 'secondary';
  }
}

function statusLabel(status: ReportStatus): string {
  switch (status) {
    case 'OPEN': return 'Mới';
    case 'UNDER_REVIEW': return 'Đang xử lý';
    case 'RESOLVED': return 'Đã xử lý';
    case 'DISMISSED': return 'Đã bỏ qua';
    default: return status;
  }
}

function targetTypeLabel(type: ReportTargetType): string {
  return type === 'JOB' ? 'Tin tuyển dụng' : 'Người dùng';
}

function reasonLabel(reason: ReportReason): string {
  switch (reason) {
    case 'SCAM': return 'Lừa đảo';
    case 'FAKE_JOB': return 'Tin giả';
    case 'ABUSE': return 'Lạm dụng';
    case 'HARASSMENT': return 'Quấy rối';
    case 'INAPPROPRIATE': return 'Không phù hợp';
    case 'SPAM': return 'Spam';
    case 'OTHER': return 'Khác';
    default: return reason;
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportView[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [targetFilter, setTargetFilter] = useState<ReportTargetType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dismissing, setDismissing] = useState<ReportView | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (
      targetPage: number,
      status: ReportStatus | 'all',
      targetType: ReportTargetType | 'all',
    ) => {
      setLoading(true);
      setError('');
      try {
        const res = await adminModerationService.reportQueue({
          status: status === 'all' ? undefined : status,
          targetType: targetType === 'all' ? undefined : targetType,
          page: targetPage,
          limit: 10,
        });
        setReports(res.data.data);
        setMeta(res.data.meta);
        setPage(targetPage);
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải danh sách báo cáo'));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1, statusFilter, targetFilter);
  }, [load, statusFilter, targetFilter]);

  const handleReview = async (report: ReportView) => {
    try {
      await adminModerationService.reviewReport(getEntityId(report));
      toast.success('Đã tiếp nhận báo cáo');
      await load(page, statusFilter, targetFilter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tiếp nhận báo cáo'));
    }
  };

  const handleResolve = async (report: ReportView) => {
    const label = targetTypeLabel(report.targetType).toLowerCase();
    if (!window.confirm(`Xử lý báo cáo này sẽ chặn ${label} bị báo cáo. Tiếp tục?`)) {
      return;
    }
    try {
      await adminModerationService.resolveReport(getEntityId(report));
      toast.success('Đã xử lý và chặn đối tượng bị báo cáo');
      await load(page, statusFilter, targetFilter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xử lý báo cáo'));
    }
  };

  const handleDismiss = async () => {
    if (!dismissing) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Vui lòng nhập lý do bỏ qua');
      return;
    }
    setSubmitting(true);
    try {
      await adminModerationService.dismissReport(getEntityId(dismissing), trimmed);
      toast.success('Đã bỏ qua báo cáo');
      setDismissing(null);
      setReason('');
      await load(page, statusFilter, targetFilter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể bỏ qua báo cáo'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Hàng đợi báo cáo</h1>
          <p className="text-muted mb-0">Tiếp nhận, xử lý hoặc bỏ qua các báo cáo vi phạm.</p>
        </div>
        <Button variant="outline-secondary" onClick={() => load(page, statusFilter, targetFilter)}>
          <i className="bi bi-arrow-clockwise me-2" />Tải lại
        </Button>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={statusFilter === f.value ? 'primary' : 'outline-secondary'}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <div className="d-flex gap-2 flex-wrap mb-3">
        {TARGET_FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={targetFilter === f.value ? 'dark' : 'outline-secondary'}
            onClick={() => setTargetFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : reports.length === 0 ? (
            <Alert variant="info" className="mb-0">Không có báo cáo nào trong mục này.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Lý do</th>
                  <th>Mô tả</th>
                  <th>Đối tượng</th>
                  <th>Target ID</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={getEntityId(report)}>
                    <td className="fw-500 text-nowrap">{reasonLabel(report.reason)}</td>
                    <td style={{ maxWidth: 240 }}>
                      <div className="text-truncate" title={report.description}>
                        {report.description || <span className="text-muted">—</span>}
                      </div>
                    </td>
                    <td>{targetTypeLabel(report.targetType)}</td>
                    <td className="text-muted small">{report.targetId}</td>
                    <td>
                      <Badge bg={statusVariant(report.status)}>{statusLabel(report.status)}</Badge>
                    </td>
                    <td className="text-nowrap small">{formatDateTime(report.createdAt)}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2 flex-wrap">
                        {report.status === 'OPEN' && (
                          <Button size="sm" variant="outline-info" onClick={() => handleReview(report)}>
                            Tiếp nhận
                          </Button>
                        )}
                        {(report.status === 'OPEN' || report.status === 'UNDER_REVIEW') && (
                          <>
                            <Button size="sm" variant="outline-danger" onClick={() => handleResolve(report)}>
                              Xử lý &amp; chặn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              onClick={() => {
                                setDismissing(report);
                                setReason('');
                              }}
                            >
                              Bỏ qua
                            </Button>
                          </>
                        )}
                        {(report.status === 'RESOLVED' || report.status === 'DISMISSED') && (
                          <span className="text-muted small">Đã đóng</span>
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
            onClick={() => load(page - 1, statusFilter, targetFilter)}
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
            onClick={() => load(page + 1, statusFilter, targetFilter)}
          >
            Trang sau
          </Button>
        </div>
      )}

      {/* Dismiss reason modal */}
      <Modal show={!!dismissing} onHide={() => setDismissing(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Bỏ qua báo cáo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">
            Lý do báo cáo: <strong>{dismissing ? reasonLabel(dismissing.reason) : ''}</strong>
          </p>
          <Form.Group>
            <Form.Label>
              Lý do bỏ qua <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              maxLength={MAX_REASON}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vd: Báo cáo không có cơ sở, không vi phạm..."
            />
            <Form.Text className="text-muted">
              {reason.length}/{MAX_REASON} ký tự
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setDismissing(null)}>Hủy</Button>
          <Button variant="secondary" onClick={handleDismiss} disabled={submitting || !reason.trim()}>
            {submitting ? 'Đang xử lý...' : 'Bỏ qua'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
