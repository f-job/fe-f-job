'use client';

import { useCallback, useEffect, useState } from 'react';

interface SlotData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurrence_pattern: 'weekly' | null;
}

const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DAYS_FULL_VI = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
];

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(d: Date): string {
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export default function AvailabilityCalendar() {
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Form state
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile/availability');
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || 'Không thể tải lịch rảnh.');
        return;
      }
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const weekDates = getWeekDates(currentWeekStart);

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formDate || !formStartTime || !formEndTime) {
      setFormError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    if (formStartTime >= formEndTime) {
      setFormError('Giờ bắt đầu phải trước giờ kết thúc.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          startTime: formStartTime,
          endTime: formEndTime,
          isRecurring: formIsRecurring,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.message || 'Không thể thêm lịch rảnh.');
        return;
      }

      // Reset form and refresh
      setFormDate('');
      setFormStartTime('');
      setFormEndTime('');
      setFormIsRecurring(false);
      await fetchSlots();
    } catch {
      setFormError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    // Don't delete auto-generated recurring entries (they have _week suffix)
    if (slotId.includes('_week')) return;

    try {
      const res = await fetch(`/api/profile/availability?id=${slotId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchSlots();
      }
    } catch {
      // Silently fail — user can retry
    }
  };

  const getSlotsForDate = (dateStr: string) =>
    slots.filter((s) => s.date === dateStr);

  return (
    <div className="space-y-6">
      {/* Add Slot Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Thêm lịch rảnh
        </h2>
        <form onSubmit={handleAddSlot} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="slot-date" className="block text-sm font-medium text-gray-700">
                Ngày
              </label>
              <input
                id="slot-date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="slot-start" className="block text-sm font-medium text-gray-700">
                Giờ bắt đầu
              </label>
              <input
                id="slot-start"
                type="time"
                value={formStartTime}
                onChange={(e) => setFormStartTime(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="slot-end" className="block text-sm font-medium text-gray-700">
                Giờ kết thúc
              </label>
              <input
                id="slot-end"
                type="time"
                value={formEndTime}
                onChange={(e) => setFormEndTime(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formIsRecurring}
                  onChange={(e) => setFormIsRecurring(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Lặp lại hàng tuần
              </label>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-600" role="alert">{formError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Đang thêm...' : 'Thêm lịch rảnh'}
          </button>
        </form>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousWeek}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          aria-label="Tuần trước"
        >
          ← Tuần trước
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {formatDisplayDate(weekDates[0])} - {formatDisplayDate(weekDates[6])}
          </span>
          <button
            onClick={goToCurrentWeek}
            className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200"
          >
            Hôm nay
          </button>
        </div>
        <button
          onClick={goToNextWeek}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          aria-label="Tuần sau"
        >
          Tuần sau →
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <p className="text-center text-sm text-gray-500">Đang tải lịch rảnh...</p>
      )}
      {error && (
        <p className="text-center text-sm text-red-600" role="alert">{error}</p>
      )}

      {/* Weekly Calendar Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, idx) => {
            const dateStr = formatDate(date);
            const daySlots = getSlotsForDate(dateStr);
            const dayIndex = (idx + 1) % 7; // Monday=1 ... Sunday=0

            return (
              <div
                key={dateStr}
                className="min-h-[120px] rounded-lg border border-gray-200 bg-white p-2"
              >
                <div className="mb-1 text-center">
                  <div className="text-xs font-medium text-gray-500">
                    {DAYS_VI[dayIndex]}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDisplayDate(date)}
                  </div>
                </div>

                <div className="space-y-1">
                  {daySlots.map((slot) => {
                    const isGenerated = slot.id.includes('_week');
                    return (
                      <div
                        key={slot.id}
                        className={`group relative rounded px-1.5 py-1 text-xs ${
                          slot.is_recurring
                            ? 'bg-green-50 text-green-800 border border-green-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        } ${isGenerated ? 'opacity-70' : ''}`}
                      >
                        <div className="font-medium">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        {slot.is_recurring && (
                          <div className="text-[10px] opacity-75">
                            🔄 {isGenerated ? 'Tự động' : 'Hàng tuần'}
                          </div>
                        )}
                        {!isGenerated && (
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex"
                            aria-label={`Xóa lịch rảnh ${DAYS_FULL_VI[dayIndex]} ${slot.start_time}-${slot.end_time}`}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
