import { Container, Row, Col } from 'react-bootstrap';
import { urgentJobs } from '@/data/mockData';
import { JobCard } from './JobCard';

export function UrgentJobs() {
  return (
    <section className="section">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title mb-0">
            <i className="bi bi-fire text-danger me-2" />
            Việc làm tuyển gấp
          </h2>
          <a href="#" className="text-decoration-none fw-500" style={{ color: 'var(--primary)' }}>
            Xem thêm <i className="bi bi-chevron-right small" />
          </a>
        </div>

        <Row className="g-3">
          {urgentJobs.map((job) => (
            <Col md={6} lg={4} key={job.id}>
              <JobCard job={job} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
