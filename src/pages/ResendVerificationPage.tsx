import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authService from '@services/authService';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type ResendForm = z.infer<typeof schema>;

export default function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResendForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResendForm) => {
    setIsLoading(true);
    try {
      await authService.resendVerification(data.email);
      setSent(true);
      toast.success('Email xác thực đã được gửi lại!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại email xác thực');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Gửi lại email xác thực</h2>
            <p className="text-muted">Nhập email đã đăng ký để nhận lại link xác thực</p>
          </div>

          {sent ? (
            <Alert variant="success">
              Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="btn-primary-gradient w-100" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Gửi lại email xác thực'}
              </Button>
            </Form>
          )}

          <p className="text-center mt-4 text-muted">
            <Link to="/dang-nhap" className="text-decoration-none fw-500">
              Quay lại đăng nhập
            </Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
}
