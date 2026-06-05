import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import jobService from '@services/jobService';
import applicationService from '@services/applicationService';
import employerService from '@services/employerService';
import ReportModal from '@components/common/ReportModal';
import { useAuthStore } from '@stores/authStore';
import { useVerificationCheck } from '@hooks/useVerificationCheck';
import type {
  BackendJob,
  CreateApplicationPayload,
  CvType,
  ReportTargetType,
} from '@/types/api';
import { formatDate, formatSalary, getErrorMessage, getRefId } from '@utils/format';

interface ApplyForm {
  cvType: CvType;
  cvPdfUrl?: string;
  coverLetter?: string;
}

export default function JobDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { requireVerification } = useVerificationCheck();
  const isCandidate = user?.role === 'CANDIDATE';

  const [job, setJob] = useState<BackendJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Report modal: a single config drives the shared ReportModal for both the
  // JOB target (this posting) and the USER target (the employer's account).
  const [showReport, setShowReport] = useState(false);
  const [reportConfig, setReportConfig] = useState<{
    targetType: ReportTargetType;
    targetId: string;
    targetLabel?: string;
  } | null>(null);
  // The employer's USER id, resolved from job.employerId (an EmployerProfile)
  // via GET /employers/id/:id — the same resolution handleContactEmployer uses.
  // We resolve it up-front so we can (a) target a USER report at the employer
  // and (b) hide the report control when the employer is the current user
  // (Req 10.8 self-report rule, surfaced in the UI).
  const [employerUserId, setEmployerUserId] = useState<string | null>(null);

  const { register, handleSubmit, watch, reset } = useForm<ApplyForm>({
    defaultValues: { cvType: 'online', cvPdfUrl: '', coverLetter: '' },
  });
  const cvType = watch('cvType');

  const loadJob = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await jobService.getById(id);
      setJob(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải chi tiết việc làm'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const checkApplied = useCallback(async () => {
    if (!isAuthenticated || !isCandidate) return;
    try {
      const { data } = await applicationService.checkApplied(id);
      setApplied(data.applied);
    } catch {
      // non-blocking — leave applied=false on failure
    }
  }, [id, isAuthenticated, isCandidate]);

  /**
   * Resolve the employer's USER id (job.employerId is an EmployerProfile id),
   * mirroring handleContactEmployer's GET /employers/id/:id lookup. We only do
   * this when authenticated, and we use it to decide whether to offer a
   * USER-target "report employer" control — hiding it when the employer is the
   * current user (self-report rule, Req 10.8). Failures are non-blocking: the
   * USER report control simply stays hidden.
   */
  const resolveEmployerUserId = useCallback(async () => {
    if (!isAuthenticated || !job) {
      setEmployerUserId(null);
      return;
    }
    try {
      const { data: employer } = await employerService.getById(job.employerId);
      setEmployerUserId(getRefId(employer.userId) || null);
    } catch {
      setEmployerUserId(null);
    }
  }, [isAuthenticated, job]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    checkApplied();
  }, [checkApplied]);

  useEffect(() => {
    resolveEmployerUserId();
  }, [resolveEmployerUserId]);

  const openJobReport = () => {
    if (!job) return;
    // Check verification before allowing report
    if (!requireVerification('báo cáo')) {
      return;
    }
    setReportConfig({ targetType: 'JOB', targetId: id, targetLabel: job.title });
    setShowReport(true);
  };

  const openEmployerReport = () => {
    if (!employerUserId) return;
    // Check verification before allowing report
    if (!requireVerification('báo cáo người dùng')) {
      return;
    }
    setReportConfig({
      targetType: 'USER',
      targetId: employerUserId,
      targetLabel: job?.companyName,
    });
    setShowReport(true);
  };

  // Show the USER-target "report employer" control only when we have resolved
  // the employer's user id AND it differs from the current user's id — never
  // offer a self-report (Req 10.8).
  const canReportEmployer =
    isAuthenticated && !!employerUserId && employerUserId !== user?.id;

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }
    if (!isCandidate) {
      toast.error('Chỉ ứng viên mới có thể ứng tuyển.');
      return;
    }
    // Check verification before allowing application
    if (!requireVerification('ứng tuyển')) {
      return;
    }
    setShowApply(true);
  };

  const onApply = async (form: ApplyForm) => {
    setIsSubmitting(true);
    const payload: CreateApplicationPayload = {
      jobId: id,
      cvType: form.cvType,
      cvPdfUrl: form.cvType === 'pdf' ? form.cvPdfUrl : undefined,
      coverLetter: form.coverLetter || undefined,
    };
    try {
      await applicationService.apply(payload);
      toast.success('Ứng tuyển thành công!');
      setApplied(true);
      setShowApply(false);
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Ứng tuyển thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Start (or open) a chat with the employer who posted this job.
   * `job.employerId` references an EmployerProfile; the conversation API needs
   * the employer's User id, which we resolve via GET /employers/:id (populated userId).
   */
  const handleContactEmployer = async () => {
    if (!job) return;
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }
    if (!isCandidate) {
      toast.error('Chỉ ứng viên mới có thể nhắn tin cho nhà tuyển dụng.');
      return;
    }
    // Check verification before allowing messaging
    if (!requireVerification('nhắn tin')) {
      return;
    }
    setStartingChat(true);
    try {
      const { data: employer } = await employerService.getById(job.employerId);
      const employerUserId = getRefId(employer.userId);
      if (!employerUserId) {
        toast.error('Không tìm thấy tài khoản nhà tuyển dụng.');
        return;
      }
      navigate(`/tin-nhan?to=${employerUserId}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mở hội thoại với nhà tuyển dụng'));
    } finally {
      setStartingChat(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <Spinner />
        <p className="text-muted mt-3 mb-0">Đang tải...</p>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || 'Không tìm thấy việc làm.'}</Alert>
        <Button variant="outline-secondary" onClick={() => navigate('/viec-lam')}>
          ← Quay lại danh sách
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button variant="link" className="px-0 mb-2" onClick={() => navigate('/viec-lam')}>
        ← Quay lại danh sách
      </Button>

      <Row className="g-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h1 className="h4 fw-bold mb-1">{job.title}</h1>
                  <div className="text-muted">
                    <i className="bi bi-building me-1" />
                    {job.companyName}
                  </div>
                </div>
                {job.isUrgent && <Badge bg="danger">Tuyển gấp</Badge>}
              </div>

              <hr />

              <Row className="g-3">
                <Col sm={6}>
                  <div className="text-muted small">Mức lương</div>
                  <div className="fw-500 text-success">
                    {formatSalary(job.salaryAmount, job.salaryType)}
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="text-muted small">Khu vực</div>
                  <div className="fw-500">
                    {job.location}{job.district ? `, ${job.district}` : ''}
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="text-muted small">Thời gian làm</div>
                  <div className="fw-500">{job.workingTimeText}</div>
                </Col>
                <Col sm={6}>
                  <div className="text-muted small">Số lượng cần</div>
                  <div className="fw-500">{job.slots} người</div>
                </Col>
                <Col sm={6}>
                  <div className="text-muted small">Loại công việc</div>
                  <div className="fw-500">{job.jobType}</div>
                </Col>
                <Col sm={6}>
                  <div className="text-muted small">Yêu cầu kinh nghiệm</div>
                  <div className="fw-500">{job.level}</div>
                </Col>
              </Row>

              <hr />

              <h6 className="fw-bold">Mô tả công việc</h6>
              <p style={{ whiteSpace: 'pre-line' }}>{job.description}</p>

              {job.benefits.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3">Quyền lợi</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {job.benefits.map((b) => (
                      <Badge bg="light" text="dark" key={b}>
                        <i className="bi bi-check-circle text-success me-1" />
                        {b}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm position-sticky" style={{ top: 80 }}>
            <Card.Body>
              <div className="mb-3">
                <Badge bg="light" text="dark" className="me-2">{job.industry}</Badge>
                <Badge bg="light" text="dark">{job.jobType}</Badge>
              </div>
              <ul className="list-unstyled small text-muted mb-3">
                <li className="mb-1"><i className="bi bi-eye me-2" />{job.viewCount} lượt xem</li>
                <li className="mb-1"><i className="bi bi-people me-2" />{job.applicationCount} lượt ứng tuyển</li>
                <li><i className="bi bi-calendar-x me-2" />Hết hạn: {formatDate(job.expiresAt)}</li>
              </ul>

              {applied ? (
                <Button variant="success" className="w-100" disabled>
                  <i className="bi bi-check-lg me-2" />Đã ứng tuyển
                </Button>
              ) : (
                <Button className="w-100 btn-primary-gradient" onClick={handleApplyClick}>
                  Ứng tuyển ngay
                </Button>
              )}
              <Button
                variant="outline-primary"
                className="w-100 mt-2"
                onClick={handleContactEmployer}
                disabled={startingChat}
              >
                <i className="bi bi-chat-dots me-2" />
                {startingChat ? 'Đang mở...' : 'Nhắn tin với NTD'}
              </Button>
              {isAuthenticated && (
                <>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="w-100 mt-2"
                    onClick={openJobReport}
                  >
                    <i className="bi bi-flag me-2" />
                    Báo cáo
                  </Button>
                  {canReportEmployer && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="w-100 mt-2"
                      onClick={openEmployerReport}
                    >
                      <i className="bi bi-flag me-2" />
                      Báo cáo người dùng
                    </Button>
                  )}
                </>
              )}
              {!isAuthenticated && (
                <small className="text-muted d-block mt-2 text-center">
                  Bạn cần đăng nhập để ứng tuyển.
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showApply} onHide={() => setShowApply(false)} centered>
        <Form onSubmit={handleSubmit(onApply)}>
          <Modal.Header closeButton>
            <Modal.Title>Ứng tuyển: {job.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Hình thức ứng tuyển</Form.Label>
              <Form.Select {...register('cvType')}>
                <option value="online">Hồ sơ trực tuyến</option>
                <option value="pdf">Tải lên CV (PDF)</option>
                <option value="quick">Ứng tuyển nhanh</option>
              </Form.Select>
            </Form.Group>

            {cvType === 'pdf' && (
              <Form.Group className="mb-3">
                <Form.Label>Đường dẫn CV (PDF)</Form.Label>
                <Form.Control
                  type="url"
                  placeholder="https://..."
                  {...register('cvPdfUrl', { required: cvType === 'pdf' })}
                />
              </Form.Group>
            )}

            <Form.Group>
              <Form.Label>Thư giới thiệu (tùy chọn)</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                maxLength={2000}
                placeholder="Giới thiệu ngắn về kinh nghiệm, thời gian có thể làm..."
                {...register('coverLetter')}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowApply(false)}>
              Hủy
            </Button>
            <Button type="submit" className="btn-primary-gradient" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi ứng tuyển'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {reportConfig && (
        <ReportModal
          show={showReport}
          targetType={reportConfig.targetType}
          targetId={reportConfig.targetId}
          targetLabel={reportConfig.targetLabel}
          onClose={() => setShowReport(false)}
        />
      )}
    </Container>
  );
}
