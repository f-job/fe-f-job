import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import applicationService from '@services/applicationService';
import ReviewFormModal from '@components/common/ReviewFormModal';
import type { Application, ApplicationJobSnapshot, PaginationMeta } from '@/types/api';
import {
  applicationStatusLabel,
  applicationStatusVariant,
  formatDateTime,
  getEntityId,
  getErrorMessage,
} from '@utils/format';

/** jobId may be a populated snapshot or a bare id string. */
function getJobSnapshot(app: Application): ApplicationJobSnapshot | null {
  return typeof app.jobId === 'object' ? app.jobId : null;
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewAppId, setReviewAppId] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await applicationService.listMine(targetPage, 10);
      setApplications(data.data);
      setMeta(data.meta);
      setPage(targetPage);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải lịch sử ứng tuyển'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleWithdraw = async (app: Application) => {
    if (!window.confirm('Rút đơn ứng tuyển này?')) return;
    try {
      await applicationService.withdraw(getEntityId(app));
      toast.success('Đã rút đơn ứng tuyển');
      await load(page);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể rút đơn'));
    }
  };

  return (
    <Container className="py-4">
      <h1 className="h3 fw-bold mb-1">Đơn ứng tuyển của tôi</h1>
      <p className="text-muted">Theo dõi trạng thái các job bạn đã ứng tuyển.</p>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : applications.length === 0 ? (
            <Alert variant="info" className="mb-0">
              Bạn chưa ứng tuyển job nào. <Link to="/viec-lam">Tìm việc ngay</Link>.
            </Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Công việc</th>
                  <th>Công ty</th>
                  <th>Trạng thái</th>
                  <th>Ngày ứng tuyển</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const snapshot = getJobSnapshot(app);
                  const jobId = snapshot ? getEntityId(snapshot) : (app.jobId as string);
                  return (
                    <tr key={getEntityId(app)}>
                      <td className="fw-500">
                        {snapshot?.title ? (
                          <Link to={`/viec-lam/${jobId}`} className="text-decoration-none">
                            {snapshot.title}
                          </Link>
                        ) : (
                          <span className="text-muted">#{jobId}</span>
                        )}
                      </td>
                      <td>{snapshot?.companyName ?? '—'}</td>
                      <td>
                        <Badge bg={applicationStatusVariant(app.status)}>
                          {applicationStatusLabel(app.status)}
                        </Badge>
                      </td>
                      <td>{formatDateTime(app.createdAt)}</td>
                      <td className="text-end">
                        {app.status === 'Applied' ? (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleWithdraw(app)}
                          >
                            Rút đơn
                          </Button>
                        ) : app.status === 'Completed' ? (
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => setReviewAppId(getEntityId(app))}
                          >
                            <i className="bi bi-star me-1"></i>Đánh giá
                          </Button>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
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
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
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
            onClick={() => load(page + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}

      <ReviewFormModal
        show={reviewAppId !== null}
        applicationId={reviewAppId ?? ''}
        onClose={() => setReviewAppId(null)}
        onSubmitted={() => load(page)}
      />
    </Container>
  );
}
