import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import jobService from '@services/jobService';
import { useAuthStore } from '@stores/authStore';
import type { BackendJob } from '@/types/api';
import { formatSalary, getEntityId } from '@utils/format';

function RecommendedCard({ job }: { job: BackendJob }) {
  const id = getEntityId(job);
  return (
    <div className="job-card card-hover p-3 position-relative h-100">
      <div className="position-absolute top-0 end-0 p-2">
        <span className="tag-new">Gợi ý</span>
      </div>
      <h6 className="fw-bold mb-2 pe-5 job-title">{job.title}</h6>
      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="company-logo"><i className="bi bi-building" /></div>
        <span className="text-muted small">{job.companyName}</span>
      </div>
      <div className="job-details">
        <div className="job-detail-item">
          <i className="bi bi-cash-coin" />
          <span className="salary-text">{formatSalary(job.salaryAmount, job.salaryType)}</span>
        </div>
        <div className="job-detail-item">
          <i className="bi bi-geo-alt" />
          <span>{job.location}</span>
        </div>
        <div className="job-detail-item">
          <i className="bi bi-clock" />
          <span>{job.workingTimeText}</span>
        </div>
      </div>
      <div className="d-flex gap-2 mt-2 flex-wrap">
        <span className="badge-event-type">{job.industry}</span>
        <span className="badge-shift">{job.jobType}</span>
      </div>
      <div className="job-card-footer mt-3 pt-2 border-top text-end">
        <Link to={`/viec-lam/${id}`} className="small text-decoration-none fw-500">
          Chi tiết <i className="bi bi-chevron-right" />
        </Link>
      </div>
    </div>
  );
}

/**
 * "Gợi ý cho bạn" — only rendered for authenticated CANDIDATE users.
 * Backed by GET /jobs/recommended (CANDIDATE-only endpoint).
 */
export function RecommendedJobs() {
  const { isAuthenticated, user } = useAuthStore();
  const isCandidate = isAuthenticated && user?.role === 'CANDIDATE';

  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isCandidate) {
      setIsLoading(false);
      return;
    }
    let active = true;
    jobService
      .listRecommended()
      .then(({ data }) => {
        if (active) setJobs(data.data ?? []);
      })
      .catch(() => {
        if (active) setJobs([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isCandidate]);

  // Hide the whole section for guests/employers, or when there is nothing to show.
  if (!isCandidate) return null;
  if (!isLoading && jobs.length === 0) return null;

  return (
    <section className="section">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title mb-0">
            <i className="bi bi-stars text-warning me-2" />
            Gợi ý cho bạn
          </h2>
          <Link to="/viec-lam" className="text-decoration-none fw-500" style={{ color: 'var(--primary)' }}>
            Xem tất cả <i className="bi bi-chevron-right small" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner />
          </div>
        ) : (
          <Row className="g-3">
            {jobs.map((job) => (
              <Col md={6} lg={4} key={getEntityId(job)}>
                <RecommendedCard job={job} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </section>
  );
}
