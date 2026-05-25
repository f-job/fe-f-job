import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@stores/authStore';
import { SocialLoginButtons } from '@components/auth/SocialLoginButtons';
import toast from 'react-hot-toast';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(99),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setError('');
    try {
      await registerUser(data.email, data.fullName, data.password);
      toast.success('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      navigate('/dang-nhap');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Đăng ký thất bại';
      setError(message);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Đăng ký</h2>
            <p className="text-muted">Tạo tài khoản F-Job miễn phí</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>Họ và tên</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nguyễn Văn A"
                {...register('fullName')}
                isInvalid={!!errors.fullName}
              />
              <Form.Control.Feedback type="invalid">
                {errors.fullName?.message}
              </Form.Control.Feedback>
            </Form.Group>

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
              {isLoading ? <Spinner size="sm" /> : 'Đăng ký'}
            </Button>
          </Form>

          <SocialLoginButtons mode="signup" />

          <p className="text-center mt-4 text-muted">
            Đã có tài khoản?{' '}
            <Link to="/dang-nhap" className="text-decoration-none fw-500">
              Đăng nhập
            </Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
}
