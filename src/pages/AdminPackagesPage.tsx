import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import toast from 'react-hot-toast';
import packageService from '@services/packageService';
import type {
  CreditConfig,
  CreditTransaction,
  ServicePackage,
  UpdateCreditConfigPayload,
} from '@/types/api';
import { formatDateTime, formatVnd, getEntityId, getErrorMessage } from '@utils/format';

const DEFAULT_CONFIG: CreditConfig = {
  unlockCvPoints: 10,
  buyCvPoints: 15,
  pinJobPoints: 30,
  urgentJobPoints: 15,
  refreshJobPoints: 5,
  type: 'default',
};

const TX_LABEL: Record<string, string> = {
  PURCHASE: 'Mua gói',
  JOB_BOOST: 'Đẩy tin',
  PROFILE_UNLOCK: 'Mở khóa CV',
  REFUND: 'Hoàn credit',
  ADMIN_ADJUST: 'Điều chỉnh',
};

type PackageForm = {
  id?: string;
  name: string;
  description: string;
  price: string;
  credits: string;
  durationDays: string;
  isActive: boolean;
};

const emptyPackageForm: PackageForm = {
  name: '',
  description: '',
  price: '',
  credits: '',
  durationDays: '30',
  isActive: true,
};

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [config, setConfig] = useState<CreditConfig>(DEFAULT_CONFIG);
  const [ledger, setLedger] = useState<CreditTransaction[]>([]);
  const [form, setForm] = useState<PackageForm>(emptyPackageForm);
  const [loading, setLoading] = useState(true);
  const [savingPackage, setSavingPackage] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pkgs, cfg, tx] = await Promise.all([
        packageService.adminListAll(),
        packageService.adminGetCreditConfig(),
        packageService.adminCreditLedger(1, 20),
      ]);
      setPackages(pkgs.data ?? []);
      setConfig({ ...DEFAULT_CONFIG, ...(cfg.data ?? {}) });
      setLedger(tx.data?.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải dữ liệu credit'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const packagePayload = useMemo(
    () => ({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: Number(form.price),
      credits: Number(form.credits),
      durationDays: Number(form.durationDays || 30),
      isActive: form.isActive,
    }),
    [form],
  );

  const editPackage = (pkg: ServicePackage) => {
    setForm({
      id: getEntityId(pkg),
      name: pkg.name,
      description: pkg.description ?? '',
      price: String(pkg.price),
      credits: String(pkg.credits),
      durationDays: String(pkg.durationDays ?? 30),
      isActive: pkg.isActive,
    });
  };

  const resetForm = () => setForm(emptyPackageForm);

  const savePackage = async (event: FormEvent) => {
    event.preventDefault();
    if (!packagePayload.name || packagePayload.price < 0 || packagePayload.credits < 1) {
      toast.error('Vui lòng nhập đúng tên, giá và số credit.');
      return;
    }

    setSavingPackage(true);
    try {
      if (form.id) {
        await packageService.adminUpdate(form.id, packagePayload);
        toast.success('Đã cập nhật gói');
      } else {
        await packageService.adminCreate({
          name: packagePayload.name,
          description: packagePayload.description,
          price: packagePayload.price,
          credits: packagePayload.credits,
          durationDays: packagePayload.durationDays,
        });
        toast.success('Đã tạo gói');
      }
      resetForm();
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể lưu gói'));
    } finally {
      setSavingPackage(false);
    }
  };

  const deactivatePackage = async (pkg: ServicePackage) => {
    if (!window.confirm(`Vô hiệu hóa gói "${pkg.name}"?`)) return;
    try {
      await packageService.adminRemove(getEntityId(pkg));
      toast.success('Đã vô hiệu hóa gói');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể vô hiệu hóa gói'));
    }
  };

  const updateConfigField = (key: keyof UpdateCreditConfigPayload, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: Number(value) }));
  };

  const saveConfig = async (event: FormEvent) => {
    event.preventDefault();
    const payload: UpdateCreditConfigPayload = {
      unlockCvPoints: Number(config.unlockCvPoints),
      buyCvPoints: Number(config.buyCvPoints),
      pinJobPoints: Number(config.pinJobPoints),
      urgentJobPoints: Number(config.urgentJobPoints),
      refreshJobPoints: Number(config.refreshJobPoints),
    };

    setSavingConfig(true);
    try {
      const { data } = await packageService.adminUpdateCreditConfig(payload);
      setConfig({ ...DEFAULT_CONFIG, ...data });
      toast.success('Đã cập nhật cấu hình credit');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật cấu hình'));
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner />
        <p className="text-muted mt-3 mb-0">Đang tải...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 fw-bold mb-1">Gói & Credit</h1>
          <p className="text-muted mb-0">Quản lý gói mua credit, chi phí thao tác và ledger toàn hệ thống.</p>
        </div>
        <Button variant="outline-secondary" onClick={load}>
          <i className="bi bi-arrow-clockwise me-1" />Tải lại
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-3">
        <Col lg={4}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <h2 className="h5 fw-bold mb-3">{form.id ? 'Cập nhật gói' : 'Tạo gói mới'}</h2>
              <Form onSubmit={savePackage}>
                <Form.Group className="mb-2">
                  <Form.Label>Tên gói</Form.Label>
                  <Form.Control
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Mô tả</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </Form.Group>
                <Row className="g-2">
                  <Col sm={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Giá VND</Form.Label>
                      <Form.Control
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group className="mb-2">
                      <Form.Label>Credit</Form.Label>
                      <Form.Control
                        type="number"
                        min={1}
                        value={form.credits}
                        onChange={(e) => setForm((prev) => ({ ...prev, credits: e.target.value }))}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Hạn dùng (ngày)</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    value={form.durationDays}
                    onChange={(e) => setForm((prev) => ({ ...prev, durationDays: e.target.value }))}
                  />
                </Form.Group>
                {form.id && (
                  <Form.Check
                    className="mb-3"
                    type="switch"
                    id="package-active"
                    label="Đang bán"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                )}
                <div className="d-flex gap-2">
                  <Button type="submit" disabled={savingPackage}>
                    {savingPackage ? <Spinner size="sm" /> : form.id ? 'Lưu gói' : 'Tạo gói'}
                  </Button>
                  {form.id && (
                    <Button variant="outline-secondary" onClick={resetForm}>
                      Hủy
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="h5 fw-bold mb-3">Cấu hình chi phí</h2>
              <Form onSubmit={saveConfig}>
                {[
                  ['unlockCvPoints', 'Mở khóa CV'],
                  ['buyCvPoints', 'Mua CV'],
                  ['pinJobPoints', 'Ghim tin'],
                  ['urgentJobPoints', 'Đánh dấu gấp'],
                  ['refreshJobPoints', 'Đẩy tin'],
                ].map(([key, label]) => (
                  <Form.Group className="mb-2" key={key}>
                    <Form.Label>{label}</Form.Label>
                    <Form.Control
                      type="number"
                      min={0}
                      value={config[key as keyof UpdateCreditConfigPayload] ?? 0}
                      onChange={(e) =>
                        updateConfigField(key as keyof UpdateCreditConfigPayload, e.target.value)
                      }
                    />
                  </Form.Group>
                ))}
                <Button type="submit" disabled={savingConfig} className="mt-2">
                  {savingConfig ? <Spinner size="sm" /> : 'Lưu cấu hình'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Body>
              <h2 className="h5 fw-bold mb-3">Danh sách gói</h2>
              {packages.length === 0 ? (
                <Alert variant="info" className="mb-0">Chưa có gói nào.</Alert>
              ) : (
                <Table responsive hover className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Gói</th>
                      <th className="text-end">Giá</th>
                      <th className="text-end">Credit</th>
                      <th className="text-end">Hạn</th>
                      <th>Trạng thái</th>
                      <th className="text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg) => (
                      <tr key={getEntityId(pkg)}>
                        <td>
                          <div className="fw-500">{pkg.name}</div>
                          {pkg.description && <div className="small text-muted">{pkg.description}</div>}
                        </td>
                        <td className="text-end">{formatVnd(pkg.price)}</td>
                        <td className="text-end">{pkg.credits}</td>
                        <td className="text-end">{pkg.durationDays ?? 30} ngày</td>
                        <td>
                          <Badge bg={pkg.isActive ? 'success' : 'secondary'}>
                            {pkg.isActive ? 'Đang bán' : 'Đã tắt'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button size="sm" variant="outline-primary" onClick={() => editPackage(pkg)}>
                            Sửa
                          </Button>
                          {pkg.isActive && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="ms-2"
                              onClick={() => deactivatePackage(pkg)}
                            >
                              Tắt
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h2 className="h5 fw-bold mb-3">Ledger credit gần đây</h2>
              {ledger.length === 0 ? (
                <Alert variant="info" className="mb-0">Chưa có giao dịch nào.</Alert>
              ) : (
                <Table responsive hover className="align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Loại</th>
                      <th>Mô tả</th>
                      <th className="text-end">Credit</th>
                      <th className="text-end">Số dư sau</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((tx) => (
                      <tr key={getEntityId(tx)}>
                        <td className="small text-muted">{formatDateTime(tx.createdAt)}</td>
                        <td><Badge bg="light" text="dark">{TX_LABEL[tx.type] ?? tx.type}</Badge></td>
                        <td className="small">{tx.description}</td>
                        <td className={`text-end fw-500 ${tx.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                        </td>
                        <td className="text-end">{tx.balanceAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
