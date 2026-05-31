import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Dropdown,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import employerJobService from '@services/employerJobService';
import type {
  BackendJob,
  EmployerJobApplication,
  JobStatus,
  PaginationMeta,
} from '@/types/api';
import { jobStatusLabel, jobStatusVariant } from '@/types/api';
import { formatDate, formatSalary, getEntityId, getErrorMessage } from '@utils/format';

const STATUS_TABS: { value: JobStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'draft', label: 'Nháp / Bị từ chối' },
  { value: 'closed', label: 'Đã đóng' },
];

export default function EmployerJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<JobStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // applicants modal
  const [applicantsJob, setApplicantsJob] = useState<BackendJob | null>(null);
  const [applicants, setApplicants] = useState<EmployerJobApplication[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  const load = useCallback(
    async (targetPage: number, status: JobStatus | 'all') => {
      setLoading(true);
      setError('');
      try {
        const { data } = await employerJobService.list({
          status: status === 'all' ? undefined : status,
          page: targetPage,
          limit: 10,
        });
        setJobs(data.data);
        setMeta(data.meta);
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
    load(1, tab);
  }, [load, tab]);

  const runAction = async (
    label: string,
    action: () => Promise<unknown>,
    confirmMsg?: string,
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    try {
      await action();
      toast.success(label);
      await load(page, tab);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    }
  };

  const openApplicants = async (job: BackendJob) => {
    setApplicantsJob(job);
    setApplicantsLoading(true);
    setApplicants([]);
    try {
      const { data } = await employerJobService.applications(getEntityId(job));
      setApplicants(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách ứng viên'));
    } finally {
      setApplicantsLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 fw-bold mb-1">Tin tuyển dụng của tôi</h1>
          <p className="text-muted mb-0">Quản lý, gia hạn và theo dõi ứng viên cho từng tin.</p>
        </div>
        <Button as={Link as any} to="/dang-tin" className="btn-primary-gradient">
          <i className="bi bi-plus-lg me-2" />Đăng tin mới
        </Button>
      </div>

      {/* status tabs */}
      <div className="d-flex gap-2 flex-wrap mb-3">
        {STATUS_TABS.map((t) => (
          <Button
            key={t.value}
            size="sm"
            variant={tab === t.value ? 'primary' : 'outline-secondary'}
            onClick={() => setTab(t.value)}
          >
            {t.label}
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
            <Alert variant="info" className="mb-0">
              Chưa có tin nào trong mục này. <Link to="/dang-tin">Đăng tin ngay</Link>.
            </Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Lương</th>
                  <th>Khu vực</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Ứng viên</th>
                  <th>Hết hạn</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const id = getEntityId(job);
                  return (
                    <tr key={id}>
                      <td className="fw-500" style={{ maxWidth: 240 }}>
                        <div className="text-truncate">
                          {job.isUrgent && (
                            <Badge bg="danger" className="me-1">
                              <i className="bi bi-lightning-charge-fill" /> Gấp
                            </Badge>
                          )}
                          {job.title}
                        </div>
                        {job.status === 'draft' && job.rejectionReason && (
                          <div className="small text-danger">
                            <i className="bi bi-exclamation-circle me-1" />
                            {job.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="text-success">{formatSalary(job.salaryAmount, job.salaryType)}</td>
                      <td>{job.location}{job.district ? `, ${job.district}` : ''}</td>
                      <td>
                        <Badge bg={jobStatusVariant(job.status)}>{jobStatusLabel(job.status)}</Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0"
                          onClick={() => openApplicants(job)}
                        >
                          {job.applicationCount}
                        </Button>
                      </td>
                      <td className="small text-muted">{formatDate(job.expiresAt)}</td>
                      <td className="text-end">
                        <Dropdown align="end">
                          <Dropdown.Toggle size="sm" variant="outline-secondary">
                            Thao tác
                          </Dropdown.Toggle>
                          <Dropdown.Menu
                            renderOnMount
                            popperConfig={{ strategy: 'fixed' }}
                          >
                            <Dropdown.Item onClick={() => navigate(`/dang-tin?id=${id}`)}>
                              <i className="bi bi-pencil me-2" />Chỉnh sửa
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => openApplicants(job)}>
                              <i className="bi bi-people me-2" />Xem ứng viên
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                runAction('Đã đẩy tin lên đầu', () => employerJobService.refresh(id))
                              }
                            >
                              <i className="bi bi-arrow-up-circle me-2" />Đẩy tin
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                runAction('Đã gia hạn +7 ngày', () => employerJobService.extend(id))
                              }
                            >
                              <i className="bi bi-calendar-plus me-2" />Gia hạn 7 ngày
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() =>
                                runAction('Đã nhân bản tin', () => employerJobService.duplicate(id))
                              }
                            >
                              <i className="bi bi-files me-2" />Nhân bản
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            {job.status !== 'closed' && (
                              <Dropdown.Item
                                onClick={() =>
                                  runAction('Đã đóng tin', () => employerJobService.close(id), 'Đóng tin này?')
                                }
                              >
                                <i className="bi bi-x-circle me-2" />Đóng tin
                              </Dropdown.Item>
                            )}
                            <Dropdown.Item
                              className="text-danger"
                              onClick={() =>
                                runAction('Đã xóa tin', () => employerJobService.remove(id), 'Xóa tin này?')
                              }
                            >
                              <i className="bi bi-trash me-2" />Xóa
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1, tab)}>
            Trang trước
          </Button>
          <span className="align-self-center small text-muted">
            Trang {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => load(page + 1, tab)}
          >
            Trang sau
          </Button>
        </div>
      )}

      {/* Applicants modal */}
      <Modal show={!!applicantsJob} onHide={() => setApplicantsJob(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6">
            Ứng viên — {applicantsJob?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {applicantsLoading ? (
            <div className="text-center py-4">
              <Spinner />
            </div>
          ) : applicants.length === 0 ? (
            <Alert variant="info" className="mb-0">Chưa có ứng viên nào ứng tuyển.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Ứng viên</th>
                  <th>SĐT</th>
                  <th>Trạng thái</th>
                  <th>CV</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => (
                  <tr key={getEntityId(a)}>
                    <td className="fw-500">{a.candidateName}</td>
                    <td>{a.candidatePhone ?? '—'}</td>
                    <td><Badge bg="secondary">{a.status}</Badge></td>
                    <td>
                      {a.resumeUrl ? (
                        <a href={a.resumeUrl} target="_blank" rel="noreferrer">Xem CV</a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
