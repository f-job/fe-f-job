import { Badge, Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { careerArticles, careerCategories } from '@/data/careerGuide';
import './CareerGuidePage.css';

export default function CareerGuidePage() {
  const featuredArticles = careerArticles.filter((article) => article.featured);
  const latestArticles = careerArticles.filter((article) => !article.featured);
  const popularArticles = careerArticles.slice(0, 4);
  const [mainArticle, ...sideArticles] = featuredArticles;

  return (
    <main className="career-guide-page">
      <Container>
        <nav className="career-breadcrumb" aria-label="breadcrumb">
          <span>Trang chủ</span>
          <i className="bi bi-chevron-right" />
          <strong>Cẩm nang nghề nghiệp</strong>
        </nav>

        <section className="career-guide-hero">
          <div>
            <p className="career-eyebrow">F-Job Career Guide</p>
            <h1>Cẩm nang nghề nghiệp</h1>
            <p>
              Kiến thức thực tế cho ứng viên tìm việc thời vụ, việc sự kiện và
              các ca làm linh hoạt.
            </p>
          </div>
        </section>

        <section className="career-category-strip" aria-label="Danh mục bài viết">
          {careerCategories.map((category) => (
            <button
              className={`career-category ${category === 'Tất cả' ? 'active' : ''}`}
              key={category}
              type="button"
            >
              {category}
            </button>
          ))}
        </section>

        <section className="career-section">
          <div className="section-heading-row">
            <h2>Bài viết nổi bật</h2>
            <span>Chọn lọc cho người mới bắt đầu</span>
          </div>

          <Row className="g-3">
            <Col lg={7}>
              <Link
                className="featured-main-card"
                to={`/cam-nang-nghe-nghiep/${mainArticle.slug}`}
              >
                <div className="featured-icon">
                  <i className={`bi ${mainArticle.icon}`} />
                </div>
                <Badge className="article-category-badge">
                  {mainArticle.category}
                </Badge>
                <h3>{mainArticle.title}</h3>
                <p>{mainArticle.desc}</p>
                <div className="article-meta">
                  <i className="bi bi-clock" />
                  {mainArticle.readTime}
                </div>
              </Link>
            </Col>

            <Col lg={5}>
              <div className="featured-side-list">
                {sideArticles.map((article) => (
                  <Link
                    className="featured-side-card"
                    key={article.title}
                    to={`/cam-nang-nghe-nghiep/${article.slug}`}
                  >
                    <div className="side-icon">
                      <i className={`bi ${article.icon}`} />
                    </div>
                    <div>
                      <span>{article.category}</span>
                      <h3>{article.title}</h3>
                      <small>{article.readTime}</small>
                    </div>
                  </Link>
                ))}
              </div>
            </Col>
          </Row>
        </section>

        <section className="career-section">
          <div className="section-heading-row">
            <h2>Bài viết mới nhất</h2>
            <span>Cập nhật theo nhu cầu ứng viên F-Job</span>
          </div>

          <Row className="g-4">
            <Col lg={8}>
              <Row className="g-3">
                {latestArticles.map((article) => (
                  <Col md={6} key={article.title}>
                    <Card
                      as={Link as any}
                      to={`/cam-nang-nghe-nghiep/${article.slug}`}
                      className="article-card h-100 border-0 shadow-sm"
                    >
                      <Card.Body>
                        <Badge className="article-category-badge">
                          {article.category}
                        </Badge>
                        <h3>{article.title}</h3>
                        <p>{article.desc}</p>
                        <div className="article-meta">
                          <i className="bi bi-clock" />
                          {article.time} · {article.readTime}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Col>

            <Col lg={4}>
              <aside className="career-sidebar">
                <h2>Đọc nhiều</h2>
                <ol>
                  {popularArticles.map((article) => (
                    <li key={article.slug}>
                      <Link to={`/cam-nang-nghe-nghiep/${article.slug}`}>
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </aside>
            </Col>
          </Row>
        </section>
      </Container>
    </main>
  );
}
