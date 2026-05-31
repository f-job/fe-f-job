import api from './api';
import type {
  BackendJob,
  CandidateSearchResult,
  Industry,
  JobTypeOption,
  LevelOption,
  Paginated,
  Province,
  DistrictsResponse,
  SearchCandidatesQuery,
  SearchJobsQuery,
  SkillOption,
} from '@/types/api';

/**
 * Advanced search + master-data API.
 * Prefixes: `/search`, `/industries`, `/locations`, `/skills`, `/levels`, `/job-types`.
 * `/search/candidates` requires an EMPLOYER or ADMIN token; everything else is public.
 */
const searchService = {
  /** GET /search/jobs — advanced job search. */
  searchJobs(query: SearchJobsQuery = {}) {
    return api.get<Paginated<BackendJob>>('/search/jobs', { params: query });
  },

  /** GET /search/candidates — search candidate profiles (Employer/Admin). */
  searchCandidates(query: SearchCandidatesQuery = {}) {
    return api.get<Paginated<CandidateSearchResult>>('/search/candidates', { params: query });
  },

  /** GET /search/suggestions — autocomplete keywords. */
  suggestions(q?: string) {
    return api.get<string[]>('/search/suggestions', { params: q ? { q } : {} });
  },

  // ─── Metadata (master data, public) ────────────────────────────────────────
  listIndustries() {
    return api.get<Industry[]>('/industries');
  },
  getIndustry(id: string) {
    return api.get<Industry>(`/industries/${id}`);
  },
  jobsByIndustry(id: string, page = 1, limit = 10) {
    return api.get<{ industry: Industry } & Paginated<BackendJob>>(
      `/industries/${id}/jobs`,
      { params: { page, limit } },
    );
  },
  listProvinces() {
    return api.get<Province[]>('/locations/provinces');
  },
  districtsByProvince(provinceId: string) {
    return api.get<DistrictsResponse>(`/locations/${provinceId}/districts`);
  },
  listSkills() {
    return api.get<SkillOption[]>('/skills');
  },
  listLevels() {
    return api.get<LevelOption[]>('/levels');
  },
  listJobTypes() {
    return api.get<JobTypeOption[]>('/job-types');
  },
};

export default searchService;
