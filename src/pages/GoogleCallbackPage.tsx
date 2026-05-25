import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Container, Alert } from 'react-bootstrap';

/**
 * Google OAuth callback page.
 * Google redirects here with id_token in the URL hash (#id_token=...).
 * This page extracts the token and posts it to the opener, then closes.
 */
export default function GoogleCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // strip leading '#'
      const idToken = params.get('id_token');
      const error = params.get('error');

      if (idToken && window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_OAUTH_IDTOKEN', idToken }, window.location.origin);
        window.close();
      } else if (error || !idToken) {
        const errorMessage = params.get('error_description') || error || 'Không nhận được ID token từ Google';
        if (window.opener) {
          window.opener.postMessage(
            { type: 'GOOGLE_OAUTH_ERROR', message: errorMessage },
            window.location.origin
          );
          window.close();
        } else {
          navigate('/dang-nhap', { replace: true });
        }
      }
    } else {
      // No hash — redirect back
      if (!window.opener) {
        navigate('/dang-nhap', { replace: true });
      }
    }
  }, [navigate]);

  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" role="status" />
      <p className="mt-3 text-muted">Đang xử lý đăng nhập Google...</p>
      <Alert variant="info" className="mt-3">
        Nếu cửa sổ này không tự đóng, vui lòng kiểm tra cài đặt trình duyệt cho phép popup.
      </Alert>
    </Container>
  );
}
