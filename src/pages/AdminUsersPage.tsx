import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import userService, { CreateUserPayload, UpdateUserPayload, User } from '@services/userService';
import toast from 'react-hot-toast';

type UserForm = CreateUserPayload;

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string } } };
  return err.response?.data?.message || fallback;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const createForm = useForm<UserForm>({
    defaultValues: { name: '', email: '', password: '', role: 'USER' },
  });

  const editForm = useForm<UpdateUserPayload>({
    defaultValues: { name: '', email: '', role: 'USER' },
  });

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.email.localeCompare(b.email)),
    [users]
  );

  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await userService.getAll();
      setUsers(Array.isArray(data) ? data : data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách người dùng'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleViewDetail = async (id: string) => {
    try {
      const { data } = await userService.getById(id);
      setSelectedUser('data' in data ? data.data : data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tải chi tiết người dùng'));
    }
  };

  const handleCreate = async (payload: UserForm) => {
    setIsSubmitting(true);
    try {
      await userService.create(payload);
      toast.success('Đã tạo người dùng');
      setShowCreate(false);
      createForm.reset({ name: '', email: '', password: '', role: 'USER' });
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể tạo người dùng'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    editForm.reset({ name: user.name, email: user.email, role: user.role });
  };

  const handleUpdate = async (payload: UpdateUserPayload) => {
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      await userService.update(editingUser.id, payload);
      toast.success('Đã cập nhật người dùng');
      setEditingUser(null);
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể cập nhật người dùng'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    const confirmed = window.confirm(`Xóa người dùng ${user.email}?`);
    if (!confirmed) return;

    try {
      await userService.delete(user.id);
      toast.success('Đã xóa người dùng');
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Không thể xóa người dùng'));
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1">Quản lý người dùng</h1>
          <p className="text-muted mb-0">Tích hợp CRUD API `/api/users` của backend.</p>
        </div>
        <Button className="btn-primary-gradient" onClick={() => setShowCreate(true)}>
          <i className="bi bi-plus-lg me-2"></i>Tạo user
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải người dùng...</p>
            </div>
          ) : sortedUsers.length === 0 ? (
            <Alert variant="info" className="mb-0">Chưa có người dùng.</Alert>
          ) : (
            <Table responsive hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Ngày tạo</th>
                  <th className="text-end">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="fw-500">{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.role === 'ADMIN' ? 'danger' : 'secondary'}>{user.role}</Badge>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <Button size="sm" variant="outline-secondary" onClick={() => handleViewDetail(user.id)}>
                          Chi tiết
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={() => openEdit(user)}>
                          Sửa
                        </Button>
                        <Button size="sm" variant="outline-danger" onClick={() => handleDelete(user)}>
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

      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Form onSubmit={createForm.handleSubmit(handleCreate)}>
          <Modal.Header closeButton>
            <Modal.Title>Tạo người dùng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={12} className="mb-3">
                <Form.Label>Tên</Form.Label>
                <Form.Control {...createForm.register('name', { required: true })} />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" {...createForm.register('email', { required: true })} />
              </Col>
              <Col md={12} className="mb-3">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control type="password" {...createForm.register('password', { required: true, minLength: 8 })} />
              </Col>
              <Col md={12}>
                <Form.Label>Role</Form.Label>
                <Form.Select {...createForm.register('role')}>
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowCreate(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Tạo'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!editingUser} onHide={() => setEditingUser(null)} centered>
        <Form onSubmit={editForm.handleSubmit(handleUpdate)}>
          <Modal.Header closeButton>
            <Modal.Title>Sửa người dùng</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tên</Form.Label>
              <Form.Control {...editForm.register('name')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" {...editForm.register('email')} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Form.Select {...editForm.register('role')}>
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setEditingUser(null)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang lưu...' : 'Lưu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!selectedUser} onHide={() => setSelectedUser(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <dl className="mb-0">
              <dt>ID</dt>
              <dd className="text-break">{selectedUser.id}</dd>
              <dt>Tên</dt>
              <dd>{selectedUser.name}</dd>
              <dt>Email</dt>
              <dd>{selectedUser.email}</dd>
              <dt>Role</dt>
              <dd>{selectedUser.role}</dd>
              <dt>Cập nhật</dt>
              <dd>{new Date(selectedUser.updatedAt).toLocaleString('vi-VN')}</dd>
            </dl>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
}
