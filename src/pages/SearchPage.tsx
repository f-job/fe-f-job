import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Pagination,
  Row,
  Spinner,
} from 'react-bootstrap';
import searchService from '@services/searchService';
import type {
  BackendJob,
  Industry,
  JobSortOption,
  JobTypeOption,
  LevelOption,
  PaginationMeta,
  Province,
  District,
  SearchJobsQuery,
} from '@/types/api';
import { formatDate, formatSalary, getEntityId, getErrorMessage } from '@utils/format';

const SORTS: { value: JobSortOption; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'salary_high', label: 'Lương cao' },
  { value: 'salary_low', label: 'Lương thấp' },
];
const LIMIT = 9;

export default function SearchPage() {
  // master data
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeOption[]>([]);

  // filters
  const [keyword, setKeyword] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [industry, setIndustry] = useState('');
  const [level, setLevel] = useState('');
  const [jobType, setJobType] = useState('');
  const [sort, setSort] = useState<JobSortOption>('newest');
  const [page, setPage] = useState(1);

  // results
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load master data once
  useEffect(() => {
    searchService.listIndustries().then((r) => setIndustries(r.data)).catch(() => {});
    searchService.listProvinces().then((r) => setProvinces(r.data)).catch(() => {});
    searchService.listLevels().then((r) => setLevels(r.data)).catch(() => {});
    searchService.listJobTypes().then((r) => setJobTypes(r.data)).catch(() => {});
  }, []);

  // Load districts when province changes (province here is the display name)
  useEffect(() => {
    const selected = provinces.find((p) => p.name === province);
    if (!selected) {
      setDistricts([]);
      return;
    }
    searchService
      .districtsByProvince(selected.id)
      .then((r) => setDistricts(r.data.districts))
      .catch(() => setDistricts([]));
    setDistrict('');
  }, [province, provinces]);

  const runSearch = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError('');
      const query: SearchJobsQuery = {
        keyword: keyword || undefined,
        province: province || undefined,
        district: district || undefined,
        industry: industry || undefined,
        level: (level as SearchJobsQuery['level']) || undefined,
        jobType: (jobType as SearchJobsQuery['jobType']) || undefined,
        sort,
        page: targetPage,
        limit: LIMIT,
      };
      try {
        const { data } = await searchService.searchJobs(query);
        setJobs(data.data);
        setMeta(data.meta);
        setPage(targetPage);
      } catch (err) {
        setError(getErrorMessage(err, 'Tìm kiếm thất bại'));
      } finally {
        setLoading(false);
      }
    },
    [keyword, province, district, industry, level, jobType, sort],
  );

  // initial result load
  useEffect(() => {
    runSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyword = (value: string) => {
    setKeyword(value);
    clearTimeout(suggestTimer.current);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    suggestTimer.current = setTimeout(async () => {
      try {
        const { data } = await searchService.suggestions(value);
        setSuggestions(data);
        setShowSuggest(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggest(false);
    runSearch(1);
  };

  return (
    <Container className="py-4">
      <h1 className="h3 fw-bold mb-1">Tìm kiếm nâng cao</h1>
      <p className="text-muted">Lọc job theo ngành, khu vực, mức kinh nghiệm và loại hình.</p>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-2">
              <Col md={6} className="position-relative">
                <Form.Control
                  placeholder="Từ khóa (vd: phục vụ, PG/PB...)"
                  value={keyword}
                  onChange={(e) => handleKeyword(e.target.value)}
                  onFocus={() => suggestions.length && setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  autoComplete="off"
                />
                {showSuggest && suggestions.length > 0 && (
                  <ListGroup
                    className="position-absolute w-100 shadow-sm"
                    style={{ zIndex: 1000, maxHeight: 240, overflowY: 'auto' }}
                  >
                    {suggestions.map((s) => (
                      <ListGroup.Item
                        key={s}
                        action
                        onMouseDown={() => {
                          setKeyword(s);
                          setShowSuggest(false);
                        }}
                      >
                        <i className="bi bi-search me-2 text-muted"></i>{s}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Col>
              <Col md={3}>
                <Form.Select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">Tất cả ngành</option>
                  {industries.map((i) => (
                    <option key={i.id} value={i.name}>{i.icon} {i.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select value={sort} onChange={(e) => setSort(e.target.value as JobSortOption)}>
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>Sắp xếp: {s.label}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
            <Row className="g-2 mt-1">
              <Col md={3}>
                <Form.Select value={province} onChange={(e) => setProvince(e.target.value)}>
                  <option value="">Tỉnh / Thành</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={districts.length === 0}
                >
                  <option value="">Quận / Huyện</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">Kinh nghiệm</option>
                  {levels.map((l) => (
                    <option key={l.id} value={l.value}>{l.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select value={jobType} onChange={(e) => setJobType(e.target.value)}>
                  <option value="">Loại hình</option>
                  {jobTypes.map((t) => (
                    <option key={t.id} value={t.value}>{t.label}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button type="submit" className="w-100 btn-primary-gradient">
                  <i className="bi bi-search me-1"></i>Tìm
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner />
          <p className="text-muted mt-3 mb-0">Đang tìm kiếm...</p>
        </div>
      ) : jobs.length === 0 ? (
        <Alert variant="info">Không tìm thấy job phù hợp.</Alert>
      ) : (
        <>
          <p className="text-muted small">Tìm thấy {meta?.total ?? jobs.length} job</p>
          <Row className="g-3">
            {jobs.map((job) => {
              const id = getEntityId(job);
              return (
                <Col md={6} lg={4} key={id}>
                  <Card className="h-100 border-0 shadow-sm card-hover">
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="fw-bold mb-0 pe-2">{job.title}</h6>
                        {job.isUrgent && <Badge bg="danger">Gấp</Badge>}
                      </div>
                      <div className="text-muted small mb-2">
                        <i className="bi bi-building me-1" />{job.companyName}
                      </div>
                      <div className="d-flex flex-column gap-1 small mb-3">
                        <span className="text-success fw-500">
                          <i className="bi bi-cash-coin me-1" />
                          {formatSalary(job.salaryAmount, job.salaryType)}
                        </span>
                        <span>
                          <i className="bi bi-geo-alt me-1" />
                          {job.location}{job.district ? `, ${job.district}` : ''}
                        </span>
                      </div>
                      <div className="d-flex gap-2 flex-wrap mb-3">
                        <Badge bg="light" text="dark">{job.jobType}</Badge>
                        <Badge bg="light" text="dark">{job.industry}</Badge>
                      </div>
                      <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
                        <small className="text-muted">Hết hạn: {formatDate(job.expiresAt)}</small>
                        <Button as={Link as any} to={`/viec-lam/${id}`} size="sm" variant="outline-primary">
                          Chi tiết
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {meta && meta.totalPages > 1 && (
            <Pagination className="justify-content-center mt-4">
              <Pagination.Prev disabled={page <= 1} onClick={() => runSearch(page - 1)} />
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <Pagination.Item key={p} active={p === page} onClick={() => runSearch(p)}>
                  {p}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={page >= meta.totalPages} onClick={() => runSearch(page + 1)} />
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
}
