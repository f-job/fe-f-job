import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import MainLayout from '@layouts/MainLayout';
import AdminLayout from '@layouts/AdminLayout';
import { ProtectedRoute } from '@components/auth/ProtectedRoute';

const HomePage = lazy(() => import('@pages/HomePage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));
const SignupPage = lazy(() => import('@pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@pages/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('@pages/ResendVerificationPage'));
const AdminUsersPage = lazy(() => import('@pages/AdminUsersPage'));
const MonitoringPage = lazy(() => import('@pages/MonitoringPage'));
const FacebookCallbackPage = lazy(() => import('@pages/FacebookCallbackPage'));
const FacebookSuccessPage = lazy(() => import('@pages/FacebookSuccessPage'));
const GoogleCallbackPage = lazy(() => import('@pages/GoogleCallbackPage'));

function withSuspense(Component: React.LazyExoticComponent<() => JSX.Element>) {
  return (
    <Suspense fallback={<div className="text-center py-5">Đang tải...</div>}>
      <Component />
    </Suspense>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: 'dang-nhap', element: withSuspense(LoginPage) },
      { path: 'dang-ky', element: withSuspense(SignupPage) },
      { path: 'quen-mat-khau', element: withSuspense(ForgotPasswordPage) },
      { path: 'dat-lai-mat-khau', element: withSuspense(ResetPasswordPage) },
      { path: 'xac-thuc-email/:token', element: withSuspense(VerifyEmailPage) },
      { path: 'gui-lai-xac-thuc-email', element: withSuspense(ResendVerificationPage) },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="users" replace /> },
      { path: 'users', element: withSuspense(AdminUsersPage) },
      { path: 'monitoring', element: withSuspense(MonitoringPage) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },

  // OAuth callback — standalone (no layout)
  { path: '/facebook-callback', element: withSuspense(FacebookCallbackPage) },
  { path: '/facebook-success', element: withSuspense(FacebookSuccessPage) },
  { path: '/google-callback', element: withSuspense(GoogleCallbackPage) },
];
