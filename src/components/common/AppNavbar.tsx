import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { useAuthStore } from '@stores/authStore';

export function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Navbar bg="white" expand="lg" sticky="top" className="shadow-sm py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
          <span className="text-gradient">F-Job</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="mx-auto">
            <Nav.Link as={Link} to="/viec-lam" className="fw-500 px-3">
              Việc làm
            </Nav.Link>
            <Nav.Link as={Link} to="/su-kien" className="fw-500 px-3">
              Sự kiện
            </Nav.Link>
            <Nav.Link as={Link} to="/ve-chung-toi" className="fw-500 px-3">
              Về chúng tôi
            </Nav.Link>
          </Nav>

          <Nav className="d-flex align-items-center gap-2">
            {isAuthenticated && user ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="light"
                  className="d-flex align-items-center gap-2 border-0"
                >
                  <i className="bi bi-person-circle"></i>
                  <span className="fw-500">{user.name ?? user.fullName ?? user.email}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/ho-so">
                    <i className="bi bi-person me-2"></i>Hồ sơ
                  </Dropdown.Item>
                  {user.role === 'CANDIDATE' && (
                    <Dropdown.Item as={Link} to="/don-ung-tuyen">
                      <i className="bi bi-file-earmark-text me-2"></i>Đơn ứng tuyển
                    </Dropdown.Item>
                  )}
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
            <Button as={Link as any} to="/dang-tin" className="btn-primary-gradient ms-2">
              Đăng tin tuyển dụng
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
