import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import adminModerationService from '@services/adminModerationService';
import type { AuditAction, AuditLog, PaginationMeta } from '@/types/api';
import { formatDateTime, getEntityId, getErrorMessage } from '@utils/format';

const ACTIONS: { value: AuditAction; label: string }[] = [
  { value: 'REVIEW_HIDDEN', label: 'Ẩn đánh giá' },
  { value: 'REVIEW_RESTORED', label: 'Khôi phục đánh giá' },
  { value: 'VERIFICATION_APPROVED', label: 'Duyệt xác minh' },
  { value: 'VERIFICATION_REJECTED', label: 'Từ chối xác minh' },
  { value: 'REPORT_RESOLVED', label: 'Xử lý báo cáo' },
  { value: 'REPORT_DISMISSED', label: 'Bỏ qua báo cáo' },
  { value: 'APPLICATION_COMPLETED', label: 'Hoàn thành công việc' },
  { value: 'APPLICATION_NOSHOW', label: 'Vắng mặt' },
];

function actionLabel(action: AuditAction): string {
  return ACTIONS.find((a) => a.value === action)?.label ?? action;
}

function actionVariant(action: AuditAction): string {
  if (action.endsWith('REJECTED') || action.endsWith('NOSHOW') || action.endsWith('HIDDEN')) {
    return 'danger';
  }
  if (action.endsWith('APPROVED') || action.endsWith('RESTORED') || action.endsWith('COMPLETED')) {
    return 'success';
  }
  return 'secondary';
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Applied filters
  const [action, setAction] = useState<AuditAction | ''>('');
  const [actorId, setActorId] = useState('');
  const [targetId, setTargetId] = useState('');

  // Draft inputs (search fields)
  const [actorInput, setActorInput] = useState('');
  const [targetInput, setTargetInput] = useState('');

  const load = useCallback(
    async (targetPage: number, a: AuditAction | '', actor: string, target: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await adminModerationService.auditLogs({
          action: a || undefined,
          actorId: actor.trim() || undefined,
          targetId: target.trim() || undefined,
          page: targetPage,
          limit: 20,
        });
        setLogs(res.data.data);
        setMeta(res.data.meta);
        setPage(targetPage);
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải nhật ký'));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1, action, actorId, targetId);
  }, [load, action, actorId, targetId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActorId(actorInput);
    setTargetId(targetInput);
  };

  const handleReset = () => {
    setActorInput('');
    setTargetInput('');
    setActorId('');
    setTargetId('');
    setAction('');
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Nhật ký kiểm duyệt</h1>
          <p className="text-muted mb-0">Lịch sử thao tác kiểm duyệt (chỉ đọc).</p>
        </div>
        <Button variant="outline-secondary" onClick={() => load(page, action, actorId, targetId)}>
          <i className="bi bi-arrow-clockwise me-2" />Tải lại
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Form.Label className="small mb-1">Hành động</Form.Label>
                <Form.Select
                  size="sm"
                  value={action}
                  onChange={(e) => setAction(e.target.value as AuditAction | '')}
                >
                  <option value="">Tất cả</option>
                  {ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small mb-1">Người thực hiện (actorId)</Form.Label>
                <Form.Control
                  size="sm"
                  value={actorInput}
                  onChange={(e) => setActorInput(e.target.value)}
                  placeholder="ID admin"
                />
              </Col>
              <Col md={3}>
                <Form.Label className="small mb-1">Đối tượng (targetId)</Form.Label>
                <Form.Control
                  size="sm"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="ID đối tượng"
                />
              </Col>
              <Col md={3} className="d-flex gap-2">
                <Button type="submit" size="sm" variant="primary">
                  <i className="bi bi-search me-1" />Lọc
                </Button>
                <Button type="button" size="sm" variant="outline-secondary" onClick={handleReset}>
                  Đặt lại
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : logs.length === 0 ? (
            <Alert variant="info" className="mb-0">Không có nhật ký nào.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Người thực hiện</th>
                  <th>Hành động</th>
                  <th>Loại đối tượng</th>
                  <th>Target ID</th>
                  <th>Lý do</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={getEntityId(log)}>
                    <td className="text-nowrap small">{formatDateTime(log.createdAt)}</td>
                    <td className="text-muted small">{log.actorId}</td>
                    <td>
                      <Badge bg={actionVariant(log.action)}>{actionLabel(log.action)}</Badge>
                    </td>
                    <td className="small">{log.targetType}</td>
                    <td className="text-muted small">{log.targetId}</td>
                    <td style={{ maxWidth: 260 }}>
                      <div className="text-truncate" title={log.reason}>
                        {log.reason || <span className="text-muted">—</span>}
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
            onClick={() => load(page - 1, action, actorId, targetId)}
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
            onClick={() => load(page + 1, action, actorId, targetId)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </>
  );
}
