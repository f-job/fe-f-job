import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from 'react-bootstrap';
import applicationService from '@services/applicationService';
import type { Application, ApplicationJobSnapshot } from '@/types/api';
import {
  formatDateTime,
  getEntityId,
  getErrorMessage,
} from '@utils/format';

function getJobSnapshot(app: Application): ApplicationJobSnapshot | null {
  return typeof app.jobId === 'object' ? app.jobId : null;
}

export default function WorkHistoryPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await applicationService.listMine(1, 100);
      setApplications(data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải lịch sử làm việc'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const completedApplications = useMemo(
    () => applications.filter((app) => app.status === 'Completed'),
    [applications],
  );

  return (
    <Container className="py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Lịch sử làm việc</h1>
          <p className="text-muted mb-0">
            Tổng hợp các công việc bạn đã hoàn thành trên F-Job.
          </p>
        </div>
        <Button as={Link as any} to="/viec-lam" className="btn-primary-gradient">
          <i className="bi bi-search me-1" />
          Tìm việc mới
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <Card className="border-0 shadow-sm">
          <Card.Body className="text-center py-5">
            <Spinner />
            <p className="text-muted mt-3 mb-0">Đang tải lịch sử...</p>
          </Card.Body>
        </Card>
      ) : completedApplications.length === 0 ? (
        <Alert variant="info">
          Bạn chưa có công việc nào hoàn thành. Xem các{' '}
          <Link to="/don-ung-tuyen">đơn ứng tuyển hiện tại</Link> hoặc tìm việc mới.
        </Alert>
      ) : (
        <Row className="g-3">
          {completedApplications.map((app) => {
            const snapshot = getJobSnapshot(app);
            const jobId = snapshot ? getEntityId(snapshot) : (app.jobId as string);

            return (
              <Col md={6} lg={4} key={getEntityId(app)}>
                <Card className="job-card card-hover h-100">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                      <div className="company-logo">
                        <i className="bi bi-briefcase" />
                      </div>
                      <Badge bg="success">Đã hoàn thành</Badge>
                    </div>

                    <h2 className="h6 fw-bold mb-2">
                      {snapshot?.title ? (
                        <Link
                          to={`/viec-lam/${jobId}`}
                          className="text-decoration-none"
                        >
                          {snapshot.title}
                        </Link>
                      ) : (
                        <span>#{jobId}</span>
                      )}
                    </h2>

                    <div className="job-details mb-3">
                      <div className="job-detail-item">
                        <i className="bi bi-building" />
                        <span>{snapshot?.companyName ?? 'Nhà tuyển dụng'}</span>
                      </div>
                      {snapshot?.location && (
                        <div className="job-detail-item">
                          <i className="bi bi-geo-alt" />
                          <span>{snapshot.location}</span>
                        </div>
                      )}
                      {snapshot?.workingTimeText && (
                        <div className="job-detail-item">
                          <i className="bi bi-clock" />
                          <span>{snapshot.workingTimeText}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-3 border-top">
                      <small className="text-muted">
                        Hoàn tất trong hồ sơ ứng tuyển từ{' '}
                        {formatDateTime(app.updatedAt ?? app.createdAt)}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}
