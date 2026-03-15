'use client';

import { useState, useEffect } from 'react';

interface CreditScoreHistoryEntry {
  id: string;
  scoreChange: number;
  reason: string;
  reasonLabel: string;
  applicationId: string | null;
  createdAt: string;
}

export default function CreditScoreHistory() {
  const [history, setHistory] = useState<CreditScoreHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      setLoading(true);
      const res = await fetch('/api/credit-score');
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history ?? []);
      } else {
        setError(data.message || 'Không thể tải lịch sử điểm uy tín.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Lịch sử điểm uy tín
        </h2>
        <p className="text-sm text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Lịch sử điểm uy tín
        </h2>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Lịch sử điểm uy tín
      </h2>

      {history.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có thay đổi điểm uy tín nào.</p>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-md border border-gray-100 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {entry.reasonLabel}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  entry.scoreChange > 0
                    ? 'text-green-600'
                    : entry.scoreChange < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {entry.scoreChange > 0 ? '+' : ''}
                {entry.scoreChange}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
