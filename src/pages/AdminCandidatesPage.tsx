import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import candidateService from '@services/candidateService';
import type {
  CandidateDetail,
  PaginationMeta,
  UpdateCandidatePayload,
} from '@/types/api';
import { formatDateTime, getEntityId, getErrorMessage } from '@utils/format';

export default function AdminCandidatesPage() {
  const [rows, setRows] = useState<CandidateDetail[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [editing, setEditing] = useState<CandidateDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editForm = useForm<UpdateCandidatePayload>({
    defaultValues: { fullName: '', phone: '', address: '', resumeUrl: '', avatarUrl: '' },
  });

  const load = useCallback(async (targetPage: number, kw: string) => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await candidateService.list({ page: targetPage, limit: 10, keyword: kw || undefined });
      setRows(data.data);
      setMeta(data.meta);
      setPage(targetPage);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách ứng viên'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, '');
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(1, keyword);
  };

  const handleViewDetail = async (row: CandidateDetail) => {
    const id = getEntityId(row.user);
    try {
      const { data } = await candidateService.getById(id);
      setDetail(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải chi tiết ứng viên'));
    }
  };

  const openEdit = (row: CandidateDetail) => {
    setEditing(row);
    editForm.reset({
      fullName: row.profile?.fullName ?? row.user.fullName ?? '',
      phone: row.profile?.phone ?? '',
      address: row.profile?.address ?? '',
      resumeUrl: row.profile?.resumeUrl ?? '',
      avatarUrl: row.profile?.avatarUrl ?? '',
    });
  };

  const handleUpdate = async (payload: UpdateCandidatePayload) => {
    if (!editing) return;
    setIsSubmitting(true);
    try {
      await candidateService.update(getEntityId(editing.user), payload);
      toast.success('Đã cập nhật hồ sơ ứng viên');
      setEditing(null);
      await load(page, keyword);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOpenToWork = async (row: CandidateDetail) => {
    const id = getEntityId(row.user);
    const next = !(row.profile?.openToWork ?? false);
    try {
      await candidateService.setOpenToWork(id, next);
      toast.success(next ? 'Đã bật tìm việc' : 'Đã tắt tìm việc');
      await load(page, keyword);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái'));
    }
  };

  const toggleBlock = async (row: CandidateDetail) => {
    const id = getEntityId(row.user);
    const isBlocked = row.user.status === 'blocked';
    try {
      if (isBlocked) {
        await candidateService.unblock(id);
        toast.success('Đã mở khóa ứng viên');
      } else {
        if (!window.confirm(`Khóa ứng viên ${row.user.email}?`)) return;
        await candidateService.block(id);
        toast.success('Đã khóa ứng viên');
      }
      await load(page, keyword);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật trạng thái'));
    }
  };

  const handleDelete = async (row: CandidateDetail) => {
    if (!window.confirm(`Xóa vĩnh viễn ứng viên ${row.user.email}?`)) return;
    try {
      await candidateService.remove(getEntityId(row.user));
      toast.success('Đã xóa ứng viên');
      await load(page, keyword);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa ứng viên'));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Quản lý ứng viên</h1>
          <p className="text-muted mb-0">API `/api/users/candidates` của backend.</p>
        </div>
      </div>

      <Form className="mb-3" onSubmit={handleSearch}>
        <Row className="g-2">
          <Col md={4}>
            <Form.Control
              placeholder="Tìm theo tên hoặc email"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Col>
          <Col xs="auto">
            <Button type="submit" variant="outline-primary">Tìm</Button>
          </Col>
        </Row>
      </Form>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải ứng viên...</p>
            </div>
          ) : rows.length === 0 ? (
            <Alert variant="info" className="mb-0">Chưa có ứng viên.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Tìm việc</th>
                  <th>Trạng thái</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isBlocked = row.user.status === 'blocked';
                  const openToWork = row.profile?.openToWork ?? false;
                  return (
                    <tr key={getEntityId(row.user)}>
                      <td className="fw-500">{row.profile?.fullName ?? row.user.fullName ?? '—'}</td>
                      <td>{row.user.email}</td>
                      <td>
                        <Form.Check
                          type="switch"
                          checked={openToWork}
                          onChange={() => toggleOpenToWork(row)}
                        />
                      </td>
                      <td>
                        <Badge bg={isBlocked ? 'dark' : 'success'}>
                          {isBlocked ? 'Bị khóa' : 'Hoạt động'}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2 flex-wrap">
                          <Button size="sm" variant="outline-secondary" onClick={() => handleViewDetail(row)}>
                            Chi tiết
                          </Button>
                          <Button size="sm" variant="outline-primary" onClick={() => openEdit(row)}>
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant={isBlocked ? 'outline-success' : 'outline-warning'}
                            onClick={() => toggleBlock(row)}
                          >
                            {isBlocked ? 'Mở khóa' : 'Khóa'}
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(row)}>
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button variant="outline-secondary" size="sm" disabled={page <= 1} onClick={() => load(page - 1, keyword)}>
            Trang trước
          </Button>
          <span className="align-self-center small text-muted">Trang {meta.page} / {meta.totalPages}</span>
          <Button variant="outline-secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => load(page + 1, keyword)}>
            Trang sau
          </Button>
        </div>
      )}

      {/* Edit modal */}
      <Modal show={!!editing} onHide={() => setEditing(null)} centered>
        <Form onSubmit={editForm.handleSubmit(handleUpdate)}>
          <Modal.Header closeButton>
            <Modal.Title>Sửa hồ sơ ứng viên</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control {...editForm.register('fullName')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control {...editForm.register('phone')} placeholder="0912345678" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control {...editForm.register('address')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Link CV</Form.Label>
              <Form.Control type="url" {...editForm.register('resumeUrl')} placeholder="https://..." />
            </Form.Group>
            <Form.Group>
              <Form.Label>Link Avatar</Form.Label>
              <Form.Control type="url" {...editForm.register('avatarUrl')} placeholder="https://..." />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditing(null)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Detail modal */}
      <Modal show={!!detail} onHide={() => setDetail(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết ứng viên</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detail && (
            <dl className="mb-0">
              <dt>Họ tên</dt>
              <dd>{detail.profile?.fullName ?? detail.user.fullName ?? '—'}</dd>
              <dt>Email</dt>
              <dd>{detail.user.email}</dd>
              <dt>Điện thoại</dt>
              <dd>{detail.profile?.phone ?? '—'}</dd>
              <dt>Địa chỉ</dt>
              <dd>{detail.profile?.address ?? '—'}</dd>
              <dt>CV</dt>
              <dd className="text-break">
                {detail.profile?.resumeUrl ? (
                  <a href={detail.profile.resumeUrl} target="_blank" rel="noreferrer">
                    {detail.profile.resumeUrl}
                  </a>
                ) : '—'}
              </dd>
              <dt>Tìm việc</dt>
              <dd>{detail.profile?.openToWork ? 'Đang bật' : 'Đang tắt'}</dd>
              <dt>Cập nhật</dt>
              <dd>{formatDateTime(detail.profile?.updatedAt ?? detail.user.updatedAt)}</dd>
            </dl>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
