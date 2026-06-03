import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import jobService from '@services/jobService';
import type { BackendJob } from '@/types/api';
import { formatSalary, getEntityId } from '@utils/format';
import { urgentJobs as mockUrgentJobs } from '@/data/mockData';
import { JobCard } from './JobCard';

function BackendUrgentCard({ job }: { job: BackendJob }) {
  const id = getEntityId(job);
  return (
    <div className="job-card card-hover p-3 position-relative h-100">
      {job.isUrgent && (
        <div className="position-absolute top-0 end-0 p-2">
          <span className="tag-urgent">Gấp</span>
        </div>
      )}
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
        <div className="job-detail-item">
          <i className="bi bi-people" />
          <span>Cần {job.slots} người</span>
        </div>
      </div>
      <div className="d-flex gap-2 mt-2 flex-wrap">
        <span className="badge-event-type">{job.industry}</span>
        <span className="badge-shift">{job.jobType}</span>
      </div>
      <div className="job-card-footer mt-3 pt-2 border-top d-flex justify-content-between">
        <small className="text-muted">
          <i className="bi bi-eye me-1" />{job.viewCount} lượt xem
        </small>
        <Link to={`/viec-lam/${id}`} className="small text-decoration-none fw-500">
          Chi tiết <i className="bi bi-chevron-right" />
        </Link>
      </div>
    </div>
  );
}

export function UrgentJobs() {
  const [jobs, setJobs] = useState<BackendJob[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    jobService
      .listUrgent()
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
  }, []);

  // Fall back to mock data while the backend has no urgent jobs seeded yet.
  const useBackend = !!jobs && jobs.length > 0;

  return (
    <section className="section">
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title mb-0">
            <i className="bi bi-fire text-danger me-2" />
            Việc làm tuyển gấp
          </h2>
          <Link to="/viec-lam?is_urgent=true" className="text-decoration-none fw-500" style={{ color: 'var(--primary)' }}>
            Xem thêm <i className="bi bi-chevron-right small" />
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <Spinner />
          </div>
        ) : useBackend ? (
          <Row className="g-3">
            {jobs!.map((job) => (
              <Col md={6} lg={4} key={getEntityId(job)}>
                <BackendUrgentCard job={job} />
              </Col>
            ))}
          </Row>
        ) : (
          <Row className="g-3">
            {mockUrgentJobs.map((job) => (
              <Col md={6} lg={4} key={job.id}>
                <JobCard job={job} />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </section>
  );
}
