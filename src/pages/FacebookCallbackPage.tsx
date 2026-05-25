import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Container, Alert } from 'react-bootstrap';

/**
 * Facebook OAuth callback page.
 * Facebook redirects here with access_token in the URL hash.
 * This page extracts the token and posts it to the opener, then closes.
 * If window.opener is null (popup lost parent), redirects to a success page.
 */
export default function FacebookCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Facebook OAuth with response_type=token returns access_token in the URL fragment (#access_token=...)
    const hash = window.location.hash;

    if (!hash) {
      // No hash — redirect back
      navigate('/dang-nhap', { replace: true });
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const error = params.get('error');

    if (error) {
      const errorMessage = params.get('error_description') || error;
      if (window.opener) {
        window.opener.postMessage({ type: 'FACEBOOK_OAUTH_ERROR', message: errorMessage }, window.location.origin);
        window.close();
      } else {
        navigate('/dang-nhap', { replace: true });
      }
      return;
    }

    if (!accessToken) {
      navigate('/dang-nhap', { replace: true });
      return;
    }

    // We have a token — send it to opener, or redirect to success page if opener is gone
    if (window.opener) {
      window.opener.postMessage({ type: 'FACEBOOK_OAUTH_TOKEN', token: accessToken }, window.location.origin);
      window.close();
    } else {
      // Popup lost its opener — redirect to success page with token in URL
      window.location.href = `/facebook-success?token=${encodeURIComponent(accessToken)}`;
    }
  }, [navigate]);

  return (
    <Container className="py-5 text-center">
      <Spinner animation="border" role="status" />
      <p className="mt-3 text-muted">Đang xử lý đăng nhập Facebook...</p>
      <Alert variant="info" className="mt-3">
        Nếu cửa sổ này không tự đóng, vui lòng kiểm tra cài đặt trình duyệt cho phép popup.
      </Alert>
    </Container>
  );
}
