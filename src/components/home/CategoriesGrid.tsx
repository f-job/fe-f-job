import { Container, Row, Col } from 'react-bootstrap';
import { categories } from '@/data/mockData';

export function CategoriesGrid() {
  return (
    <section className="section" style={{ backgroundColor: 'var(--secondary-bg)' }}>
      <Container>
        <div className="bg-white rounded-4 p-4 shadow-sm">
          <Row className="g-3">
            {categories.map((cat) => (
              <Col xs={6} md={4} lg={3} key={cat.id}>
                <a href="#" className="category-item" onClick={(e) => e.preventDefault()}>
                  <i className={`bi ${cat.icon} category-icon`} />
                  <div>
                    <span className="category-count">{cat.jobCount} việc</span>
                    <span className="category-name">{cat.name}</span>
                  </div>
                </a>
              </Col>
            ))}
            <Col xs={6} md={4} lg={3}>
              <a href="#" className="category-item" onClick={(e) => e.preventDefault()}>
                <i className="bi bi-grid category-icon" />
                <div>
                  <span className="category-name">Tất cả danh mục</span>
                </div>
              </a>
            </Col>
          </Row>
        </div>
      </Container>
    </section>
  );
}
