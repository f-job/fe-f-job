import { Link, NavLink, Outlet } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';

/**
 * Layout for the employer workspace (`/nha-tuyen-dung/*`).
 * Provides a dedicated sub-nav for posting and managing jobs + finding candidates.
 */
export default function EmployerLayout() {
  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="white" className="border-bottom shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/nha-tuyen-dung/tin-dang" className="fw-bold">
            <span className="text-gradient">F-Job</span> · Nhà tuyển dụng
          </Navbar.Brand>
          <Nav className="gap-1">
            <Nav.Link as={NavLink} to="/nha-tuyen-dung/tin-dang">
              <i className="bi bi-briefcase me-1" />Tin của tôi
            </Nav.Link>
            <Nav.Link as={NavLink} to="/dang-tin">
              <i className="bi bi-plus-circle me-1" />Đăng tin
            </Nav.Link>
            <Nav.Link as={NavLink} to="/tim-ung-vien">
              <i className="bi bi-search me-1" />Tìm ứng viên
            </Nav.Link>
            <Nav.Link as={NavLink} to="/nha-tuyen-dung/phong-van">
              <i className="bi bi-calendar-event me-1" />Phỏng vấn
            </Nav.Link>
            <Nav.Link as={NavLink} to="/nha-tuyen-dung/goi-dich-vu">
              <i className="bi bi-box-seam me-1" />Gói &amp; Credit
            </Nav.Link>
            <Nav.Link as={NavLink} to="/tin-nhan">
              <i className="bi bi-chat-dots me-1" />Tin nhắn
            </Nav.Link>
            <Nav.Link as={Link} to="/">
              <i className="bi bi-house me-1" />Trang chủ
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>
      <Container className="py-4">
        <Outlet />
      </Container>
    </div>
  );
}
