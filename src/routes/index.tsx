import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import MainLayout from '@layouts/MainLayout';

const HomePage = lazy(() => import('@pages/HomePage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));
const SignupPage = lazy(() => import('@pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@pages/ResetPasswordPage'));

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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];
