import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Navbar,
  Nav,
  Container,
  Button,
  Dropdown,
  Badge,
} from 'react-bootstrap';
import { useAuthStore } from '@stores/authStore';
import { useChatStore } from '@stores/chatStore';
import { NotificationBell } from '@components/common/NotificationBell';
import { ThemeToggle } from '@components/common/ThemeToggle';
import UserAvatar from '@components/common/UserAvatar';
import {
  disconnectChatSocket,
  getChatSocket,
  onNewMessage,
} from '@services/chatSocket';
import fjobavatar from '@assets/images/fjobavatar.png';
import './AppNavbar.css';

/** Poll interval for the chat unread badge (ms). */
const CHAT_POLL_MS = 60_000;

export function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const chatUnread = useChatStore((s) => s.unreadCount);
  const refreshChatUnread = useChatStore((s) => s.refreshUnreadCount);
  const resetChatUnread = useChatStore((s) => s.reset);

  // Keep the chat badge fresh: initial fetch, polling, and live socket bumps.
  useEffect(() => {
    if (!isAuthenticated) return;
    refreshChatUnread();
    getChatSocket();
    const timer = setInterval(refreshChatUnread, CHAT_POLL_MS);
    const off = onNewMessage((evt) => {
      const senderId =
        typeof evt.message.senderId === 'string'
          ? evt.message.senderId
          : evt.message.senderId?._id;
      // Only inbound messages bump the badge.
      if (senderId && senderId !== user?.id) refreshChatUnread();
    });
    return () => {
      clearInterval(timer);
      off();
    };
  }, [isAuthenticated, refreshChatUnread, user?.id]);

  const handleLogout = async () => {
    disconnectChatSocket();
    resetChatUnread();
    await logout();
    navigate('/');
  };

  return (
    <Navbar expand="lg" sticky="top" className="app-navbar py-2">
      <Container>
        <Navbar.Brand
          as={Link}
          to="/"
          className="fw-bold fs-4 d-flex align-items-center"
        >
          <img src={fjobavatar} alt="F-Job Logo" className="navbar-logo" />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="mx-auto app-nav-links">
            <Nav.Link as={Link} to="/viec-lam" className="fw-500">
              Việc làm
            </Nav.Link>
            <Nav.Link as={Link} to="/cam-nang-nghe-nghiep" className="fw-500">
              Cẩm nang nghề nghiệp
            </Nav.Link>
            <Nav.Link as={Link} to="/ve-chung-toi" className="fw-500">
              Về chúng tôi
            </Nav.Link>
          </Nav>

          <Nav className="d-flex align-items-center gap-2">
            {/* Theme Toggle */}
            <div className="px-2">
              <ThemeToggle />
            </div>

            {isAuthenticated && user ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/tin-nhan"
                  className="position-relative px-2"
                  title="Tin nhắn"
                >
                  <i className="bi bi-chat-dots fs-5"></i>
                  {chatUnread > 0 && (
                    <Badge
                      bg="danger"
                      pill
                      className="position-absolute top-0 start-100 translate-middle"
                      style={{ fontSize: '0.6rem' }}
                    >
                      {chatUnread > 99 ? '99+' : chatUnread}
                    </Badge>
                  )}
                </Nav.Link>
                <NotificationBell />
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="light"
                    className="user-menu-toggle d-flex align-items-center gap-2"
                  >
                    <UserAvatar
                      src={user.avatarUrl}
                      alt={user.name ?? user.fullName ?? user.email ?? 'User'}
                      size={32}
                    />
                    <span className="fw-500">
                      {user.name ?? user.fullName ?? user.email}
                    </span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {user.role === 'CANDIDATE' && (
                      <Dropdown.Item as={Link} to="/ho-so">
                        <i className="bi bi-person me-2"></i>Hồ sơ
                      </Dropdown.Item>
                    )}
                    {user.role === 'CANDIDATE' && (
                      <Dropdown.Item as={Link} to="/don-ung-tuyen">
                        <i className="bi bi-file-earmark-text me-2"></i>Đơn ứng
                        tuyển
                      </Dropdown.Item>
                    )}
                    {user.role === 'CANDIDATE' && (
                      <Dropdown.Item as={Link} to="/lich-su-lam-viec">
                        <i className="bi bi-clock-history me-2"></i>Lịch sử làm
                        việc
                      </Dropdown.Item>
                    )}
                    {(user.role === 'EMPLOYER' || user.role === 'ADMIN') && (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Header>Nhà tuyển dụng</Dropdown.Header>
                        <Dropdown.Item as={Link} to="/nha-tuyen-dung/tin-dang">
                          <i className="bi bi-briefcase me-2"></i>Tin của tôi
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/nha-tuyen-dung/ho-so">
                          <i className="bi bi-building me-2"></i>Hồ sơ công ty
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/dang-tin">
                          <i className="bi bi-plus-circle me-2"></i>Đăng tin mới
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/tim-ung-vien">
                          <i className="bi bi-search me-2"></i>Tìm ứng viên
                        </Dropdown.Item>
                      </>
                    )}
                    <Dropdown.Item as={Link} to="/tin-nhan">
                      <i className="bi bi-chat-dots me-2"></i>Tin nhắn
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/thong-bao">
                      <i className="bi bi-bell me-2"></i>Thông báo
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/gioi-thieu-thuong">
                      <i className="bi bi-gift me-2"></i>Giới thiệu &amp; Thưởng
                    </Dropdown.Item>
                    {user.role === 'ADMIN' && (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Header>Quản trị</Dropdown.Header>
                        <Dropdown.Item as={Link} to="/admin/users">
                          <i className="bi bi-people me-2"></i>Quản lý users
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/admin/candidates">
                          <i className="bi bi-person-badge me-2"></i>Ứng viên
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/admin/employers">
                          <i className="bi bi-building me-2"></i>Nhà tuyển dụng
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/admin/jobs">
                          <i className="bi bi-clipboard-check me-2"></i>Duyệt
                          tin
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/admin/monitoring">
                          <i className="bi bi-activity me-2"></i>Monitoring
                        </Dropdown.Item>
                      </>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/dang-ky" className="fw-500">
                  Đăng ký
                </Nav.Link>
                <Nav.Link as={Link} to="/dang-nhap" className="fw-500">
                  Đăng nhập
                </Nav.Link>
              </>
            )}
            <Button
              as={Link as any}
              to={
                isAuthenticated &&
                (user?.role === 'EMPLOYER' || user?.role === 'ADMIN')
                  ? '/dang-tin'
                  : '/dang-ky'
              }
              className="btn-primary-gradient ms-2"
            >
              Đăng tin tuyển dụng
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
