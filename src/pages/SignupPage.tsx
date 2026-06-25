import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert, Spinner, Nav } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@stores/authStore';
import { SocialLoginButtons } from '@components/auth/SocialLoginButtons';
import { getErrorMessage } from '@utils/format';
import toast from 'react-hot-toast';

type AccountType = 'candidate' | 'employer';

const candidateSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(99),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

const employerSchema = z.object({
  companyName: z.string().min(2, 'Tên công ty phải có ít nhất 2 ký tự').max(99),
  email: z.string().email('Email không hợp lệ'),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url('Website không hợp lệ').optional().or(z.literal('')),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type CandidateForm = z.infer<typeof candidateSchema>;
type EmployerForm = z.infer<typeof employerSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const { registerCandidate, registerEmployer, isLoading } = useAuthStore();
  const [accountType, setAccountType] = useState<AccountType>('candidate');
  const [error, setError] = useState('');

  const candidateForm = useForm<CandidateForm>({ resolver: zodResolver(candidateSchema) });
  const employerForm = useForm<EmployerForm>({ resolver: zodResolver(employerSchema) });

  const onCandidateSubmit = async (data: CandidateForm) => {
    setError('');
    try {
      await registerCandidate({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || undefined,
        address: data.address || undefined,
      });
      
      toast.success('Đăng ký thành công! Vui lòng xác thực danh tính để tiếp tục.');
      
      // Redirect to post-registration verification with email
      navigate(`/xac-thuc-sau-dang-ky?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký thất bại'));
    }
  };

  const onEmployerSubmit = async (data: EmployerForm) => {
    setError('');
    try {
      await registerEmployer({
        email: data.email,
        password: data.password,
        companyName: data.companyName,
        industry: data.industry || undefined,
        companySize: data.companySize || undefined,
        address: data.address || undefined,
        website: data.website || undefined,
      });
      
      toast.success('Đăng ký thành công! Vui lòng xác thực danh tính để tiếp tục.');
      
      // Redirect to post-registration verification with email
      navigate(`/xac-thuc-sau-dang-ky?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Đăng ký thất bại'));
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <div className="text-center mb-4">
            <h2 className="fw-bold">Đăng ký</h2>
            <p className="text-muted">Tạo tài khoản F-Job miễn phí</p>
          </div>

          <Nav
            variant="pills"
            className="justify-content-center mb-4"
            activeKey={accountType}
            onSelect={(k) => {
              setError('');
              setAccountType((k as AccountType) ?? 'candidate');
            }}
          >
            <Nav.Item>
              <Nav.Link eventKey="candidate">Ứng viên</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="employer">Nhà tuyển dụng</Nav.Link>
            </Nav.Item>
          </Nav>

          {error && <Alert variant="danger">{error}</Alert>}

          {accountType === 'candidate' ? (
            <Form onSubmit={candidateForm.handleSubmit(onCandidateSubmit)}>
              <Form.Group className="mb-3">
                <Form.Label>Họ và tên</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nguyễn Văn A"
                  {...candidateForm.register('fullName')}
                  isInvalid={!!candidateForm.formState.errors.fullName}
                />
                <Form.Control.Feedback type="invalid">
                  {candidateForm.formState.errors.fullName?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@example.com"
                  {...candidateForm.register('email')}
                  isInvalid={!!candidateForm.formState.errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {candidateForm.formState.errors.email?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Row>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số điện thoại</Form.Label>
                    <Form.Control placeholder="0912345678" {...candidateForm.register('phone')} />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control placeholder="Đà Nẵng" {...candidateForm.register('address')} />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Ít nhất 8 ký tự"
                  {...candidateForm.register('password')}
                  isInvalid={!!candidateForm.formState.errors.password}
                />
                <Form.Control.Feedback type="invalid">
                  {candidateForm.formState.errors.password?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  {...candidateForm.register('confirmPassword')}
                  isInvalid={!!candidateForm.formState.errors.confirmPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {candidateForm.formState.errors.confirmPassword?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="btn-primary-gradient w-100" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Đăng ký ứng viên'}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={employerForm.handleSubmit(onEmployerSubmit)}>
              <Form.Group className="mb-3">
                <Form.Label>Tên công ty</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Công ty TNHH Sự kiện ABC"
                  {...employerForm.register('companyName')}
                  isInvalid={!!employerForm.formState.errors.companyName}
                />
                <Form.Control.Feedback type="invalid">
                  {employerForm.formState.errors.companyName?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="name@company.com"
                  {...employerForm.register('email')}
                  isInvalid={!!employerForm.formState.errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {employerForm.formState.errors.email?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Row>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Ngành</Form.Label>
                    <Form.Control placeholder="Sự kiện" {...employerForm.register('industry')} />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Quy mô</Form.Label>
                    <Form.Control placeholder="50-200" {...employerForm.register('companySize')} />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Website</Form.Label>
                <Form.Control
                  placeholder="https://company.com"
                  {...employerForm.register('website')}
                  isInvalid={!!employerForm.formState.errors.website}
                />
                <Form.Control.Feedback type="invalid">
                  {employerForm.formState.errors.website?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Địa chỉ</Form.Label>
                <Form.Control placeholder="Đà Nẵng" {...employerForm.register('address')} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Ít nhất 8 ký tự"
                  {...employerForm.register('password')}
                  isInvalid={!!employerForm.formState.errors.password}
                />
                <Form.Control.Feedback type="invalid">
                  {employerForm.formState.errors.password?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Xác nhận mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  {...employerForm.register('confirmPassword')}
                  isInvalid={!!employerForm.formState.errors.confirmPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {employerForm.formState.errors.confirmPassword?.message}
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" className="btn-primary-gradient w-100" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Đăng ký nhà tuyển dụng'}
              </Button>
            </Form>
          )}

          {accountType === 'candidate' && <SocialLoginButtons mode="signup" />}

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
