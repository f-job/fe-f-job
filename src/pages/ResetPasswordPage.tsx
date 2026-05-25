import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import authService from '@services/authService';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  token: z.string().min(1, 'Vui lòng nhập mã xác nhận'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ResetForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(data.email, data.token, data.password);
      setSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Đặt lại mật khẩu</h2>
            <p className="text-muted">Nhập email, token từ email và mật khẩu mới</p>
          </div>

          {success ? (
            <Alert variant="success">
              Mật khẩu đã được đặt lại thành công.{' '}
              <Link to="/dang-nhap">Đăng nhập ngay</Link>
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Nhập email của bạn"
                  {...register('email')}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mã xác nhận</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nhập token từ email"
                  {...register('token')}
                  isInvalid={!!errors.token}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.token?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Ít nhất 8 ký tự"
                  {...register('password')}
                  isInvalid={!!errors.password}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')}
                  isInvalid={!!errors.confirmPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                type="submit"
                className="btn-primary-gradient w-100"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'Đặt lại mật khẩu'}
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
