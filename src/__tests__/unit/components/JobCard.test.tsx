import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import JobCard from '@/components/JobCard';
import type { JobCardProps } from '@/lib/types';

// Mock next/link to render a plain anchor
jest.mock('next/link', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('a', { href, ...props }, children),
  };
});

const baseProps: JobCardProps = {
  id: '1',
  title: 'Nhân viên phục vụ sự kiện',
  employerName: 'Công ty ABC',
  employerVerified: true,
  location: 'Hải Châu, Đà Nẵng',
  workDate: '2025-01-15',
  startTime: '08:00',
  endTime: '17:00',
  hourlyWage: 50000,
  positionsAvailable: 5,
  slug: 'nhan-vien-phuc-vu-su-kien',
};

describe('JobCard', () => {
  it('renders all required fields', () => {
    render(<JobCard {...baseProps} />);

    expect(screen.getByText('Nhân viên phục vụ sự kiện')).toBeInTheDocument();
    expect(screen.getByText('Công ty ABC')).toBeInTheDocument();
    expect(screen.getByText('Hải Châu, Đà Nẵng')).toBeInTheDocument();
    expect(screen.getByText('08:00 - 17:00')).toBeInTheDocument();
    expect(screen.getByText('5 vị trí')).toBeInTheDocument();
    // Vietnamese locale uses '.' as thousands separator
    expect(screen.getByText(/50[.,]000đ\/giờ/)).toBeInTheDocument();
  });

  it('links to the correct job detail page', () => {
    render(<JobCard {...baseProps} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/viec-lam/nhan-vien-phuc-vu-su-kien');
  });

  it('shows verified badge when employer is verified', () => {
    render(<JobCard {...baseProps} employerVerified={true} />);

    expect(screen.getByLabelText('Nhà tuyển dụng đã xác minh')).toBeInTheDocument();
  });

  it('hides verified badge when employer is not verified', () => {
    render(<JobCard {...baseProps} employerVerified={false} />);

    expect(screen.queryByLabelText('Nhà tuyển dụng đã xác minh')).not.toBeInTheDocument();
  });

  it('formats work date in Vietnamese-friendly format', () => {
    // 2025-01-15 is a Wednesday (T4)
    render(<JobCard {...baseProps} workDate="2025-01-15" />);

    expect(screen.getByText('T4, 15/01/2025')).toBeInTheDocument();
  });

  it('formats hourly wage in VND', () => {
    render(<JobCard {...baseProps} hourlyWage={35000} />);

    // Vietnamese locale uses '.' as thousands separator
    expect(screen.getByText(/35[.,]000đ\/giờ/)).toBeInTheDocument();
  });
});
