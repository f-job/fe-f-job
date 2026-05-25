import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Container, Alert } from 'react-bootstrap';
import authService from '@services/authService';
import { useAuthStore } from '@stores/authStore';

/**
 * Facebook success page — handles the case where window.opener is null.
 * Receives the access token from the query string, calls the backend,
 * stores auth state, and closes the popup or redirects to home.
 */
export default function FacebookSuccessPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      navigate('/dang-nhap', { replace: true });
      return;
    }

    authService.loginWithFacebook(token)
      .then(({ data }) => {
        setAuth(data.accessToken, data.refreshToken, data.user);
        // Small delay so user sees success, then close popup
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
            window.close();
          } else {
            navigate('/', { replace: true });
          }
        }, 500);
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Đăng nhập Facebook thất bại';
        setError(msg);
      });
  }, [navigate, setAuth]);

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">{error}</Alert>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/dang-nhap', { replace: true })}>
          Quay lại đăng nhập
        </button>
      </Container>
    );
  }

  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" role="status" />
      <p className="mt-3 text-muted">Đang hoàn tất đăng nhập...</p>
    </Container>
  );
}
