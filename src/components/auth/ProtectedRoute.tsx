import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" replace />;
  }

  return <>{children}</>;
}
