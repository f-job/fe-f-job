import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Card, Container, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import employerJobService from '@services/employerJobService';
import { JobPostForm } from '@components/employer/JobPostForm';
import type { CreateEmployerJobPayload, BackendJob } from '@/types/api';
import { getErrorMessage } from '@utils/format';

export default function PostJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(!!editId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existing, setExisting] = useState<BackendJob | null>(null);

  const loadForEdit = useCallback(async () => {
    if (!editId) return;
    setLoading(true);
    try {
      const { data } = await employerJobService.getById(editId);
      setExisting(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải tin để chỉnh sửa'));
    } finally {
      setLoading(false);
    }
  }, [editId]);

  useEffect(() => {
    loadForEdit();
  }, [loadForEdit]);

  const handleSubmit = async (payload: CreateEmployerJobPayload) => {
    setSubmitting(true);
    try {
      if (editId) {
        await employerJobService.update(editId, payload);
        toast.success('Đã cập nhật tin tuyển dụng');
      } else {
        await employerJobService.create(payload);
        toast.success('Đã đăng tin! Tin sẽ hiển thị sau khi admin duyệt.');
      }
      navigate('/nha-tuyen-dung/tin-dang');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lưu tin thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 880 }}>
      <h1 className="h3 fw-bold mb-1">{editId ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}</h1>
      <p className="text-muted">
        {editId
          ? 'Cập nhật thông tin tin tuyển dụng của bạn.'
          : 'Tin mới sẽ ở trạng thái "Chờ duyệt" cho đến khi được admin phê duyệt.'}
      </p>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          {loading ? (
            <div className="text-center py-5">
              <Spinner />
              <p className="text-muted mt-3 mb-0">Đang tải...</p>
            </div>
          ) : (
            <JobPostForm
              initial={existing ?? undefined}
              submitting={submitting}
              submitLabel={editId ? 'Lưu thay đổi' : 'Đăng tin'}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/nha-tuyen-dung/tin-dang')}
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
