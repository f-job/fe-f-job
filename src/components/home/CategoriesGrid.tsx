import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import jobService from '@services/jobService';
import type { IndustryStat } from '@/types/api';
import { categories } from '@/data/mockData';

// Map known industries to Bootstrap icons; fall back to a generic grid icon.
const INDUSTRY_ICONS: Record<string, string> = {
  'F&B': 'bi-cup-straw',
  'Sự kiện': 'bi-calendar-event',
  'Giao hàng': 'bi-truck',
  'Bán lẻ': 'bi-shop',
  Concert: 'bi-music-note-beamed',
  'Hội chợ': 'bi-shop-window',
  'Triển lãm': 'bi-easel',
  'Hội nghị': 'bi-building',
};

function iconFor(industry: string): string {
  return INDUSTRY_ICONS[industry] ?? 'bi-briefcase';
}

export function CategoriesGrid() {
  const [stats, setStats] = useState<IndustryStat[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    jobService
      .industryStats()
      .then(({ data }) => {
        if (active) setStats(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setStats([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const useBackend = !!stats && stats.length > 0;

  return (
    <section className="section section-categories">
      <Container>
        <div className="categories-wrapper p-3 p-md-4">
          {isLoading ? (
            <div className="text-center py-4">
              <Spinner />
            </div>
          ) : useBackend ? (
            <Row className="g-3">
              {stats!.map((stat) => (
                <Col xs={6} md={4} lg={3} key={stat.industry}>
                  <Link
                    to={`/viec-lam?keyword=${encodeURIComponent(stat.industry)}`}
                    className="category-item"
                  >
                    <i
                      className={`bi ${iconFor(stat.industry)} category-icon`}
                    />
                    <div>
                      <span className="category-count">{stat.count} việc</span>
                      <span className="category-name">{stat.industry}</span>
                    </div>
                  </Link>
                </Col>
              ))}
              <Col xs={6} md={4} lg={3}>
                <Link to="/viec-lam" className="category-item">
                  <i className="bi bi-grid category-icon" />
                  <div>
                    <span className="category-name">Tất cả danh mục</span>
                  </div>
                </Link>
              </Col>
            </Row>
          ) : (
            // Fallback to mock categories while the backend has no active jobs yet.
            <Row className="g-3">
              {categories.map((cat) => (
                <Col xs={6} md={4} lg={3} key={cat.id}>
                  <Link
                    to={`/viec-lam?keyword=${encodeURIComponent(cat.name)}`}
                    className="category-item"
                  >
                    <i className={`bi ${cat.icon} category-icon`} />
                    <div>
                      <span className="category-count">
                        {cat.jobCount} việc
                      </span>
                      <span className="category-name">{cat.name}</span>
                    </div>
                  </Link>
                </Col>
              ))}
              <Col xs={6} md={4} lg={3}>
                <Link to="/viec-lam" className="category-item">
                  <i className="bi bi-grid category-icon" />
                  <div>
                    <span className="category-name">Tất cả danh mục</span>
                  </div>
                </Link>
              </Col>
            </Row>
          )}
        </div>
      </Container>
    </section>
  );
}
