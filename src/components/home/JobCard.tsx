import { Job } from '@/types';

interface JobCardProps {
  job: Job;
}

function getTagLabel(tag: string) {
  switch (tag) {
    case 'urgent': return 'Gấp';
    case 'hot': return 'Hot';
    case 'new': return 'Mới';
    default: return tag;
  }
}

function getTagClass(tag: string) {
  switch (tag) {
    case 'urgent': return 'tag-urgent';
    case 'hot': return 'tag-hot';
    case 'new': return 'tag-new';
    default: return '';
  }
}

export function JobCard({ job }: JobCardProps) {
  return (
    <div className="job-card card-hover p-3 position-relative">
      {job.tags.length > 0 && (
        <div className="position-absolute top-0 end-0 p-2 d-flex gap-1">
          {job.tags.map((tag) => (
            <span key={tag} className={getTagClass(tag)}>
              {getTagLabel(tag)}
            </span>
          ))}
        </div>
      )}

      <h6 className="fw-bold mb-2 pe-5 job-title">{job.title}</h6>

      <div className="d-flex align-items-center gap-2 mb-2">
        <div className="company-logo">
          <i className="bi bi-building" />
        </div>
        <span className="text-muted small">{job.company}</span>
        {job.verified && (
          <i className="bi bi-patch-check-fill text-primary small" />
        )}
      </div>

      <div className="job-details">
        <div className="job-detail-item">
          <i className="bi bi-cash-coin" />
          <span className="salary-text">{job.salary}</span>
        </div>
        <div className="job-detail-item">
          <i className="bi bi-geo-alt" />
          <span>{job.location}</span>
        </div>
        <div className="job-detail-item">
          <i className="bi bi-calendar-event" />
          <span>{job.date}</span>
        </div>
        <div className="job-detail-item">
          <i className="bi bi-people" />
          <span>Cần {job.slots} người</span>
        </div>
      </div>

      <div className="d-flex gap-2 mt-2 flex-wrap">
        <span className="badge-event-type">{job.eventType}</span>
        <span className="badge-shift">{job.shift}</span>
      </div>

      <div className="job-card-footer mt-3 pt-2 border-top">
        <small className="text-muted">
          <i className="bi bi-clock me-1" />
          Còn {job.deadline} ngày
        </small>
      </div>
    </div>
  );
}
