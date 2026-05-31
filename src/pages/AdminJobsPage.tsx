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
import adminJobService from '@services/adminJobService';
import type { BackendJob, JobStatus, PaginationMeta } from '@/types/api';
import { jobStatusLabel, jobStatusVariant } from '@/types/api';
import { formatDate, formatSalary, getEntityId, getErrorMessage } from '@utils/format';

const FILTERS: { value: JobStatus | 'pending' | 'all'; label: string }[] = [
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'draft', label: 'Bị từ chối' },
  { value: 'closed', label: 'Đã đóng' },
];

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<JobStatus | 'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<BackendJob | null>(null);
  const [rejecting, setRejecting] = useState<BackendJob | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(
    async (targetPage: number, f: JobStatus | 'pending' | 'all') => {
      setLoading(true);
      setError('');
      try {
        const res =
          f === 'pending'
            ? await adminJobService.pending(targetPage, 10)
            : await adminJobService.list({
                status: f === 'all' ? undefined : f,
                page: targetPage,
                limit: 10,
              });
        setJobs(res.data.data);
        setMeta(res.data.meta);
        setPage(targetPage);
      } catch (err) {
        setError(getErrorMessage(err, 'Không thể tải danh sách tin'));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    load(1, filter);
  }, [load, filter]);

  const handleApprove = async (job: BackendJob) => {
    try {
      await adminJobService.approve(getEntityId(job));
      toast.success('Đã duyệt — tin đã được hiển thị công khai');
      await load(page, filter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể duyệt tin'));
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    setSubmitting(true);
    try {
      await adminJobService.reject(getEntityId(rejecting), reason.trim() || undefined);
      toast.success('Đã từ chối tin');
      setRejecting(null);
      setReason('');
      await load(page, filter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể từ chối tin'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleHide = async (job: BackendJob) => {
    const r = window.prompt(`Lý do ẩn tin "${job.title}"? (tùy chọn)`);
    if (r === null) return;
    try {
      await adminJobService.hide(getEntityId(job), r.trim() || undefined);
      toast.success('Đã ẩn tin');
      await load(page, filter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể ẩn tin'));
    }
  };

  const handleToggleUrgent = async (job: BackendJob) => {
    try {
      await adminJobService.setUrgent(getEntityId(job), !job.isUrgent);
      toast.success(job.isUrgent ? 'Đã bỏ nhãn gấp' : 'Đã đánh dấu tuyển gấp');
      await load(page, filter);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật nhãn gấp'));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Duyệt tin tuyển dụng</h1>
          <p className="text-muted mb-0">Phê duyệt, từ chối hoặc ẩn các tin tuyển dụng.</p>
        </div>
        <Button variant="outline-secondary" onClick={() => load(page, filter)}>
          <i className="bi bi-arrow-clockwise me-2" />Tải lại
        </Button>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3">
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
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : jobs.length === 0 ? (
            <Alert variant="info" className="mb-0">Không có tin nào trong mục này.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Công ty</th>
                  <th>Lương</th>
                  <th>Khu vực</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={getEntityId(job)}>
                    <td className="fw-500" style={{ maxWidth: 220 }}>
                      <div className="text-truncate">
                        {job.isUrgent && (
                          <Badge bg="danger" className="me-1">
                            <i className="bi bi-lightning-charge-fill" /> Gấp
                          </Badge>
                        )}
                        {job.title}
                      </div>
                    </td>
                    <td>{job.companyName}</td>
                    <td className="text-success">{formatSalary(job.salaryAmount, job.salaryType)}</td>
                    <td>{job.location}</td>
                    <td>
                      <Badge bg={jobStatusVariant(job.status)}>{jobStatusLabel(job.status)}</Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2 flex-wrap">
                        <Button size="sm" variant="outline-secondary" onClick={() => setDetail(job)}>
                          Chi tiết
                        </Button>
                        {job.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline-success" onClick={() => handleApprove(job)}>
                              Duyệt
                            </Button>
                            <Button size="sm" variant="outline-warning" onClick={() => setRejecting(job)}>
                              Từ chối
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant={job.isUrgent ? 'danger' : 'outline-danger'}
                          title={job.isUrgent ? 'Bỏ nhãn gấp' : 'Đánh dấu tuyển gấp'}
                          onClick={() => handleToggleUrgent(job)}
                        >
                          <i className="bi bi-lightning-charge-fill" />
                        </Button>
                        {job.status !== 'closed' && (
                          <Button size="sm" variant="outline-dark" onClick={() => handleHide(job)}>
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
          <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1, filter)}>
            Trang trước
          </Button>
          <span className="align-self-center small text-muted">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => load(page + 1, filter)}
          >
            Trang sau
          </Button>
        </div>
      )}

      {/* Reject modal */}
      <Modal show={!!rejecting} onHide={() => setRejecting(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Từ chối tin tuyển dụng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">Tin: <strong>{rejecting?.title}</strong></p>
          <Form.Group>
            <Form.Label>Lý do từ chối (gửi tới NTD)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vd: Mô tả chưa rõ ca làm và mức lương..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setRejecting(null)}>Hủy</Button>
          <Button variant="warning" onClick={handleReject} disabled={submitting}>
            {submitting ? 'Đang gửi...' : 'Từ chối'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail modal */}
      <Modal show={!!detail} onHide={() => setDetail(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6">Chi tiết tin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detail && (
            <dl className="row mb-0">
              <dt className="col-sm-3">Tiêu đề</dt>
              <dd className="col-sm-9">{detail.title}</dd>
              <dt className="col-sm-3">Công ty</dt>
              <dd className="col-sm-9">{detail.companyName}</dd>
              <dt className="col-sm-3">Lương</dt>
              <dd className="col-sm-9">{formatSalary(detail.salaryAmount, detail.salaryType)}</dd>
              <dt className="col-sm-3">Khu vực</dt>
              <dd className="col-sm-9">{detail.location}{detail.district ? `, ${detail.district}` : ''}</dd>
              <dt className="col-sm-3">Loại / Ngành</dt>
              <dd className="col-sm-9">{detail.jobType} · {detail.industry}</dd>
              <dt className="col-sm-3">Thời gian</dt>
              <dd className="col-sm-9">{detail.workingTimeText}</dd>
              <dt className="col-sm-3">Hết hạn</dt>
              <dd className="col-sm-9">{formatDate(detail.expiresAt)}</dd>
              <dt className="col-sm-3">Mô tả</dt>
              <dd className="col-sm-9" style={{ whiteSpace: 'pre-line' }}>{detail.description}</dd>
              {detail.benefits?.length > 0 && (
                <>
                  <dt className="col-sm-3">Quyền lợi</dt>
                  <dd className="col-sm-9">{detail.benefits.join(', ')}</dd>
                </>
              )}
            </dl>
          )}
        </Modal.Body>
        <Modal.Footer>
          {detail?.status === 'pending' && (
            <>
              <Button variant="success" onClick={() => { handleApprove(detail); setDetail(null); }}>
                Duyệt
              </Button>
              <Button variant="warning" onClick={() => { setRejecting(detail); setDetail(null); }}>
                Từ chối
              </Button>
            </>
          )}
          <Button variant="outline-secondary" onClick={() => setDetail(null)}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
