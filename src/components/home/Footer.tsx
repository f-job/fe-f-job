import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--footer-bg)' }} className="text-white pt-5 pb-3">
      <Container>
        <Row className="g-4 mb-4">
          <Col md={3}>
            <h5 className="fw-bold mb-3">
              <span className="text-gradient">F-Job</span>
            </h5>
            <p className="text-white-50 small">
              Nền tảng kết nối việc làm thời vụ và sự kiện hàng đầu cho sinh viên Việt Nam.
            </p>
          </Col>

          <Col md={3}>
            <h6 className="fw-bold mb-3">Dành cho ứng viên</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/viec-lam" className="text-white-50 text-decoration-none small">
                  Tìm việc
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/ho-so" className="text-white-50 text-decoration-none small">
                  Tạo hồ sơ
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/lich-su" className="text-white-50 text-decoration-none small">
                  Lịch sử ứng tuyển
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={3}>
            <h6 className="fw-bold mb-3">Dành cho nhà tuyển dụng</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/dang-tin" className="text-white-50 text-decoration-none small">
                  Đăng tin
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/quan-ly-tin" className="text-white-50 text-decoration-none small">
                  Quản lý tin
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/tim-ung-vien" className="text-white-50 text-decoration-none small">
                  Tìm ứng viên
                </Link>
              </li>
            </ul>
          </Col>

          <Col md={3}>
            <h6 className="fw-bold mb-3">Liên hệ</h6>
            <ul className="list-unstyled">
              <li className="mb-2 text-white-50 small">
                <i className="bi bi-envelope me-2" />
                contact@fjob.vn
              </li>
              <li className="mb-2 text-white-50 small">
                <i className="bi bi-telephone me-2" />
                0123 456 789
              </li>
              <li className="mb-2 text-white-50 small">
                <i className="bi bi-geo-alt me-2" />
                TP. Hồ Chí Minh, Việt Nam
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="border-secondary" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
          <small className="text-white-50">&copy; 2026 F-Job. All rights reserved.</small>
          <div className="d-flex gap-3 mt-2 mt-md-0">
            <a href="#" className="text-white-50 fs-5"><i className="bi bi-facebook" /></a>
            <a href="#" className="text-white-50 fs-5"><i className="bi bi-linkedin" /></a>
            <a href="#" className="text-white-50 fs-5"><i className="bi bi-chat-dots" /></a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
