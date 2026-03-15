import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import ProfileForm from './ProfileForm';
import VerificationSection from './VerificationSection';
import ReviewList from '@/components/ReviewList';

export const metadata: Metadata = {
  title: 'Hồ sơ của tôi - F-Job',
  description: 'Quản lý hồ sơ cá nhân, kỹ năng và điểm uy tín trên F-Job.',
  openGraph: {
    title: 'Hồ sơ của tôi - F-Job',
    description: 'Quản lý hồ sơ cá nhân, kỹ năng và điểm uy tín trên F-Job.',
  },
};

export default async function WorkerProfilePage() {
  const session = await getSession();
  const userType = session?.userType ?? 'job_seeker';
  const userId = session?.userId ?? '';

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Hồ sơ của tôi</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">
        Quản lý thông tin cá nhân, kỹ năng và xem điểm uy tín
      </p>
      <div className="mb-6">
        <VerificationSection userType={userType} />
      </div>
      <ProfileForm />
      {userId && (
        <div className="mt-6">
          <ReviewList userId={userId} />
        </div>
      )}
    </main>
  );
}
