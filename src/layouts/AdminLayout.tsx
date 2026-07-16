import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Button, Dropdown } from 'react-bootstrap';
import './AdminLayout.css';
import { useAuthStore } from '@stores/authStore';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/admin/users', label: 'Người dùng', icon: 'bi-people' },
    { path: '/admin/candidates', label: 'Ứng viên', icon: 'bi-person-badge' },
    { path: '/admin/employers', label: 'Nhà tuyển dụng', icon: 'bi-building' },
    { path: '/admin/jobs', label: 'Duyệt tin', icon: 'bi-briefcase' },
    { path: '/admin/reviews', label: 'Đánh giá', icon: 'bi-star' },
    { path: '/admin/verifications', label: 'Xác minh', icon: 'bi-shield-check' },
    { path: '/admin/reports', label: 'Báo cáo', icon: 'bi-flag' },
    { path: '/admin/audit-logs', label: 'Nhật ký', icon: 'bi-journal-text' },
    { path: '/admin/packages', label: 'Gói & Credit', icon: 'bi-box-seam' },
    { path: '/admin/monitoring', label: 'Monitoring', icon: 'bi-activity' },
  ];

  return (
    <div className="admin-layout d-flex min-vh-100">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Link to="/admin" className="admin-sidebar-brand text-decoration-none">
          <i className="bi bi-robot me-2"></i>
          F-Job Admin
        </Link>
        <div className="admin-sidebar-nav">
          {navItems.map((item) => (
            <div key={item.path} className="admin-nav-item">
              <NavLink 
                to={item.path} 
                end={item.path === '/admin'}
                className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon} admin-nav-icon`}></i>
                {item.label}
              </NavLink>
            </div>
          ))}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className="sidebar-overlay" 
        onClick={closeSidebar} 
        aria-hidden="true"
      ></div>

      {/* Main Content Area */}
      <div className="admin-main flex-grow-1 d-flex flex-column">
        {/* Top Header */}
        <header className="admin-header d-flex align-items-center justify-content-between px-3 shadow-sm">
          <div className="d-flex align-items-center">
            <Button 
              variant="link" 
              className="text-dark d-lg-none p-0 me-3 fs-4" 
              onClick={toggleSidebar}
            >
              <i className="bi bi-list"></i>
            </Button>
            <h5 className="mb-0 d-none d-md-block fw-bold text-dark">
              {navItems.find((i) => i.path === location.pathname)?.label || 'Dashboard'}
            </h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <Link to="/" className="btn btn-outline-primary btn-sm rounded-pill px-3 d-none d-sm-inline-block">
              Về trang chủ
            </Link>
            
            <Dropdown align="end">
              <Dropdown.Toggle variant="light" className="border-0 bg-transparent d-flex align-items-center gap-2 no-caret p-0">
                <div className="company-logo bg-primary text-white rounded-circle">
                  {user?.firstName?.charAt(0) || 'A'}
                </div>
              </Dropdown.Toggle>
              <Dropdown.Menu className="shadow-sm border-0">
                <Dropdown.Header>{user?.firstName} {user?.lastName}</Dropdown.Header>
                <Dropdown.Item as={Link} to="/ho-so">
                  <i className="bi bi-person me-2"></i> Hồ sơ
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={logout} className="text-danger">
                  <i className="bi bi-box-arrow-right me-2"></i> Đăng xuất
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>

        {/* Main Content */}
        <main className="admin-content p-3 p-md-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
