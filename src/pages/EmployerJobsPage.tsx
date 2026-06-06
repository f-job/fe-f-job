import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Dropdown,
  Form,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import employerJobService from '@services/employerJobService';
import employerApplicationService from '@services/employerApplicationService';
import employerCandidateService from '@services/employerCandidateService';
import type {
  ApplicationStatus,
  BackendJob,
  EmployerJobApplication,
  JobStatus,
  PaginationMeta,
} from '@/types/api';
import { jobStatusLabel, jobStatusVariant } from '@/types/api';
import {
  applicationStatusLabel,
  applicationStatusVariant,
  formatDate,
  formatSalary,
  getEntityId,
  getErrorMessage,
} from '@utils/format';

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
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

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
    setSelectedAppIds(new Set());
    try {
      const { data } = await employerJobService.applications(getEntityId(job));
      setApplicants(data.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải danh sách ứng viên'));
    } finally {
      setApplicantsLoading(false);
    }
  };

  const toggleSelect = (appId: string) => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedAppIds((prev) =>
      prev.size === ids.length ? new Set() : new Set(ids),
    );
  };

  const runBulk = async (label: string, action: () => Promise<unknown>) => {
    setBulkBusy(true);
    try {
      await action();
      toast.success(label);
      setSelectedAppIds(new Set());
      if (applicantsJob) await openApplicants(applicantsJob);
      await load(page, tab);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác hàng loạt thất bại'));
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkReject = () => {
    const ids = [...selectedAppIds];
    if (ids.length === 0) return;
    const reason = window.prompt(`Lý do từ chối ${ids.length} ứng viên:`);
    if (reason === null) return;
    runBulk('Đã gửi email từ chối hàng loạt', () =>
      employerCandidateService.bulkReject({
        applicationIds: ids,
        reason: reason.trim() || 'Không phù hợp',
      }),
    );
  };

  const bulkInterview = () => {
    const ids = [...selectedAppIds];
    if (ids.length === 0) return;
    const input = window.prompt(
      `Thời gian phỏng vấn cho ${ids.length} ứng viên (ISO, ví dụ 2026-06-10T09:00):`,
    );
    if (!input) return;
    const scheduledAt = new Date(input);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error('Thời gian không hợp lệ.');
      return;
    }
    runBulk('Đã gửi email mời phỏng vấn hàng loạt', () =>
      employerCandidateService.bulkInterview({
        applicationIds: ids,
        scheduledAt: scheduledAt.toISOString(),
      }),
    );
  };

  const runApplicantAction = async (
    application: EmployerJobApplication,
    label: string,
    action: () => Promise<unknown>,
    confirmMsg?: string,
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const appId = getEntityId(application);
    setActingId(appId);
    try {
      await action();
      toast.success(label);
      if (applicantsJob) await openApplicants(applicantsJob);
      await load(page, tab);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    } finally {
      setActingId(null);
    }
  };

  const scheduleInterview = (application: EmployerJobApplication) => {
    const input = window.prompt(
      'Nhập thời gian phỏng vấn (ISO, ví dụ 2026-06-10T09:00). Để trống để hủy:',
    );
    if (!input) return;
    const scheduledAt = new Date(input);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error('Thời gian không hợp lệ.');
      return;
    }
    runApplicantAction(application, 'Đã hẹn lịch phỏng vấn', () =>
      employerApplicationService.schedule(getEntityId(application), {
        scheduledAt: scheduledAt.toISOString(),
      }),
    );
  };

  const rejectApplicant = (application: EmployerJobApplication) => {
    const reason = window.prompt('Lý do từ chối ứng viên:');
    if (reason === null) return;
    runApplicantAction(application, 'Đã từ chối ứng viên', () =>
      employerApplicationService.reject(getEntityId(application), {
        reason: reason.trim() || 'Không phù hợp',
      }),
    );
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
            <>
              {selectedAppIds.size > 0 && (
                <div className="d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded">
                  <span className="small fw-500">Đã chọn {selectedAppIds.size}</span>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    disabled={bulkBusy}
                    onClick={bulkInterview}
                  >
                    <i className="bi bi-calendar-event me-1" />Mời phỏng vấn
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={bulkBusy}
                    onClick={bulkReject}
                  >
                    <i className="bi bi-envelope-x me-1" />Từ chối hàng loạt
                  </Button>
                  {bulkBusy && <Spinner size="sm" />}
                </div>
              )}
              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <Form.Check
                        type="checkbox"
                        checked={selectedAppIds.size === applicants.length && applicants.length > 0}
                        onChange={() => toggleSelectAll(applicants.map((a) => getEntityId(a)))}
                      />
                    </th>
                    <th>Ứng viên</th>
                    <th>SĐT</th>
                    <th>Trạng thái</th>
                    <th>CV</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => {
                    const appId = getEntityId(a);
                    const status = a.status as ApplicationStatus;
                    const busy = actingId === appId;
                    const isTerminal = ['Rejected', 'Withdrawn', 'Completed', 'NoShow'].includes(status);
                    const canAccept = !isTerminal && status !== 'Accepted';
                    return (
                      <tr key={appId}>
                        <td>
                          <Form.Check
                            type="checkbox"
                            checked={selectedAppIds.has(appId)}
                            onChange={() => toggleSelect(appId)}
                          />
                        </td>
                        <td className="fw-500">{a.candidateName}</td>
                        <td>{a.candidatePhone ?? '—'}</td>
                        <td>
                          <Badge bg={applicationStatusVariant(status)}>
                            {applicationStatusLabel(status)}
                          </Badge>
                        </td>
                        <td>
                          {a.resumeUrl ? (
                            <a href={a.resumeUrl} target="_blank" rel="noreferrer">Xem CV</a>
                          ) : '—'}
                        </td>
                        <td className="text-end">
                          <Dropdown align="end">
                            <Dropdown.Toggle size="sm" variant="outline-secondary" disabled={busy}>
                              {busy ? <Spinner size="sm" /> : 'Xử lý'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu renderOnMount popperConfig={{ strategy: 'fixed' }}>
                              {canAccept && (
                                <Dropdown.Item
                                  onClick={() =>
                                    runApplicantAction(a, 'Đã nhận ứng viên', () =>
                                      employerApplicationService.accept(appId),
                                    )
                                  }
                                >
                                  <i className="bi bi-check-circle me-2 text-success" />Nhận ứng viên
                                </Dropdown.Item>
                              )}
                              {!isTerminal && (
                                <Dropdown.Item onClick={() => scheduleInterview(a)}>
                                  <i className="bi bi-calendar-event me-2 text-primary" />Hẹn phỏng vấn
                                </Dropdown.Item>
                              )}
                              {status === 'Accepted' && (
                                <>
                                  <Dropdown.Item
                                    onClick={() =>
                                      runApplicantAction(
                                        a,
                                        'Đã xác nhận hoàn thành',
                                        () => employerApplicationService.complete(appId),
                                        'Xác nhận ứng viên đã hoàn thành ca làm?',
                                      )
                                    }
                                  >
                                    <i className="bi bi-flag me-2 text-success" />Hoàn thành
                                  </Dropdown.Item>
                                  <Dropdown.Item
                                    onClick={() =>
                                      runApplicantAction(
                                        a,
                                        'Đã báo vắng mặt',
                                        () => employerApplicationService.noShow(appId),
                                        'Báo ứng viên vắng mặt (no-show)? Hành động này sẽ trừ điểm uy tín ứng viên.',
                                      )
                                    }
                                  >
                                    <i className="bi bi-person-x me-2 text-warning" />Báo vắng mặt
                                  </Dropdown.Item>
                                </>
                              )}
                              {!isTerminal && (
                                <>
                                  <Dropdown.Divider />
                                  <Dropdown.Item className="text-danger" onClick={() => rejectApplicant(a)}>
                                    <i className="bi bi-x-circle me-2" />Từ chối
                                  </Dropdown.Item>
                                </>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
