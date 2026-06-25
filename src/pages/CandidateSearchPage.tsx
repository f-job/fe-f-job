import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Pagination,
  Row,
  Spinner,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import searchService from '@services/searchService';
import profileService from '@services/profileService';
import employerCandidateService from '@services/employerCandidateService';
import packageService from '@services/packageService';
import { useAuthStore } from '@stores/authStore';
// TEMPORARY: Comment out UserAvatar to test
// import UserAvatar from '@components/common/UserAvatar';
import type {
  CandidateSearchResult,
  MyProfile,
  PaginationMeta,
  SearchCandidatesQuery,
} from '@/types/api';
import { candidateBio, favoriteCandidateId, skillLabel } from '@/types/api';
import { formatDate, getEntityId, getErrorMessage } from '@utils/format';

const LIMIT = 9;

export default function CandidateSearchPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEmployer = user?.role === 'EMPLOYER';

  // filters
  const [skills, setSkills] = useState('');
  const [province, setProvince] = useState('');
  const [summary, setSummary] = useState('');
  const [openOnly, setOpenOnly] = useState(false);
  const [page, setPage] = useState(1);

  // results
  const [rows, setRows] = useState<CandidateSearchResult[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // preview modal
  const [preview, setPreview] = useState<MyProfile | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // favorites (employer only)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favBusyId, setFavBusyId] = useState<string | null>(null);

  // unlocked profiles (employer only) — maps candidate profile id → contact details
  const [unlockedContacts, setUnlockedContacts] = useState<Record<string, { phone?: string; resumeUrl?: string }>>({});
  const [unlockBusyId, setUnlockBusyId] = useState<string | null>(null);
  const [unlockCost, setUnlockCost] = useState(10);

  const loadCreditConfig = useCallback(async () => {
    if (!isEmployer) return;
    try {
      const { data } = await packageService.creditConfig();
      setUnlockCost(data.unlockCvPoints ?? 10);
    } catch {
      // Keep the backend default visible if the config request is unavailable.
    }
  }, [isEmployer]);

  const loadFavorites = useCallback(async () => {
    if (!isEmployer) return;
    try {
      const { data } = await employerCandidateService.favorites();
      setFavoriteIds(new Set((data ?? []).map(favoriteCandidateId).filter(Boolean)));
    } catch {
      // non-blocking — favorites are a convenience overlay
    }
  }, [isEmployer]);

  const toggleFavorite = async (candidateProfileId: string) => {
    if (!candidateProfileId) return;
    setFavBusyId(candidateProfileId);
    const isFav = favoriteIds.has(candidateProfileId);
    try {
      if (isFav) {
        await employerCandidateService.removeFavorite(candidateProfileId);
        toast.success('Đã bỏ khỏi danh sách yêu thích');
      } else {
        await employerCandidateService.addFavorite(candidateProfileId);
        toast.success('Đã thêm vào danh sách yêu thích');
      }
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(candidateProfileId);
        else next.add(candidateProfileId);
        return next;
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật danh sách yêu thích'));
    } finally {
      setFavBusyId(null);
    }
  };

  const unlockCandidate = async (candidateProfileId: string) => {
    if (!candidateProfileId) return;
    if (!window.confirm(`Mở khóa số điện thoại và CV của ứng viên này sẽ trừ ${unlockCost} credit. Tiếp tục?`)) return;
    setUnlockBusyId(candidateProfileId);
    try {
      const { data } = await employerCandidateService.unlock(candidateProfileId);
      const candidate = (data as { candidate?: { phone?: string; resumeUrl?: string } })?.candidate;
      toast.success('Đã mở khóa liên hệ ứng viên');
      setUnlockedContacts((prev) => ({
        ...prev,
        [candidateProfileId]: {
          phone: candidate?.phone,
          resumeUrl: candidate?.resumeUrl,
        },
      }));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể mở khóa hồ sơ (kiểm tra số dư credit)'));
    } finally {
      setUnlockBusyId(null);
    }
  };

  const downloadCv = async (candidateProfileId: string) => {
    try {
      const { data } = await employerCandidateService.downloadCv(candidateProfileId);
      const url = (data as { url?: string })?.url;
      if (url) {
        window.open(url, '_blank', 'noopener');
      } else {
        toast.error('Ứng viên chưa có CV.');
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải CV (cần mở khóa hồ sơ trước)'));
    }
  };

  const runSearch = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError('');
      const query: SearchCandidatesQuery = {
        skills: skills.trim() || undefined,
        province: province.trim() || undefined,
        summary: summary.trim() || undefined,
        openToWork: openOnly || undefined,
        page: targetPage,
        limit: LIMIT,
      };
      try {
        const { data } = await searchService.searchCandidates(query);
        setRows(data.data);
        setMeta(data.meta);
        setPage(targetPage);
      } catch (err) {
        setError(getErrorMessage(err, 'Tìm kiếm ứng viên thất bại'));
      } finally {
        setLoading(false);
      }
    },
    [skills, province, summary, openOnly],
  );

  useEffect(() => {
    runSearch(1);
    loadFavorites();
    loadCreditConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(1);
  };

  const openPreview = async (row: CandidateSearchResult) => {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const { data } = await profileService.preview(row.userId);
      setPreview(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải hồ sơ ứng viên'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleContact = async (candidateUserId: string) => {
    if (!isEmployer) {
      toast.error('Chỉ nhà tuyển dụng mới có thể nhắn tin cho ứng viên.');
      return;
    }
    setStartingChat(true);
    try {
      // Resolve/create the conversation lazily on the Messages page via deep link.
      navigate(`/tin-nhan?to=${candidateUserId}`);
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="h3 fw-bold mb-1">Tìm ứng viên</h1>
      <p className="text-muted">Lọc ứng viên theo kỹ năng, khu vực và trạng thái tìm việc.</p>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Control
                  placeholder="Kỹ năng (cách nhau bởi dấu phẩy)"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Khu vực (vd: Đà Nẵng)"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  placeholder="Từ khóa giới thiệu"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </Col>
              <Col md={2}>
                <Button type="submit" className="w-100 btn-primary-gradient">
                  <i className="bi bi-search me-1"></i>Tìm
                </Button>
              </Col>
            </Row>
            <Row className="mt-2">
              <Col>
                <Form.Check
                  type="switch"
                  id="open-only"
                  label="Chỉ ứng viên đang tìm việc"
                  checked={openOnly}
                  onChange={(e) => setOpenOnly(e.target.checked)}
                />
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
      ) : rows.length === 0 ? (
        <Alert variant="info">Không tìm thấy ứng viên phù hợp.</Alert>
      ) : (
        <>
          <p className="text-muted small">Tìm thấy {meta?.total ?? rows.length} ứng viên</p>
          <Row className="g-3">
            {rows.map((c) => (
              <Col md={6} lg={4} key={getEntityId(c)}>
                <Card className="h-100 border-0 shadow-sm card-hover">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <img
                        src={c.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.fullName) + '&background=random'}
                        alt={c.fullName}
                        className="rounded-circle"
                        width={56}
                        height={56}
                        style={{ objectFit: 'cover' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.fullName) + '&background=random';
                        }}
                      />
                      <div>
                        <h6 className="fw-bold mb-0">{c.fullName}</h6>
                        {c.openToWork ? (
                          <Badge bg="success">Đang tìm việc</Badge>
                        ) : (
                          <Badge bg="secondary">Không tìm việc</Badge>
                        )}
                      </div>
                    </div>
                    {c.address && (
                      <div className="text-muted small mb-2">
                        <i className="bi bi-geo-alt me-1" />{c.address}
                      </div>
                    )}
                    {(() => {
                      const bio = candidateBio(c);
                      return bio ? <p className="small text-truncate-2 mb-2">{bio}</p> : null;
                    })()}
                    <div className="d-flex gap-1 flex-wrap mb-3">
                      {c.skills.slice(0, 4).map((s, i) => (
                        <Badge bg="light" text="dark" key={`${getEntityId(c)}-skill-${i}`}>
                          {skillLabel(s)}
                        </Badge>
                      ))}
                      {c.skills.length > 4 && (
                        <Badge bg="light" text="dark">+{c.skills.length - 4}</Badge>
                      )}
                    </div>
                    <div className="mt-auto d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="flex-grow-1"
                        onClick={() => openPreview(c)}
                      >
                        <i className="bi bi-eye me-1" />Xem hồ sơ
                      </Button>
                      {isEmployer && (
                        <Button
                          size="sm"
                          variant={favoriteIds.has(getEntityId(c)) ? 'danger' : 'outline-danger'}
                          disabled={favBusyId === getEntityId(c)}
                          title={favoriteIds.has(getEntityId(c)) ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                          onClick={() => toggleFavorite(getEntityId(c))}
                        >
                          <i className={`bi ${favoriteIds.has(getEntityId(c)) ? 'bi-heart-fill' : 'bi-heart'}`} />
                        </Button>
                      )}
                      {isEmployer && (
                        <Button
                          size="sm"
                          className="btn-primary-gradient flex-grow-1"
                          disabled={startingChat}
                          onClick={() => handleContact(c.userId)}
                        >
                          <i className="bi bi-chat-dots me-1" />Nhắn tin
                        </Button>
                      )}
                    </div>
                    {isEmployer && (
                      <div className="d-flex gap-2 mt-2">
                        {unlockedContacts[getEntityId(c)] ? (
                          <>
                            {unlockedContacts[getEntityId(c)].phone ? (
                              <Button
                                as="a"
                                href={`tel:${unlockedContacts[getEntityId(c)].phone}`}
                                size="sm"
                                variant="outline-success"
                                className="flex-grow-1"
                              >
                                <i className="bi bi-telephone me-1" />
                                {unlockedContacts[getEntityId(c)].phone}
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline-secondary" className="flex-grow-1" disabled>
                                Chưa có SĐT
                              </Button>
                            )}
                            {unlockedContacts[getEntityId(c)].resumeUrl && (
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => downloadCv(getEntityId(c))}
                              >
                                <i className="bi bi-file-earmark-arrow-down me-1" />CV
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-warning"
                            className="flex-grow-1"
                            disabled={unlockBusyId === getEntityId(c)}
                            onClick={() => unlockCandidate(getEntityId(c))}
                          >
                            {unlockBusyId === getEntityId(c) ? (
                              <Spinner size="sm" />
                            ) : (
                              <>
                                <i className="bi bi-unlock me-1" />Mở khóa liên hệ ({unlockCost} credit)
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
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

      {/* Profile preview modal */}
      <Modal show={previewLoading || !!preview} onHide={() => setPreview(null)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="h6">Hồ sơ ứng viên</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewLoading ? (
            <div className="text-center py-4">
              <Spinner />
            </div>
          ) : preview ? (
            <>
              <div className="d-flex align-items-center gap-3 mb-3">
                <img
                  src={preview.avatarUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(preview.fullName) + '&background=random'}
                  alt={preview.fullName}
                  className="rounded-circle"
                  width={72}
                  height={72}
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(preview.fullName) + '&background=random';
                  }}
                />
                <div>
                  <h5 className="fw-bold mb-0">{preview.fullName}</h5>
                  <div className="text-muted small">
                    {[preview.location, preview.district].filter(Boolean).join(', ') || preview.address}
                  </div>
                  {preview.openToWork && <Badge bg="success">Đang tìm việc</Badge>}
                </div>
              </div>

              {preview.summary && (
                <>
                  <h6 className="fw-bold">Giới thiệu</h6>
                  <p className="small">{preview.summary}</p>
                </>
              )}

              {preview.skills?.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3">Kỹ năng</h6>
                  <div className="d-flex gap-2 flex-wrap mb-2">
                    {preview.skills.map((s) => (
                      <Badge bg="light" text="dark" key={getEntityId(s)}>
                        {s.name} <span className="text-warning">{'★'.repeat(s.rating)}</span>
                      </Badge>
                    ))}
                  </div>
                </>
              )}

              {preview.experiences?.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3">Kinh nghiệm</h6>
                  {preview.experiences.map((exp) => (
                    <div key={getEntityId(exp)} className="border-start border-3 border-primary ps-3 mb-2">
                      <strong>{exp.role}</strong>
                      <div className="text-muted small">{exp.companyName}</div>
                      <div className="text-muted small">
                        {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Hiện tại'}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {preview.educations?.length > 0 && (
                <>
                  <h6 className="fw-bold mt-3">Học vấn</h6>
                  {preview.educations.map((edu) => (
                    <div key={getEntityId(edu)} className="border-start border-3 border-info ps-3 mb-2">
                      <strong>{edu.school}</strong>
                      <div className="text-muted small">
                        {[edu.degree, edu.major].filter(Boolean).join(' · ')} — {edu.duration}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          {preview && isEmployer && (
            <Button
              className="btn-primary-gradient"
              disabled={startingChat}
              onClick={() => handleContact(preview.userId)}
            >
              <i className="bi bi-chat-dots me-1" />Nhắn tin với ứng viên
            </Button>
          )}
          <Button variant="secondary" onClick={() => setPreview(null)}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
