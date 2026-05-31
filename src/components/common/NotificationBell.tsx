import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import notificationService from '@services/notificationService';
import type { AppNotification } from '@/types/api';
import { getEntityId, notificationIcon, timeAgo } from '@utils/format';

/** Poll interval for the unread badge (ms). */
const POLL_MS = 60_000;

export function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const { data } = await notificationService.unreadCount();
      setCount(data.count);
    } catch {
      // silent — badge is non-critical
    }
  }, []);

  useEffect(() => {
    loadCount();
    const timer = setInterval(loadCount, POLL_MS);
    return () => clearInterval(timer);
  }, [loadCount]);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationService.list(1, 6);
      setItems(data.data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = (next: boolean) => {
    setOpen(next);
    if (next) loadRecent();
  };

  const handleOpenItem = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        await notificationService.markRead(getEntityId(n));
        setCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setOpen(false);
    navigate('/thong-bao');
  };

  return (
    <Dropdown align="end" show={open} onToggle={handleToggle}>
      <Dropdown.Toggle
        variant="light"
        className="border-0 position-relative bg-transparent"
        id="notif-bell"
      >
        <i className="bi bi-bell fs-5"></i>
        {count > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.6rem' }}
          >
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: 340, maxHeight: 440, overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <span className="fw-bold">Thông báo</span>
          <Link to="/thong-bao" className="small text-decoration-none" onClick={() => setOpen(false)}>
            Xem tất cả
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner size="sm" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted py-4 small">Chưa có thông báo</div>
        ) : (
          items.map((n) => (
            <Dropdown.Item
              key={getEntityId(n)}
              onClick={() => handleOpenItem(n)}
              className={`d-flex gap-2 py-2 ${n.isRead ? '' : 'bg-light'}`}
              style={{ whiteSpace: 'normal' }}
            >
              <i className={`bi ${notificationIcon(n.type)} fs-5 text-primary`}></i>
              <div className="flex-grow-1">
                <div className="fw-500 small">{n.title}</div>
                <div className="text-muted small text-truncate" style={{ maxWidth: 240 }}>
                  {n.body}
                </div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                  {timeAgo(n.createdAt)}
                </div>
              </div>
              {!n.isRead && <span className="badge bg-primary rounded-circle p-1 align-self-center" />}
            </Dropdown.Item>
          ))
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
