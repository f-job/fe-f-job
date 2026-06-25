import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Pagination,
  Row,
  Spinner,
} from 'react-bootstrap';
import axios from 'axios';
import jobService from '@services/jobService';
import type {
  BackendJob,
  CasualJobType,
  ExperienceLevel,
  JobSortOption,
  ListJobsQuery,
  PaginationMeta,
} from '@/types/api';
import { formatDate, formatSalary, getErrorMessage, getEntityId } from '@utils/format';

interface Commune {
  id: number;
  name: string;
  code: string;
  provinceId: number;
}

const JOB_TYPES: CasualJobType[] = ['Part-time', 'Event', 'Seasonal'];
const LEVELS: ExperienceLevel[] = ['No Experience', '< 6 Months', '> 6 Months'];
const SORTS: { value: JobSortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'salary_high', label: 'Lương cao' },
  { value: 'salary_low', label: 'Lương thấp' },
];

const LIMIT = 9;

function JobGridCard({ job }: { job: BackendJob }) {
  const id = getEntityId(job);
  return (
    <Card className="h-100 border-0 shadow-sm card-hover">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h6 className="fw-bold mb-0 pe-2">{job.title}</h6>
          {job.isUrgent && <Badge bg="danger">Gấp</Badge>}
        </div>
        <div className="text-muted small mb-2">
          <i className="bi bi-building me-1" />
          {job.companyName}
        </div>
        <div className="d-flex flex-column gap-1 small mb-3">
          <span className="text-success fw-500">
            <i className="bi bi-cash-coin me-1" />
            {formatSalary(job.salaryAmount, job.salaryType)}
          </span>
          <span>
            <i className="bi bi-geo-alt me-1" />
            {job.location}
            {job.district ? `, ${job.district}` : ''}
          </span>
          <span>
            <i className="bi bi-clock me-1" />
            {job.workingTimeText}
          </span>
          <span>
            <i className="bi bi-people me-1" />
            Cần {job.slots} người
          </span>
        </div>
        <div className="d-flex gap-2 flex-wrap mb-3">
          <Badge bg="light" text="dark">{job.jobType}</Badge>
          <Badge bg="light" text="dark">{job.industry}</Badge>
          <Badge bg="light" text="dark">{job.level}</Badge>
        </div>
        <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
          <small className="text-muted">Hết hạn: {formatDate(job.expiresAt)}</small>
          <Button as={Link as any} to={`/viec-lam/${id}`} size="sm" variant="outline-primary">
            Chi tiết
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  // Controlled filter inputs (seeded from URL query string)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [jobType, setJobType] = useState(searchParams.get('job_type') ?? '');
  const [level, setLevel] = useState(searchParams.get('level') ?? '');
  const [sort, setSort] = useState<JobSortOption>(
    (searchParams.get('sort') as JobSortOption) ?? 'newest'
  );
  const page = Number(searchParams.get('page') ?? '1');

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    const query: ListJobsQuery = {
      keyword: searchParams.get('keyword') || undefined,
      location: 'Đà Nẵng', // Force to Đà Nẵng
      district: searchParams.get('district') || undefined,
      job_type: (searchParams.get('job_type') as CasualJobType) || undefined,
      level: (searchParams.get('level') as ExperienceLevel) || undefined,
      sort: (searchParams.get('sort') as JobSortOption) || 'newest',
      page: Number(searchParams.get('page') ?? '1'),
      limit: LIMIT,
    };
    try {
      const { data } = await jobService.list(query);
      setJobs(data.data);
      console.log(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách việc làm'));
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadJobs();
    
    // Load communes for Đà Nẵng (province ID: 48)
    setLoadingCommunes(true);
    axios.get('https://production.cas.so/address-kit/2025-07-01/provinces/48/communes')
      .then((response) => {
        console.log('Communes API Response (JobsPage):', response.data);
        
        let communeData: Commune[] = [];
        if (Array.isArray(response.data)) {
          communeData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (Array.isArray(response.data.data)) {
            communeData = response.data.data;
          } else if (Array.isArray(response.data.communes)) {
            communeData = response.data.communes;
          }
        }
        
        console.log('Parsed commune data (JobsPage):', communeData);
        setCommunes(communeData);
      })
      .catch((error) => {
        console.error('Failed to load communes (JobsPage):', error);
      })
      .finally(() => {
        setLoadingCommunes(false);
      });
  }, [loadJobs]);

  const applyFilters = (nextPage = 1) => {
    const next: Record<string, string> = {};
    if (keyword) next.keyword = keyword;
    if (district) next.district = district;
    if (jobType) next.job_type = jobType;
    if (level) next.level = level;
    if (sort) next.sort = sort;
    next.page = String(nextPage);
    setSearchParams(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(1);
  };

  const goToPage = (p: number) => applyFilters(p);

  return (
    <Container className="py-4">
      <h1 className="h3 fw-bold mb-1">Việc làm sự kiện</h1>
      <p className="text-muted">Tìm job thời vụ phù hợp với lịch và vị trí của bạn.</p>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Control
                  placeholder="Từ khóa (vd: phục vụ bàn)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="text"
                  value="Đà Nẵng"
                  disabled
                  className="bg-light"
                  title="Hiện tại chỉ hỗ trợ khu vực Đà Nẵng"
                />
              </Col>
              <Col md={2}>
                <Form.Select 
                  value={district} 
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={loadingCommunes}
                >
                  <option value="">Tất cả xã/phường</option>
                  {communes.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                  <option value="">Loại job</option>
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={1}>
                <Form.Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">KN</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={1}>
                <Button type="submit" className="w-100 btn-primary-gradient">
                  <i className="bi bi-search" />
                </Button>
              </Col>
            </Row>
            <Row className="g-2 mt-1">
              <Col md={3}>
                <Form.Select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as JobSortOption);
                  }}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>Sắp xếp: {s.label}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className="text-center py-5">
          <Spinner />
          <p className="text-muted mt-3 mb-0">Đang tải việc làm...</p>
        </div>
      ) : jobs.length === 0 ? (
        <Alert variant="info">Không tìm thấy việc làm phù hợp với bộ lọc.</Alert>
      ) : (
        <>
          <p className="text-muted small">
            Tìm thấy {meta?.total ?? jobs.length} việc làm
          </p>
          <Row className="g-3">
            {jobs.map((job) => (
              <Col md={6} lg={4} key={getEntityId(job)}>
                <JobGridCard job={job} />
              </Col>
            ))}
          </Row>

          {meta && meta.totalPages > 1 && (
            <Pagination className="justify-content-center mt-4">
              <Pagination.Prev
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              />
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <Pagination.Item key={p} active={p === page} onClick={() => goToPage(p)}>
                  {p}
                </Pagination.Item>
              ))}
              <Pagination.Next
                disabled={page >= meta.totalPages}
                onClick={() => goToPage(page + 1)}
              />
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
}
