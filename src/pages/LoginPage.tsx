import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@stores/authStore';
import { SocialLoginButtons } from '@components/auth/SocialLoginButtons';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError('');
    try {
      await login(data.email, data.password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(message);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Đăng nhập</h2>
            <p className="text-muted">Chào mừng bạn quay lại F-Job</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

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

            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập mật khẩu"
                {...register('password')}
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex justify-content-end mb-3">
              <Link to="/quen-mat-khau" className="text-decoration-none small">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              className="btn-primary-gradient w-100"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : 'Đăng nhập'}
            </Button>
          </Form>

          <SocialLoginButtons mode="login" />

          <p className="text-center mt-4 text-muted">
            Chưa có tài khoản?{' '}
            <Link to="/dang-ky" className="text-decoration-none fw-500">
              Đăng ký ngay
            </Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
}
