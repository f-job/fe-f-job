import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập - F-Job',
  description: 'Đăng nhập vào tài khoản F-Job của bạn.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
