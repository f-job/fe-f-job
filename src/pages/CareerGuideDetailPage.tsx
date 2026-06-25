import { Badge, Card, Col, Container, Row } from 'react-bootstrap';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  findCareerArticle,
  getRelatedCareerArticles,
  careerArticles,
} from '@/data/careerGuide';
import './CareerGuidePage.css';

export default function CareerGuideDetailPage() {
  const { slug } = useParams();
  const article = findCareerArticle(slug);

  if (!article) {
    return <Navigate to="/cam-nang-nghe-nghiep" replace />;
  }

  const relatedArticles = getRelatedCareerArticles(article);
  const popularArticles = careerArticles.slice(0, 4);

  return (
    <main className="career-guide-page career-detail-page">
      <Container>
        <nav className="career-breadcrumb" aria-label="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <i className="bi bi-chevron-right" />
          <Link to="/cam-nang-nghe-nghiep">Cẩm nang nghề nghiệp</Link>
          <i className="bi bi-chevron-right" />
          <strong>{article.category}</strong>
        </nav>

        <Row className="g-4">
          <Col lg={8}>
            <article className="career-detail-article">
              <Badge className="article-category-badge">
                {article.category}
              </Badge>
              <h1>{article.title}</h1>
              <p className="career-detail-summary">{article.desc}</p>

              <div className="career-detail-meta">
                <span>
                  <i className="bi bi-clock" />
                  {article.time}
                </span>
                <span>
                  <i className="bi bi-journal-text" />
                  {article.readTime}
                </span>
                <span>
                  <i className={`bi ${article.icon}`} />
                  F-Job Guide
                </span>
              </div>

              <div className="career-detail-cover">
                <i className={`bi ${article.icon}`} />
              </div>

              <div className="career-detail-content">
                {article.content.map((section) => (
                  <section key={section.heading}>
                    <h2>{section.heading}</h2>
                    <p>{section.body}</p>
                    {section.bullets && (
                      <ul>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                ))}
              </div>
            </article>

            <section className="career-section">
              <div className="section-heading-row">
                <h2>Bài viết liên quan</h2>
                <span>Cùng chủ đề {article.category.toLowerCase()}</span>
              </div>

              <Row className="g-3">
                {relatedArticles.map((related) => (
                  <Col md={4} key={related.slug}>
                    <Card
                      as={Link as any}
                      to={`/cam-nang-nghe-nghiep/${related.slug}`}
                      className="article-card h-100 border-0 shadow-sm"
                    >
                      <Card.Body>
                        <Badge className="article-category-badge">
                          {related.category}
                        </Badge>
                        <h3>{related.title}</h3>
                        <div className="article-meta">
                          <i className="bi bi-clock" />
                          {related.readTime}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </section>
          </Col>

          <Col lg={4}>
            <aside className="career-sidebar career-detail-sidebar">
              <h2>Đọc nhiều</h2>
              <ol>
                {popularArticles.map((popular) => (
                  <li key={popular.slug}>
                    <Link to={`/cam-nang-nghe-nghiep/${popular.slug}`}>
                      {popular.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </aside>
          </Col>
        </Row>
      </Container>
    </main>
  );
}
