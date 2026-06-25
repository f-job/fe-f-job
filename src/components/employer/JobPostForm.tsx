import { useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import axios from 'axios';
import searchService from '@services/searchService';
import type {
  CasualJobType,
  CreateEmployerJobPayload,
  ExperienceLevel,
  Industry,
  JobTypeOption,
  LevelOption,
  SalaryType,
} from '@/types/api';

interface Commune {
  id: number;
  name: string;
  code: string;
  provinceId: number;
}

const SALARY_TYPES: { value: SalaryType; label: string }[] = [
  { value: 'hourly', label: 'Theo giờ' },
  { value: 'daily', label: 'Theo ngày/ca' },
  { value: 'fixed', label: 'Trọn gói' },
];

const COMMON_BENEFITS = ['Bao cơm', 'Tips', 'Phụ cấp đi lại', 'Thưởng hoàn thành ca', 'Đào tạo'];

export interface JobPostFormProps {
  initial?: Partial<CreateEmployerJobPayload>;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (payload: CreateEmployerJobPayload) => void;
  onCancel?: () => void;
}

/** Shared create/edit form for employer job postings. */
export function JobPostForm({
  initial,
  submitting = false,
  submitLabel = 'Đăng tin',
  onSubmit,
  onCancel,
}: JobPostFormProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [jobTypes, setJobTypes] = useState<JobTypeOption[]>([]);
  const [loadingCommunes, setLoadingCommunes] = useState(false);

  const [form, setForm] = useState<CreateEmployerJobPayload>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    location: initial?.location ?? 'Đà Nẵng',
    district: initial?.district ?? '',
    salaryType: initial?.salaryType ?? 'hourly',
    salaryAmount: initial?.salaryAmount ?? 30000,
    level: initial?.level ?? ('No Experience' as ExperienceLevel),
    jobType: initial?.jobType ?? ('Part-time' as CasualJobType),
    industry: initial?.industry ?? '',
    workingTimeText: initial?.workingTimeText ?? '',
    slots: initial?.slots ?? 1,
    expiresAt: initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '',
    benefits: initial?.benefits ?? [],
    isUrgent: initial?.isUrgent ?? false,
  });

  useEffect(() => {
    searchService.listIndustries().then((r) => setIndustries(r.data)).catch(() => {});
    searchService.listLevels().then((r) => setLevels(r.data)).catch(() => {});
    searchService.listJobTypes().then((r) => setJobTypes(r.data)).catch(() => {});
    
    // Load communes for Đà Nẵng (province ID: 48)
    setLoadingCommunes(true);
    axios.get('https://production.cas.so/address-kit/2025-07-01/provinces/48/communes')
      .then((response) => {
        console.log('Communes API Response:', response.data);
        
        // Handle different response structures
        let communeData: Commune[] = [];
        
        if (Array.isArray(response.data)) {
          communeData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Check for nested data structure
          if (Array.isArray(response.data.data)) {
            communeData = response.data.data;
          } else if (Array.isArray(response.data.communes)) {
            communeData = response.data.communes;
          }
        }
        
        console.log('Parsed commune data:', communeData);
        setCommunes(communeData);
      })
      .catch((error) => {
        console.error('Failed to load communes:', error);
        console.error('Error details:', error.response?.data);
      })
      .finally(() => {
        setLoadingCommunes(false);
      });
  }, []);

  const set = <K extends keyof CreateEmployerJobPayload>(key: K, value: CreateEmployerJobPayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleBenefit = (b: string) => {
    setForm((prev) => {
      const has = prev.benefits?.includes(b);
      const benefits = has
        ? (prev.benefits ?? []).filter((x) => x !== b)
        : [...(prev.benefits ?? []), b];
      return { ...prev, benefits };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateEmployerJobPayload = {
      ...form,
      location: 'Đà Nẵng', // Force location to Đà Nẵng
      salaryAmount: Number(form.salaryAmount),
      slots: form.slots ? Number(form.slots) : undefined,
      district: form.district || undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      benefits: form.benefits?.length ? form.benefits : undefined,
    };
    onSubmit(payload);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="g-3">
        <Col xs={12}>
          <Form.Label>Tiêu đề tin *</Form.Label>
          <Form.Control
            required
            placeholder="Vd: Phục vụ tiệc cưới cuối tuần"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </Col>

        <Col md={6}>
          <Form.Label>Ngành *</Form.Label>
          <Form.Select
            required
            value={form.industry}
            onChange={(e) => set('industry', e.target.value)}
          >
            <option value="">-- Chọn ngành --</option>
            {industries.map((i) => (
              <option key={i.id} value={i.name}>{i.icon} {i.name}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Label>Loại hình *</Form.Label>
          <Form.Select
            required
            value={form.jobType}
            onChange={(e) => set('jobType', e.target.value as CasualJobType)}
          >
            {jobTypes.length === 0 ? (
              <option value={form.jobType}>{form.jobType}</option>
            ) : (
              jobTypes.map((t) => (
                <option key={t.id} value={t.value}>{t.label}</option>
              ))
            )}
          </Form.Select>
        </Col>

        <Col md={6}>
          <Form.Label>Tỉnh / Thành *</Form.Label>
          <Form.Control
            type="text"
            value="Đà Nẵng"
            disabled
            className="bg-light"
          />
          <Form.Control.Feedback type="invalid">
            Hiện tại chỉ hỗ trợ khu vực Đà Nẵng
          </Form.Control.Feedback>
        </Col>
        <Col md={6}>
          <Form.Label>Xã / Phường *</Form.Label>
          <Form.Select
            required
            value={form.district}
            onChange={(e) => set('district', e.target.value)}
            disabled={loadingCommunes}
          >
            <option value="">-- Chọn xã/phường --</option>
            {communes.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Form.Select>
          {loadingCommunes && <Form.Text className="text-muted d-block">Đang tải...</Form.Text>}
          {!loadingCommunes && communes.length === 0 && (
            <Form.Text className="text-danger d-block">Không thể tải danh sách xã/phường. Vui lòng kiểm tra console.</Form.Text>
          )}
        </Col>

        <Col md={4}>
          <Form.Label>Hình thức lương *</Form.Label>
          <Form.Select
            value={form.salaryType}
            onChange={(e) => set('salaryType', e.target.value as SalaryType)}
          >
            {SALARY_TYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Form.Select>
        </Col>
        <Col md={4}>
          <Form.Label>Mức lương (VND) *</Form.Label>
          <Form.Control
            required
            type="number"
            min={0}
            step={1000}
            value={form.salaryAmount}
            onChange={(e) => set('salaryAmount', Number(e.target.value))}
          />
        </Col>
        <Col md={4}>
          <Form.Label>Số lượng cần</Form.Label>
          <Form.Control
            type="number"
            min={1}
            value={form.slots}
            onChange={(e) => set('slots', Number(e.target.value))}
          />
        </Col>

        <Col md={6}>
          <Form.Label>Yêu cầu kinh nghiệm *</Form.Label>
          <Form.Select
            required
            value={form.level}
            onChange={(e) => set('level', e.target.value as ExperienceLevel)}
          >
            {levels.length === 0 ? (
              <option value={form.level}>{form.level}</option>
            ) : (
              levels.map((l) => (
                <option key={l.id} value={l.value}>{l.label}</option>
              ))
            )}
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Label>Hạn nộp</Form.Label>
          <Form.Control
            type="date"
            value={form.expiresAt}
            onChange={(e) => set('expiresAt', e.target.value)}
          />
        </Col>

        <Col xs={12}>
          <Form.Label>Thời gian làm việc *</Form.Label>
          <Form.Control
            required
            placeholder="Vd: Ca tối 18:00 - 23:00 (T7, CN)"
            value={form.workingTimeText}
            onChange={(e) => set('workingTimeText', e.target.value)}
          />
        </Col>

        <Col xs={12}>
          <Form.Label>Mô tả công việc *</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            required
            placeholder="Mô tả nhiệm vụ, yêu cầu, quyền lợi cụ thể..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Col>

        <Col xs={12}>
          <Form.Label>Quyền lợi</Form.Label>
          <div className="d-flex flex-wrap gap-3">
            {COMMON_BENEFITS.map((b) => (
              <Form.Check
                key={b}
                type="checkbox"
                id={`benefit-${b}`}
                label={b}
                checked={form.benefits?.includes(b) ?? false}
                onChange={() => toggleBenefit(b)}
              />
            ))}
          </div>
        </Col>

        <Col xs={12}>
          <div className="border rounded p-3 bg-light-subtle">
            <Form.Check
              type="switch"
              id="isUrgent"
              checked={form.isUrgent ?? false}
              onChange={(e) => set('isUrgent', e.target.checked)}
              label={
                <span>
                  <i className="bi bi-lightning-charge-fill text-danger me-1" />
                  <strong>Tuyển gấp</strong>
                  <span className="text-muted ms-2 small">
                    Tin sẽ được gắn nhãn "Gấp" và ưu tiên hiển thị (chờ admin duyệt).
                  </span>
                </span>
              }
            />
          </div>
        </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2 mt-4">
        {onCancel && (
          <Button variant="outline-secondary" type="button" onClick={onCancel}>
            Hủy
          </Button>
        )}
        <Button type="submit" className="btn-primary-gradient" disabled={submitting}>
          {submitting ? 'Đang lưu...' : submitLabel}
        </Button>
      </div>
    </Form>
  );
}
