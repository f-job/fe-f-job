import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';

interface Props {
  children: React.ReactNode;
  /** Optional role gate — if set, only these roles may access the route. */
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/dang-nhap" replace />;
  }

  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
