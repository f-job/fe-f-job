import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Form,
  ListGroup,
  Spinner,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import notificationService from '@services/notificationService';
import { useAuthStore } from '@stores/authStore';
import type {
  AppNotification,
  NotificationSettings,
  PaginationMeta,
} from '@/types/api';
import { getEntityId, getErrorMessage, notificationIcon, timeAgo } from '@utils/format';
import { notificationLink } from '@utils/notificationLink';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    inAppEnabled: true,
  });

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await notificationService.list(targetPage, 15);
      setItems(data.data);
      setMeta(data.meta);
      setPage(targetPage);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải thông báo'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      toast.success('Đã đánh dấu tất cả là đã đọc');
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    }
  };

  const handleMarkRead = async (n: AppNotification) => {
    if (n.isRead) return;
    try {
      await notificationService.markRead(getEntityId(n));
      setItems((prev) =>
        prev.map((it) => (getEntityId(it) === getEntityId(n) ? { ...it, isRead: true } : it)),
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (n: AppNotification) => {
    try {
      await notificationService.remove(getEntityId(n));
      setItems((prev) => prev.filter((it) => getEntityId(it) !== getEntityId(n)));
      toast.success('Đã xóa thông báo');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa'));
    }
  };

  const handleOpen = async (n: AppNotification) => {
    await handleMarkRead(n);
    const destination = notificationLink(n, user?.role);
    if (destination) navigate(destination);
  };

  const handleToggleSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      await notificationService.updateSettings({ [key]: value });
      toast.success('Đã cập nhật cài đặt');
    } catch (err) {
      setSettings(settings); // rollback
      toast.error(getErrorMessage(err, 'Không thể cập nhật cài đặt'));
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 fw-bold mb-1">Thông báo</h1>
          <p className="text-muted mb-0">Cập nhật trạng thái ứng tuyển, job mới và nhắc ca làm.</p>
        </div>
        <Button variant="outline-primary" size="sm" onClick={handleMarkAll}>
          <i className="bi bi-check2-all me-1"></i>Đọc tất cả
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="d-flex flex-wrap gap-4 align-items-center">
          <span className="fw-500">Kênh nhận thông báo:</span>
          <Form.Check
            type="switch"
            id="email-enabled"
            label="Email"
            checked={settings.emailEnabled}
            onChange={(e) => handleToggleSetting('emailEnabled', e.target.checked)}
          />
          <Form.Check
            type="switch"
            id="inapp-enabled"
            label="Trong ứng dụng"
            checked={settings.inAppEnabled}
            onChange={(e) => handleToggleSetting('inAppEnabled', e.target.checked)}
          />
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        {loading ? (
          <div className="text-center py-5">
            <Spinner />
            <p className="text-muted mt-3 mb-0">Đang tải...</p>
          </div>
        ) : items.length === 0 ? (
          <Card.Body>
            <Alert variant="info" className="mb-0">
              Bạn chưa có thông báo nào.
            </Alert>
          </Card.Body>
        ) : (
          <ListGroup variant="flush">
            {items.map((n) => (
              <ListGroup.Item
                key={getEntityId(n)}
                className={`d-flex gap-3 align-items-start ${n.isRead ? '' : 'bg-light'}`}
                onClick={() => handleOpen(n)}
                role="button"
                title={notificationLink(n, user?.role) ? 'Mở nội dung liên quan' : 'Đánh dấu đã đọc'}
              >
                <i className={`bi ${notificationIcon(n.type)} fs-4 text-primary`}></i>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-500">{n.title}</span>
                    {!n.isRead && <Badge bg="primary" pill>Mới</Badge>}
                  </div>
                  <div className="text-muted small">{n.body}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="text-muted p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n);
                  }}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
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
    </Container>
  );
}
