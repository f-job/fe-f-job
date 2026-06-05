import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './HeroSection.css';

interface Commune {
  id: number;
  name: string;
  code: string;
  provinceId: number;
}

// Danh sách ảnh background
const heroImages = [
  {
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    title: 'Sự kiện âm nhạc',
  },
  {
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
    title: 'Sự kiện hội nghị',
  },
  {
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622',
    title: 'Sự kiện tiệc tùng',
  },
  {
    url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329',
    title: 'Sự kiện triển lãm',
  },
  {
    url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94',
    title: 'Sự kiện thể thao',
  },
];

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto slide every 5 seconds
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    // Load communes for Đà Nẵng (province ID: 48)
    setLoadingCommunes(true);
    axios.get('https://production.cas.so/address-kit/2025-07-01/provinces/48/communes')
      .then((response) => {
        console.log('Communes API Response (Hero):', response.data);
        
        let communeData: Commune[] = [];
        if (Array.isArray(response.data)) {
          communeData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            communeData = response.data.data;
          } else if (Array.isArray(response.data.communes)) {
            communeData = response.data.communes;
          }
        }
        
        console.log('Parsed commune data (Hero):', communeData);
        setCommunes(communeData);
      })
      .catch((error) => {
        console.error('Failed to load communes (Hero):', error);
      })
      .finally(() => {
        setLoadingCommunes(false);
      });

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <section className="hero-section">
      {/* Image Slider Background */}
      <div className="hero-background">
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`hero-slide ${index === currentImageIndex ? 'active' : ''}`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.75)), url(${image.url}?w=1920&q=80)`,
            }}
          />
        ))}
        
        {/* Floating shapes overlay */}
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
          <div className="shape shape-6"></div>
        </div>
      </div>

      <div className="hero-overlay">
        <Container className="hero-content text-center text-white">
          <div className={`hero-text-wrapper ${isVisible ? 'visible' : ''}`}>
            <div className="hero-badge">
              <i className="bi bi-star-fill me-2"></i>
              Nền tảng tìm việc #1 Việt Nam
            </div>
            <h1 className="hero-title">
              Tìm việc thời vụ nhanh
              <br />
              <span className="highlight-text">Kết nối ngay với F-Job</span>
            </h1>
            <p className="hero-subtitle">
              Hàng nghìn cơ hội việc làm sự kiện đang chờ bạn
              <br />
              <span className="text-warning fw-semibold">
                <i className="bi bi-lightning-charge-fill"></i> 
                Đăng ký miễn phí - Ứng tuyển nhanh chóng
              </span>
            </p>
            
            {/* Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Công việc</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">5K+</div>
                <div className="stat-label">Nhà tuyển dụng</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Ứng viên</div>
              </div>
            </div>
          </div>
        </Container>
        
        {/* Slider Navigation Dots */}
        <div className="slider-dots">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <Container>
        <div className={`search-bar-wrapper ${isVisible ? 'visible' : ''}`}>
          <div className="search-bar-header">
            <h3 className="search-title">
              <i className="bi bi-search me-2"></i>
              Bắt đầu tìm kiếm công việc mơ ước
            </h3>
            <p className="search-subtitle">Lọc theo vị trí, ngày và mức lương</p>
          </div>
          
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="search-label">
                  <i className="bi bi-briefcase me-1"></i>
                  Vai trò công việc
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="VD: Nhân viên phục vụ, MC..."
                  className="search-input"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="search-label">
                  <i className="bi bi-geo-alt me-1"></i>
                  Tỉnh / Thành
                </Form.Label>
                <Form.Control
                  type="text"
                  value="Đà Nẵng"
                  disabled
                  className="search-input bg-light"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="search-label">
                  <i className="bi bi-pin-map me-1"></i>
                  Xã / Phường
                </Form.Label>
                <Form.Select className="search-input" disabled={loadingCommunes}>
                  <option value="">Tất cả xã/phường</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="search-label">
                  <i className="bi bi-calendar-event me-1"></i>
                  Ngày làm việc
                </Form.Label>
                <Form.Control
                  type="date"
                  className="search-input"
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="search-label">
                  <i className="bi bi-cash me-1"></i>
                  Mức lương
                </Form.Label>
                <Form.Select className="search-input">
                  <option value="">Tất cả</option>
                  <option>200k - 400k</option>
                  <option>400k - 700k</option>
                  <option>700k - 1tr</option>
                  <option>Trên 1tr</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={1}>
              <Button className="btn-search w-100">
                <i className="bi bi-search" />
              </Button>
            </Col>
          </Row>
          
          {/* Popular searches */}
          <div className="popular-searches">
            <span className="popular-label">
              <i className="bi bi-fire me-1"></i>
              Tìm kiếm phổ biến:
            </span>
            <div className="popular-tags">
              <span className="popular-tag">Phục vụ sự kiện</span>
              <span className="popular-tag">MC</span>
              <span className="popular-tag">PG/PB</span>
              <span className="popular-tag">Bảo vệ</span>
              <span className="popular-tag">Nhân viên kho</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
