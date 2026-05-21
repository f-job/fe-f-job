import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import './HeroSection.css';

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-overlay">
        <Container className="hero-content text-center text-white">
          <h1 className="display-5 fw-bold mb-3">
            Tìm việc thời vụ nhanh — Kết nối ngay với sự kiện
          </h1>
          <p className="lead mb-0 opacity-90">
            Hàng nghìn cơ hội việc làm sự kiện đang chờ bạn
          </p>
        </Container>
      </div>

      <Container>
        <div className="search-bar-wrapper">
          <Row className="g-2 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Nhập vai trò công việc..."
                  className="search-input"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Select className="search-input">
                <option value="">Tất cả địa điểm</option>
                <option>Hồ Chí Minh</option>
                <option>Hà Nội</option>
                <option>Đà Nẵng</option>
                <option>Cần Thơ</option>
                <option>Bình Dương</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                className="search-input"
                placeholder="Chọn ngày"
              />
            </Col>
            <Col md={2}>
              <Form.Select className="search-input">
                <option value="">Mức lương</option>
                <option>200k - 400k/ngày</option>
                <option>400k - 700k/ngày</option>
                <option>700k - 1tr/ngày</option>
                <option>Trên 1tr/ngày</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button className="btn-primary-gradient w-100 py-2">
                <i className="bi bi-search me-2" />
                Tìm việc
              </Button>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
}
