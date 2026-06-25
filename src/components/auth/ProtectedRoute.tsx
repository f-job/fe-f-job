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

  // Check if user needs identity verification
  const userWithVerification = user as any;
  if (userWithVerification?.needsVerification) {
    return (
      <Navigate 
        to={`/xac-thuc-sau-dang-ky?email=${encodeURIComponent(user!.email)}`} 
        replace 
      />
    );
  }

  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
