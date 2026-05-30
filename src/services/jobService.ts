import api from './api';
import type {
  BackendJob,
  IndustryStat,
  ListJobsQuery,
  Paginated,
} from '@/types/api';

/** Non-paginated list responses share this `{ data, total }` envelope. */
interface JobListEnvelope {
  data: BackendJob[];
  total: number;
}

/**
 * Public + candidate-facing Jobs API — backend prefix `/jobs`.
 * `/jobs/recommended` requires a CANDIDATE token; the rest are public.
 */
const jobService = {
  /** GET /jobs — paginated, filtered list of ACTIVE jobs. */
  list(query: ListJobsQuery = {}) {
    return api.get<Paginated<BackendJob>>('/jobs', { params: query });
  },

  /** GET /jobs/urgent — top urgent gigs. */
  listUrgent() {
    return api.get<JobListEnvelope>('/jobs/urgent');
  },

  /** GET /jobs/recommended — personalized gigs (CANDIDATE only). */
  listRecommended() {
    return api.get<JobListEnvelope>('/jobs/recommended');
  },

  /** GET /jobs/stats/industry — job counts grouped by industry. */
  industryStats() {
    return api.get<IndustryStat[]>('/jobs/stats/industry');
  },

  /** GET /jobs/:id — single job detail (increments viewCount). */
  getById(id: string) {
    return api.get<BackendJob>(`/jobs/${id}`);
  },

  /** GET /jobs/:id/applications — the candidate's own application(s) for a job. */
  getMyApplicationsForJob(id: string, page = 1, limit = 10) {
    return api.get(`/jobs/${id}/applications`, { params: { page, limit } });
  },
};

export default jobService;
