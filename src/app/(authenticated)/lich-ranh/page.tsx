import type { Metadata } from 'next';
import AvailabilityCalendar from './AvailabilityCalendar';

export const metadata: Metadata = {
  title: 'Lịch rảnh - F-Job',
  description: 'Quản lý lịch rảnh để nhận gợi ý việc làm phù hợp.',
  openGraph: {
    title: 'Lịch rảnh - F-Job',
    description: 'Quản lý lịch rảnh để nhận gợi ý việc làm phù hợp.',
  },
};

export default function AvailabilityCalendarPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Lịch rảnh</h1>
      <p className="mt-1 mb-6 text-sm text-gray-600">
        Đánh dấu thời gian bạn có thể làm việc để nhận gợi ý việc phù hợp
      </p>
      <AvailabilityCalendar />
    </main>
  );
}
