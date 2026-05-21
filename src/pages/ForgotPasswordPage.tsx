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
});

type ForgotForm = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={5}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Quên mật khẩu</h2>
            <p className="text-muted">Nhập email để nhận link đặt lại mật khẩu</p>
          </div>

          {sent ? (
            <Alert variant="success">
              Chúng tôi đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.
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

              <Button
                type="submit"
                className="btn-primary-gradient w-100"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'Gửi email'}
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
