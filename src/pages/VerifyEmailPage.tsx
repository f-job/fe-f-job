import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import authService from '@services/authService';

export default function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email...');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Thiếu token xác thực email.');
        return;
      }

      try {
        const { data } = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(data?.message || 'Email đã được xác thực thành công.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Token xác thực không hợp lệ hoặc đã hết hạn.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4 text-center">
              <h2 className="fw-bold mb-3">Xác thực email</h2>
              {status === 'loading' ? (
                <div className="py-4">
                  <Spinner className="mb-3" />
                  <p className="text-muted mb-0">{message}</p>
                </div>
              ) : (
                <>
                  <Alert variant={status === 'success' ? 'success' : 'danger'}>{message}</Alert>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button as={Link as any} to="/dang-nhap" className="btn-primary-gradient">
                      Đăng nhập
                    </Button>
                    {status === 'error' && (
                      <Button as={Link as any} to="/gui-lai-xac-thuc-email" variant="outline-primary">
                        Gửi lại email
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
