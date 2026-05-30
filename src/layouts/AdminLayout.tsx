import { Link, NavLink, Outlet } from 'react-router-dom';
import { Container, Nav, Navbar } from 'react-bootstrap';

export default function AdminLayout() {
  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="white" className="border-bottom shadow-sm">
        <Container>
          <Navbar.Brand as={Link} to="/admin/users" className="fw-bold">
            F-Job Admin
          </Navbar.Brand>
          <Nav className="gap-2">
            <Nav.Link as={NavLink} to="/admin/users">
              Users
            </Nav.Link>
            <Nav.Link as={NavLink} to="/admin/candidates">
              Ứng viên
            </Nav.Link>
            <Nav.Link as={NavLink} to="/admin/employers">
              Nhà tuyển dụng
            </Nav.Link>
            <Nav.Link as={NavLink} to="/admin/monitoring">
              Monitoring
            </Nav.Link>
            <Nav.Link as={Link} to="/">
              Trang chủ
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
