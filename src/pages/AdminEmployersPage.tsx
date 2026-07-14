import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import employerService from '@services/employerService';
import type { EmployerProfile, UpdateEmployerPayload } from '@/types/api';
import {
  employerStatusLabel,
  employerStatusVariant,
  formatDateTime,
  getEntityId,
  getErrorMessage,
} from '@utils/format';

function employerEmail(emp: EmployerProfile): string {
  if (emp.userId && typeof emp.userId === 'object') {
    return emp.userId.email ?? emp.contactEmail ?? '—';
  }
  return emp.contactEmail ?? '—';
}

export default function AdminEmployersPage() {
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<EmployerProfile | null>(null);
  const [editing, setEditing] = useState<EmployerProfile | null>(null);
  const [rejecting, setRejecting] = useState<EmployerProfile | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editForm = useForm<UpdateEmployerPayload>();

  const sorted = useMemo(
    () => [...employers].sort((a, b) => a.companyName.localeCompare(b.companyName)),
    [employers]
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await employerService.list();
      setEmployers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách nhà tuyển dụng'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleVerify = async (emp: EmployerProfile) => {
    try {
      await employerService.verify(getEntityId(emp));
      toast.success('Đã duyệt nhà tuyển dụng');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể duyệt'));
    }
  };

  const handleReject = async () => {
    if (!rejecting) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setIsSubmitting(true);
    try {
      await employerService.reject(getEntityId(rejecting), rejectReason.trim());
      toast.success('Đã từ chối nhà tuyển dụng');
      setRejecting(null);
      setRejectReason('');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể từ chối'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async (emp: EmployerProfile) => {
    const reason = window.prompt(`Lý do khóa nhà tuyển dụng ${emp.companyName}?`);
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Lý do khóa không được để trống');
      return;
    }
    try {
      await employerService.block(getEntityId(emp), reason.trim());
      toast.success('Đã khóa nhà tuyển dụng');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể khóa'));
    }
  };

  const handleDelete = async (emp: EmployerProfile) => {
    if (!window.confirm(`Xóa nhà tuyển dụng ${emp.companyName} và tài khoản liên kết?`)) return;
    try {
      await employerService.remove(getEntityId(emp));
      toast.success('Đã xóa nhà tuyển dụng');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa'));
    }
  };

  const openEdit = (emp: EmployerProfile) => {
    setEditing(emp);
    editForm.reset({
      companyName: emp.companyName,
      companyDescription: emp.companyDescription ?? '',
      website: emp.website ?? '',
      industry: emp.industry ?? '',
      companySize: emp.companySize ?? '',
      address: emp.address ?? '',
      city: emp.city ?? '',
      country: emp.country ?? '',
    });
  };

  const handleUpdate = async (payload: UpdateEmployerPayload) => {
    if (!editing) return;
    setIsSubmitting(true);
    // Drop empty-string optionals so we don't fail the backend @IsUrl on website.
    const cleaned = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== '' && v !== undefined)
    ) as UpdateEmployerPayload;
    try {
      await employerService.update(getEntityId(editing), cleaned);
      toast.success('Đã cập nhật nhà tuyển dụng');
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Quản lý nhà tuyển dụng</h1>
          <p className="text-muted mb-0">API `/api/employers` của backend.</p>
        </div>
        <Button variant="outline-secondary" onClick={load}>
          <i className="bi bi-arrow-clockwise me-2" />Tải lại
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : sorted.length === 0 ? (
            <Alert variant="info" className="mb-0">Chưa có nhà tuyển dụng.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Công ty</th>
                  <th>Email</th>
                  <th>Ngành</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((emp) => (
                  <tr key={getEntityId(emp)}>
                    <td className="fw-500">{emp.companyName}</td>
                    <td>{employerEmail(emp)}</td>
                    <td>{emp.industry ?? '—'}</td>
                    <td>
                      <Badge bg={employerStatusVariant(emp.status)}>
                        {employerStatusLabel(emp.status)}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2 flex-wrap">
                        <Button size="sm" variant="outline-secondary" onClick={() => setDetail(emp)}>
                          Chi tiết
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={() => openEdit(emp)}>
                          Sửa
                        </Button>
                        {emp.status !== 'APPROVED' && (
                          <Button size="sm" variant="outline-success" onClick={() => handleVerify(emp)}>
                            Duyệt
                          </Button>
                        )}
                        {emp.status !== 'REJECTED' && (
                          <Button size="sm" variant="outline-warning" onClick={() => setRejecting(emp)}>
                            Từ chối
                          </Button>
                        )}
                        {emp.status !== 'BLOCKED' && (
                          <Button size="sm" variant="outline-dark" onClick={() => handleBlock(emp)}>
                            Khóa
                          </Button>
                        )}
                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(emp)}>
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Edit modal */}
      <Modal show={!!editing} onHide={() => setEditing(null)} centered>
        <Form onSubmit={editForm.handleSubmit(handleUpdate)}>
          <Modal.Header closeButton>
            <Modal.Title>Sửa nhà tuyển dụng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên công ty</Form.Label>
              <Form.Control {...editForm.register('companyName')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control as="textarea" rows={2} {...editForm.register('companyDescription')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Website</Form.Label>
              <Form.Control type="url" {...editForm.register('website')} placeholder="https://..." />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ngành</Form.Label>
              <Form.Control {...editForm.register('industry')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quy mô</Form.Label>
              <Form.Control {...editForm.register('companySize')} placeholder="50-200" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control {...editForm.register('address')} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditing(null)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reject modal */}
      <Modal show={!!rejecting} onHide={() => setRejecting(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Từ chối nhà tuyển dụng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">Công ty: <strong>{rejecting?.companyName}</strong></p>
          <Form.Group>
            <Form.Label>Lý do từ chối</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setRejecting(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleReject} disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Từ chối'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail modal */}
      <Modal show={!!detail} onHide={() => setDetail(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết nhà tuyển dụng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detail && (
            <dl className="mb-0">
              <dt>Công ty</dt>
              <dd>{detail.companyName}</dd>
              <dt>Email</dt>
              <dd>{employerEmail(detail)}</dd>
              <dt>Mô tả</dt>
              <dd>{detail.companyDescription ?? '—'}</dd>
              <dt>Website</dt>
              <dd className="text-break">{detail.website ?? '—'}</dd>
              <dt>Ngành</dt>
              <dd>{detail.industry ?? '—'}</dd>
              <dt>Địa chỉ</dt>
              <dd>{detail.address ?? '—'}</dd>
              <dt>Tên tiếng Anh</dt>
              <dd>{detail.englishName ?? '—'}</dd>
              <dt>Tên viết tắt</dt>
              <dd>{detail.shortName ?? '—'}</dd>
              <dt>Mã số doanh nghiệp</dt>
              <dd>{detail.businessRegistrationNumber ?? '—'}</dd>
              <dt>Đại diện pháp luật</dt>
              <dd>{detail.legalRepresentative ?? '—'}</dd>
              <dt>Điện thoại</dt>
              <dd>{detail.contactPhone ?? '—'}</dd>
              <dt>Chi nhánh</dt>
              <dd>
                {detail.branches?.length ? (
                  <ul className="mb-0 ps-3">
                    {detail.branches.map((branch) => (
                      <li key={`${branch.name}-${branch.address}`}>
                        <strong>{branch.name}</strong> — {branch.address}
                      </li>
                    ))}
                  </ul>
                ) : '—'}
              </dd>
              <dt>Trạng thái</dt>
              <dd>
                <Badge bg={employerStatusVariant(detail.status)}>
                  {employerStatusLabel(detail.status)}
                </Badge>
              </dd>
              {detail.rejectedReason && (
                <>
                  <dt>Lý do từ chối</dt>
                  <dd>{detail.rejectedReason}</dd>
                </>
              )}
              {detail.blockedReason && (
                <>
                  <dt>Lý do khóa</dt>
                  <dd>{detail.blockedReason}</dd>
                </>
              )}
              <dt>Cập nhật</dt>
              <dd>{formatDateTime(detail.updatedAt)}</dd>
            </dl>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
