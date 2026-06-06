import { RouteObject, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

import MainLayout from '@layouts/MainLayout';
import AdminLayout from '@layouts/AdminLayout';
import EmployerLayout from '@layouts/EmployerLayout';
import { ProtectedRoute } from '@components/auth/ProtectedRoute';

const HomePage = lazy(() => import('@pages/HomePage'));
const AboutPage = lazy(() => import('@pages/AboutPage'));
const LoginPage = lazy(() => import('@pages/LoginPage'));
const SignupPage = lazy(() => import('@pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@pages/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('@pages/ResendVerificationPage'));
const JobsPage = lazy(() => import('@pages/JobsPage'));
const JobDetailPage = lazy(() => import('@pages/JobDetailPage'));
const SearchPage = lazy(() => import('@pages/SearchPage'));
const CandidateSearchPage = lazy(() => import('@pages/CandidateSearchPage'));
const MyApplicationsPage = lazy(() => import('@pages/MyApplicationsPage'));
const ProfilePage = lazy(() => import('@pages/ProfilePage'));
const VerificationPage = lazy(() => import('@pages/VerificationPage'));
const NotificationsPage = lazy(() => import('@pages/NotificationsPage'));
const MessagesPage = lazy(() => import('@pages/MessagesPage'));
const ReferralPage = lazy(() => import('@pages/ReferralPage'));
const AdminUsersPage = lazy(() => import('@pages/AdminUsersPage'));
const AdminCandidatesPage = lazy(() => import('@pages/AdminCandidatesPage'));
const AdminEmployersPage = lazy(() => import('@pages/AdminEmployersPage'));
const AdminJobsPage = lazy(() => import('@pages/AdminJobsPage'));
const AdminReviewsPage = lazy(() => import('@pages/AdminReviewsPage'));
const AdminVerificationsPage = lazy(() => import('@pages/AdminVerificationsPage'));
const AdminReportsPage = lazy(() => import('@pages/AdminReportsPage'));
const AdminAuditLogsPage = lazy(() => import('@pages/AdminAuditLogsPage'));
const MonitoringPage = lazy(() => import('@pages/MonitoringPage'));
const PostJobPage = lazy(() => import('@pages/PostJobPage'));
const EmployerJobsPage = lazy(() => import('@pages/EmployerJobsPage'));
const EmployerPackagesPage = lazy(() => import('@pages/EmployerPackagesPage'));
const EmployerInterviewsPage = lazy(() => import('@pages/EmployerInterviewsPage'));
const FacebookCallbackPage = lazy(() => import('@pages/FacebookCallbackPage'));
const FacebookSuccessPage = lazy(() => import('@pages/FacebookSuccessPage'));
const GoogleCallbackPage = lazy(() => import('@pages/GoogleCallbackPage'));
const TestAvatarPage = lazy(() => import('@pages/TestAvatarPage'));
const DebugAuthPage = lazy(() => import('@pages/DebugAuthPage'));
const PrivacyPolicyPage = lazy(() => import('@pages/PrivacyPolicyPage'));
const TestQRPage = lazy(() => import('@pages/TestQRPage'));
const DebugVerificationPage = lazy(() => import('@pages/DebugVerificationPage'));
const PostRegisterVerificationPage = lazy(() => import('@pages/PostRegisterVerificationPage'));

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
      { path: 've-chung-toi', element: withSuspense(AboutPage) },
      { path: 'viec-lam', element: withSuspense(JobsPage) },
      { path: 'viec-lam/:id', element: withSuspense(JobDetailPage) },
      { path: 'tim-kiem', element: withSuspense(SearchPage) },
      {
        path: 'don-ung-tuyen',
        element: (
          <ProtectedRoute roles={['CANDIDATE']}>
            {withSuspense(MyApplicationsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'ho-so',
        element: (
          <ProtectedRoute roles={['CANDIDATE']}>
            {withSuspense(ProfilePage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'xac-minh-danh-tinh',
        element: (
          <ProtectedRoute roles={['CANDIDATE']}>
            {withSuspense(VerificationPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'thong-bao',
        element: (
          <ProtectedRoute>
            {withSuspense(NotificationsPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'tin-nhan',
        element: (
          <ProtectedRoute>
            {withSuspense(MessagesPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'gioi-thieu-thuong',
        element: (
          <ProtectedRoute>
            {withSuspense(ReferralPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'tim-ung-vien',
        element: (
          <ProtectedRoute roles={['EMPLOYER', 'ADMIN']}>
            {withSuspense(CandidateSearchPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: 'dang-tin',
        element: (
          <ProtectedRoute roles={['EMPLOYER', 'ADMIN']}>
            {withSuspense(PostJobPage)}
          </ProtectedRoute>
        ),
      },
      { path: 'dang-nhap', element: withSuspense(LoginPage) },
      { path: 'dang-ky', element: withSuspense(SignupPage) },
      { path: 'quen-mat-khau', element: withSuspense(ForgotPasswordPage) },
      { path: 'dat-lai-mat-khau', element: withSuspense(ResetPasswordPage) },
      { path: 'xac-thuc-email/:token', element: withSuspense(VerifyEmailPage) },
      { path: 'gui-lai-xac-thuc-email', element: withSuspense(ResendVerificationPage) },
      { path: 'chinh-sach-bao-mat', element: withSuspense(PrivacyPolicyPage) },
      { path: 'privacy-policy', element: withSuspense(PrivacyPolicyPage) },
      { path: 'test-avatar', element: withSuspense(TestAvatarPage) },
      { path: 'test-qr', element: withSuspense(TestQRPage) },
      { path: 'debug-auth', element: withSuspense(DebugAuthPage) },
      { path: 'debug-verification', element: withSuspense(DebugVerificationPage) },
      { path: 'xac-thuc-sau-dang-ky', element: withSuspense(PostRegisterVerificationPage) },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['ADMIN']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="users" replace /> },
      { path: 'users', element: withSuspense(AdminUsersPage) },
      { path: 'candidates', element: withSuspense(AdminCandidatesPage) },
      { path: 'employers', element: withSuspense(AdminEmployersPage) },
      { path: 'jobs', element: withSuspense(AdminJobsPage) },
      { path: 'reviews', element: withSuspense(AdminReviewsPage) },
      { path: 'verifications', element: withSuspense(AdminVerificationsPage) },
      { path: 'reports', element: withSuspense(AdminReportsPage) },
      { path: 'audit-logs', element: withSuspense(AdminAuditLogsPage) },
      { path: 'monitoring', element: withSuspense(MonitoringPage) },
    ],
  },
  {
    path: '/nha-tuyen-dung',
    element: (
      <ProtectedRoute roles={['EMPLOYER', 'ADMIN']}>
        <EmployerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="tin-dang" replace /> },
      { path: 'tin-dang', element: withSuspense(EmployerJobsPage) },
      { path: 'phong-van', element: withSuspense(EmployerInterviewsPage) },
      { path: 'goi-dich-vu', element: withSuspense(EmployerPackagesPage) },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },

  // OAuth callback — standalone (no layout)
  { path: '/facebook-callback', element: withSuspense(FacebookCallbackPage) },
  { path: '/facebook-success', element: withSuspense(FacebookSuccessPage) },
  { path: '/google-callback', element: withSuspense(GoogleCallbackPage) },
];
