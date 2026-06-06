import { useCallback, useEffect, useState } from 'react';
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
import interviewService from '@services/interviewService';
import type { Interview, InterviewStatus } from '@/types/api';
import { formatDateTime, getEntityId, getErrorMessage } from '@utils/format';

function statusVariant(status: InterviewStatus): string {
  switch (status) {
    case 'scheduled': return 'primary';
    case 'completed': return 'success';
    case 'cancelled': return 'secondary';
    case 'no_show': return 'danger';
    default: return 'secondary';
  }
}

function statusLabel(status: InterviewStatus): string {
  switch (status) {
    case 'scheduled': return 'Đã lên lịch';
    case 'completed': return 'Hoàn thành';
    case 'cancelled': return 'Đã hủy';
    case 'no_show': return 'Vắng mặt';
    default: return status;
  }
}

export default function EmployerInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await interviewService.list();
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải lịch phỏng vấn'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (id: string, label: string, action: () => Promise<unknown>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActingId(id);
    try {
      await action();
      toast.success(label);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    } finally {
      setActingId(null);
    }
  };

  const reschedule = (it: Interview) => {
    const input = window.prompt(
      'Thời gian phỏng vấn mới (ISO, ví dụ 2026-06-10T09:00):',
      it.scheduledAt ? new Date(it.scheduledAt).toISOString().slice(0, 16) : '',
    );
    if (!input) return;
    const scheduledAt = new Date(input);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error('Thời gian không hợp lệ.');
      return;
    }
    run(getEntityId(it), 'Đã cập nhật lịch phỏng vấn', () =>
      interviewService.update(getEntityId(it), { scheduledAt: scheduledAt.toISOString() }),
    );
  };

  return (
    <Container className="py-2">
      <div className="mb-3">
        <h1 className="h3 fw-bold mb-1">Lịch phỏng vấn</h1>
        <p className="text-muted mb-0">Quản lý, nhắc lịch và cập nhật các buổi phỏng vấn ứng viên.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : interviews.length === 0 ? (
            <Alert variant="info" className="mb-0">Chưa có buổi phỏng vấn nào được lên lịch.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Địa điểm / Link</th>
                  <th>Ghi chú</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((it) => {
                  const id = getEntityId(it);
                  const busy = actingId === id;
                  const active = it.status === 'scheduled';
                  return (
                    <tr key={id}>
                      <td className="fw-500">{formatDateTime(it.scheduledAt)}</td>
                      <td className="small">
                        {it.meetingLink ? (
                          <a href={it.meetingLink} target="_blank" rel="noreferrer">
                            <i className="bi bi-camera-video me-1" />Link họp
                          </a>
                        ) : (
                          it.location || '—'
                        )}
                      </td>
                      <td className="small text-muted">{it.note || '—'}</td>
                      <td><Badge bg={statusVariant(it.status)}>{statusLabel(it.status)}</Badge></td>
                      <td className="text-end">
                        {busy ? (
                          <Spinner size="sm" />
                        ) : (
                          <div className="d-flex gap-1 justify-content-end">
                            {active && (
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => run(id, 'Đã gửi nhắc lịch', () => interviewService.remind(id))}
                              >
                                <i className="bi bi-bell" />
                              </Button>
                            )}
                            {active && (
                              <Button size="sm" variant="outline-secondary" onClick={() => reschedule(it)}>
                                <i className="bi bi-pencil" />
                              </Button>
                            )}
                            {active && (
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() =>
                                  run(id, 'Đã hủy phỏng vấn', () => interviewService.cancel(id), 'Hủy buổi phỏng vấn này?')
                                }
                              >
                                <i className="bi bi-x-lg" />
                              </Button>
                            )}
                          </div>
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
    </Container>
  );
}
