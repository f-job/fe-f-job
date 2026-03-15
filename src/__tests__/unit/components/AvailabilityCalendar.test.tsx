/**
 * Unit tests for AvailabilityCalendar component.
 * Tests rendering, form interactions, and slot display.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvailabilityCalendar from '@/app/(authenticated)/lich-ranh/AvailabilityCalendar';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  jest.clearAllMocks();
  // Default: return empty slots
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ slots: [] }),
  });
});

describe('AvailabilityCalendar', () => {
  it('renders the add slot form', async () => {
    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Thêm lịch rảnh' })).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Ngày')).toBeInTheDocument();
    expect(screen.getByLabelText('Giờ bắt đầu')).toBeInTheDocument();
    expect(screen.getByLabelText('Giờ kết thúc')).toBeInTheDocument();
    expect(screen.getByText('Lặp lại hàng tuần')).toBeInTheDocument();
  });

  it('renders week navigation controls', async () => {
    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByText('← Tuần trước')).toBeInTheDocument();
    });

    expect(screen.getByText('Tuần sau →')).toBeInTheDocument();
    expect(screen.getByText('Hôm nay')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<AvailabilityCalendar />);
    expect(screen.getByText('Đang tải lịch rảnh...')).toBeInTheDocument();
  });

  it('shows error when fetch fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Lỗi kết nối' }),
    });

    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối')).toBeInTheDocument();
    });
  });

  it('displays slots on the calendar', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        slots: [
          {
            id: 'slot-1',
            date: getNextMondayStr(),
            start_time: '09:00',
            end_time: '17:00',
            is_recurring: false,
            recurrence_pattern: null,
          },
        ],
      }),
    });

    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
    });
  });

  it('shows recurring indicator for recurring slots', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        slots: [
          {
            id: 'slot-1',
            date: getNextMondayStr(),
            start_time: '10:00',
            end_time: '14:00',
            is_recurring: true,
            recurrence_pattern: 'weekly',
          },
        ],
      }),
    });

    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByText('10:00 - 14:00')).toBeInTheDocument();
      expect(screen.getByText(/Hàng tuần/)).toBeInTheDocument();
    });
  });

  it('shows form validation error when fields are empty', async () => {
    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Thêm lịch rảnh' })).toBeInTheDocument();
    });

    // Click submit without filling form
    const submitButton = screen.getByRole('button', { name: /^Thêm lịch rảnh$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập đầy đủ thông tin.')).toBeInTheDocument();
    });
  });

  it('submits form and refreshes slots', async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ success: true, slot: { id: 'new-slot' } }),
        };
      }
      // GET calls
      callCount++;
      if (callCount <= 1) {
        return { ok: true, json: async () => ({ slots: [] }) };
      }
      return {
        ok: true,
        json: async () => ({
          slots: [
            {
              id: 'new-slot',
              date: '2025-06-20',
              start_time: '09:00',
              end_time: '12:00',
              is_recurring: false,
              recurrence_pattern: null,
            },
          ],
        }),
      };
    });

    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByLabelText('Ngày')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText('Ngày'), { target: { value: '2025-06-20' } });
    fireEvent.change(screen.getByLabelText('Giờ bắt đầu'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Giờ kết thúc'), { target: { value: '12:00' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /Thêm lịch rảnh/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/profile/availability', expect.objectContaining({
        method: 'POST',
      }));
    });
  });

  it('navigates to next and previous weeks', async () => {
    render(<AvailabilityCalendar />);

    await waitFor(() => {
      expect(screen.getByText('Tuần sau →')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Tuần sau →');
    const prevButton = screen.getByText('← Tuần trước');

    fireEvent.click(nextButton);
    fireEvent.click(prevButton);

    // Just verify buttons are clickable without errors
    expect(nextButton).toBeInTheDocument();
    expect(prevButton).toBeInTheDocument();
  });
});

// Helper to get next Monday's date string
function getNextMondayStr(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().split('T')[0];
}
