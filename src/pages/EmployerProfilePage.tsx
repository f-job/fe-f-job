import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import employerService from '@services/employerService';
import { useAuthStore } from '@stores/authStore';
import type { EmployerPopulatedUser, EmployerProfile, UpdateEmployerPayload } from '@/types/api';
import {
  employerStatusLabel,
  employerStatusVariant,
  formatDateTime,
  getEntityId,
  getErrorMessage,
} from '@utils/format';

function profileUser(profile: EmployerProfile): EmployerPopulatedUser | null {
  return typeof profile.userId === 'object' ? profile.userId : null;
}

function profileMatchesUser(profile: EmployerProfile, userId?: string, email?: string) {
  const linkedUser = profileUser(profile);
  if (typeof profile.userId === 'string' && userId) return profile.userId === userId;
  if (linkedUser?._id && userId && linkedUser._id === userId) return true;
  if (linkedUser?.id && userId && linkedUser.id === userId) return true;
  return Boolean(linkedUser?.email && email && linkedUser.email === email);
}

function detail(value?: string) {
  return value?.trim() || '—';
}

const emptyForm: Required<UpdateEmployerPayload> = {
  companyName: '',
  companyDescription: '',
  website: '',
  industry: '',
  companySize: '',
  address: '',
  city: '',
  country: '',
  logoUrl: '',
  bannerUrl: '',
};

function formFromProfile(profile: EmployerProfile): Required<UpdateEmployerPayload> {
  return {
    companyName: profile.companyName ?? '',
    companyDescription: profile.companyDescription ?? '',
    website: profile.website ?? '',
    industry: profile.industry ?? '',
    companySize: profile.companySize ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    country: profile.country ?? '',
    logoUrl: profile.logoUrl ?? '',
    bannerUrl: profile.bannerUrl ?? '',
  };
}

function cleanPayload(form: Required<UpdateEmployerPayload>): UpdateEmployerPayload {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value.trim() || undefined]),
  ) as UpdateEmployerPayload;
}

export default function EmployerProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Required<UpdateEmployerPayload>>(emptyForm);

  const email = useMemo(() => profile ? profileUser(profile)?.email ?? user?.email : user?.email, [profile, user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await employerService.list();
      const mine = (data ?? []).find((item) => profileMatchesUser(item, user?.id, user?.email));
      if (!mine) {
        setProfile(null);
        setError('Chưa tìm thấy hồ sơ nhà tuyển dụng liên kết với tài khoản này.');
        return;
      }
      setProfile(mine);
      setForm(formFromProfile(mine));
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải hồ sơ nhà tuyển dụng'));
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = () => {
    if (!profile) return;
    setForm(formFromProfile(profile));
    setEditing(true);
  };

  const updateField = (field: keyof UpdateEmployerPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;
    if (!form.companyName.trim()) {
      toast.error('Tên công ty không được để trống.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await employerService.update(getEntityId(profile), cleanPayload(form));
      setProfile(data);
      setForm(formFromProfile(data));
      setEditing(false);
      toast.success('Đã cập nhật hồ sơ công ty');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật hồ sơ'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner />
        <p className="text-muted mt-3 mb-0">Đang tải hồ sơ...</p>
      </div>
    );
  }

  return (
    <Container className="py-2">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 fw-bold mb-1">Hồ sơ nhà tuyển dụng</h1>
          <p className="text-muted mb-0">Thông tin công ty đang hiển thị trong hệ thống F-Job.</p>
        </div>
        <div className="d-flex gap-2">
          {profile && (
            <Button onClick={openEdit}>
              <i className="bi bi-pencil-square me-1" />Chỉnh sửa
            </Button>
          )}
          <Button variant="outline-secondary" onClick={load}>
            <i className="bi bi-arrow-clockwise me-1" />Tải lại
          </Button>
        </div>
      </div>

      {error && <Alert variant={profile ? 'warning' : 'danger'}>{error}</Alert>}

      {profile && (
        <>
          <Card className="border-0 shadow-sm overflow-hidden mb-3">
            {profile.bannerUrl ? (
              <div style={{ height: 180, overflow: 'hidden' }}>
                <Image src={profile.bannerUrl} alt={profile.companyName} className="w-100 h-100" style={{ objectFit: 'cover' }} />
              </div>
            ) : (
              <div className="bg-primary bg-opacity-10" style={{ height: 120 }} />
            )}
            <Card.Body>
              <div className="d-flex align-items-start gap-3">
                {profile.logoUrl ? (
                  <Image
                    src={profile.logoUrl}
                    alt={profile.companyName}
                    rounded
                    width={88}
                    height={88}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded bg-light border d-flex align-items-center justify-content-center text-primary"
                    style={{ width: 88, height: 88 }}
                  >
                    <i className="bi bi-building fs-1" />
                  </div>
                )}
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h2 className="h4 fw-bold mb-0">{profile.companyName}</h2>
                    <Badge bg={employerStatusVariant(profile.status)}>
                      {employerStatusLabel(profile.status)}
                    </Badge>
                  </div>
                  <div className="text-muted mt-1">
                    {[profile.industry, profile.companySize].filter(Boolean).join(' · ') || 'Chưa cập nhật ngành nghề'}
                  </div>
                  {profile.companyDescription && (
                    <p className="mt-3 mb-0">{profile.companyDescription}</p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>

          <Row className="g-3">
            <Col lg={7}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h3 className="h5 fw-bold mb-3">Thông tin công ty</h3>
                  <dl className="row mb-0">
                    <dt className="col-sm-4">Email tài khoản</dt>
                    <dd className="col-sm-8">{detail(email)}</dd>
                    <dt className="col-sm-4">Email liên hệ</dt>
                    <dd className="col-sm-8">{detail(profile.contactEmail)}</dd>
                    <dt className="col-sm-4">Số điện thoại</dt>
                    <dd className="col-sm-8">{detail(profile.contactPhone)}</dd>
                    <dt className="col-sm-4">Website</dt>
                    <dd className="col-sm-8 text-break">
                      {profile.website ? (
                        <a href={profile.website} target="_blank" rel="noreferrer">
                          {profile.website}
                        </a>
                      ) : '—'}
                    </dd>
                    <dt className="col-sm-4">Địa chỉ</dt>
                    <dd className="col-sm-8">{detail(profile.address)}</dd>
                    <dt className="col-sm-4">Khu vực</dt>
                    <dd className="col-sm-8">
                      {[profile.city, profile.country].filter(Boolean).join(', ') || '—'}
                    </dd>
                  </dl>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={5}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <h3 className="h5 fw-bold mb-3">Trạng thái hồ sơ</h3>
                  <dl className="mb-0">
                    <dt>Mã hồ sơ</dt>
                    <dd className="text-break">{getEntityId(profile)}</dd>
                    <dt>Ngày xác minh</dt>
                    <dd>{formatDateTime(profile.verifiedAt)}</dd>
                    {profile.rejectedReason && (
                      <>
                        <dt>Lý do từ chối</dt>
                        <dd>{profile.rejectedReason}</dd>
                      </>
                    )}
                    {profile.blockedReason && (
                      <>
                        <dt>Lý do khóa</dt>
                        <dd>{profile.blockedReason}</dd>
                      </>
                    )}
                    <dt>Cập nhật gần nhất</dt>
                    <dd>{formatDateTime(profile.updatedAt)}</dd>
                  </dl>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {profile.galleryImages?.length ? (
            <Card className="border-0 shadow-sm mt-3">
              <Card.Body>
                <h3 className="h5 fw-bold mb-3">Hình ảnh công ty</h3>
                <Row className="g-2">
                  {profile.galleryImages.map((url) => (
                    <Col sm={6} lg={4} key={url}>
                      <Image src={url} alt={profile.companyName} rounded className="w-100" style={{ aspectRatio: '4 / 3', objectFit: 'cover' }} />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ) : null}
        </>
      )}

      {!profile && (
        <Button as={Link as any} to="/nha-tuyen-dung/tin-dang" variant="outline-primary">
          Quay lại khu vực nhà tuyển dụng
        </Button>
      )}

      <Modal show={editing} onHide={() => setEditing(false)} centered size="lg">
        <Form onSubmit={saveProfile}>
          <Modal.Header closeButton>
            <Modal.Title className="h5">Chỉnh sửa hồ sơ công ty</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tên công ty</Form.Label>
                  <Form.Control
                    value={form.companyName}
                    onChange={(e) => updateField('companyName', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Website</Form.Label>
                  <Form.Control
                    type="url"
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Ngành nghề</Form.Label>
                  <Form.Control
                    value={form.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Quy mô</Form.Label>
                  <Form.Control
                    value={form.companySize}
                    onChange={(e) => updateField('companySize', e.target.value)}
                    placeholder="VD: 50-100 nhân sự"
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Mô tả công ty</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={form.companyDescription}
                    onChange={(e) => updateField('companyDescription', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Địa chỉ</Form.Label>
                  <Form.Control
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Thành phố</Form.Label>
                  <Form.Control
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Quốc gia</Form.Label>
                  <Form.Control
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Logo URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => updateField('logoUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Banner URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={form.bannerUrl}
                    onChange={(e) => updateField('bannerUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditing(false)} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Spinner size="sm" /> : 'Lưu thay đổi'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
