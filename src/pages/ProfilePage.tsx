import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import profileService from '@services/profileService';
import verificationService from '@services/verificationService';
import ReviewsList from '@components/common/ReviewsList';
import TrustScoreCard from '@components/common/TrustScoreCard';
import UserAvatar from '@components/common/UserAvatar';
import { VerificationModal } from '@components/common/VerificationModal';
import { useAuthStore } from '@stores/authStore';
import type {
  AddSkillPayload,
  CreateEducationPayload,
  CreateExperiencePayload,
  MyProfile,
} from '@/types/api';
import { formatDate, getEntityId, getErrorMessage } from '@utils/format';

type ExperienceForm = CreateExperiencePayload;
type EducationForm = CreateEducationPayload;

const emptyExperience: ExperienceForm = {
  role: '',
  companyName: '',
  startDate: '',
  endDate: '',
  location: '',
  description: '',
};

const emptyEducation: EducationForm = {
  school: '',
  major: '',
  duration: '',
  degree: '',
};

const VIETNAM_PHONE_RE = /^(\+84|0)[3-9]\d{8}$/;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Verification
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [loadingVerification, setLoadingVerification] = useState(false);

  // General info form
  const [info, setInfo] = useState({
    fullName: '',
    phone: '',
    address: '',
    summary: '',
    location: '',
    district: '',
  });

  // Skill form
  const [skill, setSkill] = useState<AddSkillPayload>({ name: '', rating: 3 });

  // Experience modal
  const [showExp, setShowExp] = useState(false);
  const [expForm, setExpForm] = useState<ExperienceForm>(emptyExperience);

  // Education modal
  const [showEdu, setShowEdu] = useState(false);
  const [eduForm, setEduForm] = useState<EducationForm>(emptyEducation);

  const avatarInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);

  const applyProfile = useCallback((p: MyProfile) => {
    setProfile(p);
    setInfo({
      fullName: p.fullName ?? '',
      phone: p.phone ?? '',
      address: p.address ?? '',
      summary: p.summary ?? '',
      location: p.location ?? '',
      district: p.district ?? '',
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await profileService.getMine();
      applyProfile(data);
      
      // Load verification status
      loadVerificationStatus();
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải hồ sơ'));
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  const loadVerificationStatus = async () => {
    setLoadingVerification(true);
    try {
      const { data } = await verificationService.getStatus();
      setVerificationStatus(data);
    } catch (err) {
      // Ignore error - user may not be verified yet
      console.log('Verification status:', err);
    } finally {
      setLoadingVerification(false);
    }
  };

  const handleVerificationSuccess = () => {
    loadVerificationStatus();
    toast.success('Xác thực danh tính thành công!');
  };

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = info.phone.trim();
    if (!phone) {
      toast.error('Số điện thoại không được để trống');
      return;
    }
    if (!VIETNAM_PHONE_RE.test(phone)) {
      toast.error('Số điện thoại không hợp lệ');
      return;
    }
    setSavingInfo(true);
    try {
      const { data } = await profileService.update({ ...info, phone });
      applyProfile(data);
      toast.success('Đã lưu hồ sơ');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lưu hồ sơ thất bại'));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleToggleOpenToWork = async () => {
    if (!profile) return;
    try {
      const { data } = await profileService.setOpenToWork(!profile.openToWork);
      applyProfile(data);
      toast.success(data.openToWork ? 'Đang bật tìm việc' : 'Đã tắt tìm việc');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'));
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill.name.trim()) return;
    try {
      const { data } = await profileService.addSkill(skill);
      applyProfile(data);
      setSkill({ name: '', rating: 3 });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm kỹ năng'));
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      const { data } = await profileService.deleteSkill(id);
      applyProfile(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa kỹ năng'));
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await profileService.addExperience(expForm);
      applyProfile(data);
      setShowExp(false);
      setExpForm(emptyExperience);
      toast.success('Đã thêm kinh nghiệm');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm kinh nghiệm'));
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const { data } = await profileService.deleteExperience(id);
      applyProfile(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa'));
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await profileService.addEducation(eduForm);
      applyProfile(data);
      setShowEdu(false);
      setEduForm(emptyEducation);
      toast.success('Đã thêm học vấn');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể thêm học vấn'));
    }
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const { data } = await profileService.deleteEducation(id);
      applyProfile(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa'));
    }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await profileService.uploadAvatar(file);
      applyProfile(data);
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tải ảnh thất bại'));
    }
  };

  const handleUploadCv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await profileService.uploadCv(file);
      applyProfile(data);
      toast.success('Đã tải CV lên');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tải CV thất bại'));
    }
  };

  const handleDeleteCv = async (id: string) => {
    try {
      const { data } = await profileService.deleteCv(id);
      applyProfile(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa CV'));
    }
  };

  const handlePrimaryCv = async (id: string) => {
    try {
      const { data } = await profileService.setPrimaryCv(id);
      applyProfile(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể đặt CV chính'));
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner />
        <p className="text-muted mt-3">Đang tải hồ sơ...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="g-4">
        {/* ─── Sidebar: avatar + open to work + CV ─── */}
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="text-center">
              <div className="position-relative d-inline-block mb-3">
                <UserAvatar
                  src={profile?.avatarUrl}
                  alt={profile?.fullName || 'Avatar'}
                  size={120}
                />
                <Button
                  size="sm"
                  variant="light"
                  className="position-absolute bottom-0 end-0 rounded-circle border shadow-sm"
                  onClick={() => avatarInput.current?.click()}
                >
                  <i className="bi bi-camera"></i>
                </Button>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatar}
                />
              </div>
              <h5 className="fw-bold mb-0">{profile?.fullName || user?.name}</h5>
              <p className="text-muted small">{user?.email}</p>

              {/* Verification Badge/Button */}
              <div className="mb-3">
                {loadingVerification ? (
                  <Spinner size="sm" />
                ) : verificationStatus?.isVerified ? (
                  <div className="p-3 bg-success bg-opacity-10 border border-success rounded">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                      <i className="bi bi-shield-check-fill text-success fs-4" />
                      <span className="fw-bold text-success">Đã xác thực danh tính</span>
                    </div>
                    <div className="small text-muted text-center">
                      <div>
                        <i className="bi bi-person-check me-1" />
                        {verificationStatus.fullName}
                      </div>
                      {verificationStatus.verifiedAt && (
                        <div className="mt-1">
                          <i className="bi bi-calendar-check me-1" />
                          {new Date(verificationStatus.verifiedAt).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                      {verificationStatus.verificationMethod && (
                        <div className="mt-1">
                          <Badge bg="success" className="mt-1">
                            {verificationStatus.verificationMethod === 'cccd_qr' && 'CCCD QR'}
                            {verificationStatus.verificationMethod === 'cccd_ocr' && 'CCCD OCR'}
                            {verificationStatus.verificationMethod === 'manual' && 'Thủ công'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-warning bg-opacity-10 border border-warning rounded">
                    <div className="text-center mb-2">
                      <i className="bi bi-shield-exclamation text-warning fs-4" />
                      <div className="small text-muted mt-1">Chưa xác thực danh tính</div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowVerificationModal(true)}
                      className="w-100"
                    >
                      <i className="bi bi-shield-check me-2" />
                      Xác thực ngay
                    </Button>
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
                <Form.Check
                  type="switch"
                  id="open-to-work"
                  checked={profile?.openToWork ?? false}
                  onChange={handleToggleOpenToWork}
                />
                <span className="fw-500">
                  {profile?.openToWork ? (
                    <Badge bg="success">Đang tìm việc</Badge>
                  ) : (
                    <Badge bg="secondary">Tắt tìm việc</Badge>
                  )}
                </span>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">CV của tôi</h6>
                <Button size="sm" variant="outline-primary" onClick={() => cvInput.current?.click()}>
                  <i className="bi bi-upload me-1"></i>Tải lên
                </Button>
                <input
                  ref={cvInput}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  hidden
                  onChange={handleUploadCv}
                />
              </div>
              {(profile?.files?.length ?? 0) === 0 ? (
                <p className="text-muted small mb-0">Chưa có CV nào. Tải lên tối đa 3 file (PDF/DOC).</p>
              ) : (
                profile!.files.map((f) => (
                  <div
                    key={getEntityId(f)}
                    className="d-flex align-items-center justify-content-between border rounded p-2 mb-2"
                  >
                    <div className="text-truncate">
                      <i className="bi bi-file-earmark-text me-2 text-danger"></i>
                      <a
                        href={profileService.cvDownloadUrl(getEntityId(f))}
                        target="_blank"
                        rel="noreferrer"
                        className="text-decoration-none small"
                      >
                        {f.fileName}
                      </a>
                      {f.isPrimary && <Badge bg="success" className="ms-2">Chính</Badge>}
                    </div>
                    <div className="d-flex gap-1">
                      {!f.isPrimary && (
                        <Button
                          size="sm"
                          variant="link"
                          className="p-0 text-primary"
                          title="Đặt làm CV chính"
                          onClick={() => handlePrimaryCv(getEntityId(f))}
                        >
                          <i className="bi bi-star"></i>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0 text-danger"
                        onClick={() => handleDeleteCv(getEntityId(f))}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Trust score / verified badge */}
          {user?.id && <TrustScoreCard userId={user.id} />}
        </Col>

        {/* ─── Main column ─── */}
        <Col lg={8}>
          {/* General info */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h6 className="fw-bold mb-3">Thông tin cá nhân</h6>
              <Form onSubmit={handleSaveInfo}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label>Họ và tên</Form.Label>
                    <Form.Control
                      value={info.fullName}
                      onChange={(e) => setInfo({ ...info, fullName: e.target.value })}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Số điện thoại</Form.Label>
                    <Form.Control
                      required
                      value={info.phone}
                      onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                      isInvalid={!info.phone.trim()}
                      placeholder="0912345678"
                    />
                    <Form.Control.Feedback type="invalid">
                      Số điện thoại không được để trống
                    </Form.Control.Feedback>
                  </Col>
                  <Col md={6}>
                    <Form.Label>Tỉnh / Thành phố</Form.Label>
                    <Form.Control
                      value={info.location}
                      onChange={(e) => setInfo({ ...info, location: e.target.value })}
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Label>Quận / Huyện</Form.Label>
                    <Form.Control
                      value={info.district}
                      onChange={(e) => setInfo({ ...info, district: e.target.value })}
                    />
                  </Col>
                  <Col xs={12}>
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      value={info.address}
                      onChange={(e) => setInfo({ ...info, address: e.target.value })}
                    />
                  </Col>
                  <Col xs={12}>
                    <Form.Label>Giới thiệu bản thân</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={info.summary}
                      onChange={(e) => setInfo({ ...info, summary: e.target.value })}
                      placeholder="Vd: Sinh viên năm 3, có kinh nghiệm phục vụ sự kiện, PG/PB..."
                    />
                  </Col>
                </Row>
                <div className="text-end mt-3">
                  <Button type="submit" disabled={savingInfo} className="btn-primary-gradient">
                    {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Skills */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h6 className="fw-bold mb-3">Kỹ năng</h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                {(profile?.skills?.length ?? 0) === 0 ? (
                  <span className="text-muted small">Chưa có kỹ năng nào.</span>
                ) : (
                  profile!.skills.map((s) => (
                    <Badge
                      key={getEntityId(s)}
                      bg="light"
                      text="dark"
                      className="border d-flex align-items-center gap-2 py-2 px-3"
                    >
                      {s.name}
                      <span className="text-warning">{'★'.repeat(s.rating)}</span>
                      <i
                        className="bi bi-x-circle text-muted"
                        role="button"
                        onClick={() => handleDeleteSkill(getEntityId(s))}
                      ></i>
                    </Badge>
                  ))
                )}
              </div>
              <Form onSubmit={handleAddSkill} className="d-flex gap-2 align-items-end flex-wrap">
                <div className="flex-grow-1" style={{ minWidth: 180 }}>
                  <Form.Label className="small">Tên kỹ năng</Form.Label>
                  <Form.Control
                    size="sm"
                    value={skill.name}
                    onChange={(e) => setSkill({ ...skill, name: e.target.value })}
                    placeholder="Vd: Pha chế"
                  />
                </div>
                <div style={{ width: 120 }}>
                  <Form.Label className="small">Mức (1-5)</Form.Label>
                  <Form.Select
                    size="sm"
                    value={skill.rating}
                    onChange={(e) => setSkill({ ...skill, rating: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </Form.Select>
                </div>
                <Button type="submit" size="sm" variant="outline-primary">
                  <i className="bi bi-plus-lg"></i> Thêm
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Experience */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Kinh nghiệm làm việc</h6>
                <Button size="sm" variant="outline-primary" onClick={() => setShowExp(true)}>
                  <i className="bi bi-plus-lg me-1"></i>Thêm
                </Button>
              </div>
              {(profile?.experiences?.length ?? 0) === 0 ? (
                <p className="text-muted small mb-0">Chưa có kinh nghiệm nào.</p>
              ) : (
                profile!.experiences.map((exp) => (
                  <div key={getEntityId(exp)} className="border-start border-3 border-primary ps-3 mb-3">
                    <div className="d-flex justify-content-between">
                      <strong>{exp.role}</strong>
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0 text-danger"
                        onClick={() => handleDeleteExperience(getEntityId(exp))}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                    <div className="text-muted small">{exp.companyName}</div>
                    <div className="text-muted small">
                      {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Hiện tại'}
                    </div>
                    {exp.description && <div className="small mt-1">{exp.description}</div>}
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Education */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0">Học vấn</h6>
                <Button size="sm" variant="outline-primary" onClick={() => setShowEdu(true)}>
                  <i className="bi bi-plus-lg me-1"></i>Thêm
                </Button>
              </div>
              {(profile?.educations?.length ?? 0) === 0 ? (
                <p className="text-muted small mb-0">Chưa có thông tin học vấn.</p>
              ) : (
                profile!.educations.map((edu) => (
                  <div key={getEntityId(edu)} className="border-start border-3 border-info ps-3 mb-3">
                    <div className="d-flex justify-content-between">
                      <strong>{edu.school}</strong>
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0 text-danger"
                        onClick={() => handleDeleteEducation(getEntityId(edu))}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                    <div className="text-muted small">
                      {[edu.degree, edu.major].filter(Boolean).join(' · ')}
                    </div>
                    <div className="text-muted small">{edu.duration}</div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Reviews received */}
          {user?.id && (
            <div className="mt-4">
              <ReviewsList revieweeId={user.id} />
            </div>
          )}
        </Col>
      </Row>

      {/* Experience modal */}
      <Modal show={showExp} onHide={() => setShowExp(false)} centered>
        <Form onSubmit={handleAddExperience}>
          <Modal.Header closeButton>
            <Modal.Title className="h6">Thêm kinh nghiệm</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Vị trí *</Form.Label>
              <Form.Control
                required
                value={expForm.role}
                onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nơi làm việc *</Form.Label>
              <Form.Control
                required
                value={expForm.companyName}
                onChange={(e) => setExpForm({ ...expForm, companyName: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Từ ngày *</Form.Label>
                  <Form.Control
                    type="date"
                    required
                    value={expForm.startDate}
                    onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Đến ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={expForm.endDate}
                    onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group>
              <Form.Label>Mô tả công việc</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={expForm.description}
                onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowExp(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Education modal */}
      <Modal show={showEdu} onHide={() => setShowEdu(false)} centered>
        <Form onSubmit={handleAddEducation}>
          <Modal.Header closeButton>
            <Modal.Title className="h6">Thêm học vấn</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Trường *</Form.Label>
              <Form.Control
                required
                value={eduForm.school}
                onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Chuyên ngành</Form.Label>
              <Form.Control
                value={eduForm.major}
                onChange={(e) => setEduForm({ ...eduForm, major: e.target.value })}
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Thời gian *</Form.Label>
                  <Form.Control
                    required
                    placeholder="Vd: 2022 - 2026"
                    value={eduForm.duration}
                    onChange={(e) => setEduForm({ ...eduForm, duration: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label>Bằng cấp</Form.Label>
                  <Form.Control
                    placeholder="Vd: Cử nhân"
                    value={eduForm.degree}
                    onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdu(false)}>Hủy</Button>
            <Button type="submit" variant="primary">Lưu</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Verification Modal */}
      <VerificationModal
        show={showVerificationModal}
        onHide={() => setShowVerificationModal(false)}
        onSuccess={handleVerificationSuccess}
      />
    </Container>
  );
}
