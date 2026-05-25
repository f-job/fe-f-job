import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spinner } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { useAuthStore } from '@stores/authStore';

interface SocialLoginButtonsProps {
  mode: 'login' | 'signup';
}

function getErrorMessage(error: unknown) {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err.response?.data?.message || err.message || 'Không thể đăng nhập bằng mạng xã hội.';
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();
  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null);
  const actionLabel = mode === 'login' ? 'Đăng nhập' : 'Đăng ký';

  const handleGoogle = async () => {
    setLoadingProvider('google');
    try {
      await loginWithGoogle();
      toast.success(`${actionLabel} bằng Google thành công!`);
      navigate('/');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingProvider(null);
    }
  };


  return (
    <div className="mt-4">
      <div className="d-flex align-items-center gap-3 mb-3">
        <hr className="flex-grow-1" />
        <span className="small text-muted">Hoặc tiếp tục với</span>
        <hr className="flex-grow-1" />
      </div>

      <div className="d-grid gap-2">
        <Button
          type="button"
          variant="outline-danger"
          className="d-flex align-items-center justify-content-center gap-2"
          onClick={handleGoogle}
          disabled={loadingProvider !== null}
        >
          {loadingProvider === 'google' ? <Spinner size="sm" /> : <i className="bi bi-google"></i>}
          {actionLabel} bằng Google
        </Button>

        {/* TODO: Re-enable Facebook login once app is approved by Facebook */}
        {/* <Button
          type="button"
          variant="outline-primary"
          className="d-flex align-items-center justify-content-center gap-2"
          onClick={handleFacebook}
          disabled={loadingProvider !== null}
        >
          {loadingProvider === 'facebook' ? <Spinner size="sm" /> : <i className="bi bi-facebook"></i>}
          {actionLabel} bằng Facebook
        </Button> */}
      </div>
    </div>
  );
}
