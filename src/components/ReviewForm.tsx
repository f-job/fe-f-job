'use client';

import { useState } from 'react';

interface ReviewFormProps {
  applicationId: string;
  revieweeId: string;
  reviewType: 'employer_to_seeker' | 'seeker_to_employer';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RATING_CATEGORIES = [
  { key: 'punctualityRating', label: 'Đúng giờ' },
  { key: 'attitudeRating', label: 'Thái độ' },
  { key: 'skillsRating', label: 'Kỹ năng' },
  { key: 'overallRating', label: 'Tổng thể' },
] as const;

type RatingKey = (typeof RATING_CATEGORIES)[number]['key'];

export default function ReviewForm({
  applicationId,
  revieweeId,
  reviewType,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    punctualityRating: 0,
    attitudeRating: 0,
    skillsRating: 0,
    overallRating: 0,
  });
  const [hoveredStars, setHoveredStars] = useState<Record<RatingKey, number>>({
    punctualityRating: 0,
    attitudeRating: 0,
    skillsRating: 0,
    overallRating: 0,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleStarClick(category: RatingKey, star: number) {
    setRatings((prev) => ({ ...prev, [category]: star }));
  }

  function handleStarHover(category: RatingKey, star: number) {
    setHoveredStars((prev) => ({ ...prev, [category]: star }));
  }

  function handleStarLeave(category: RatingKey) {
    setHoveredStars((prev) => ({ ...prev, [category]: 0 }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation
    const allRated = RATING_CATEGORIES.every(({ key }) => ratings[key] >= 1 && ratings[key] <= 5);
    if (!allRated) {
      setError('Vui lòng đánh giá tất cả các mục (1-5 sao).');
      return;
    }

    if (comment.length > 500) {
      setError('Nhận xét không được quá 500 ký tự.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          revieweeId,
          reviewType,
          ...ratings,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Không thể gửi đánh giá.');
        return;
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-green-700 font-medium">Đánh giá đã được gửi thành công!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">Đánh giá</h3>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="space-y-4">
        {RATING_CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex gap-1" role="radiogroup" aria-label={`Đánh giá ${label}`}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = hoveredStars[key] > 0 ? star <= hoveredStars[key] : star <= ratings[key];
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(key, star)}
                    onMouseEnter={() => handleStarHover(key, star)}
                    onMouseLeave={() => handleStarLeave(key)}
                    className={`text-2xl transition-colors ${
                      active ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400`}
                    aria-label={`${star} sao`}
                    role="radio"
                    aria-checked={ratings[key] === star}
                  >
                    ★
                  </button>
                );
              })}
              <span className="ml-2 self-center text-sm text-gray-500">
                {ratings[key] > 0 ? `${ratings[key]}/5` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className="mb-1 block text-sm font-medium text-gray-700">
          Nhận xét (tùy chọn)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Chia sẻ trải nghiệm của bạn..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">{comment.length}/500 ký tự</p>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </div>
    </form>
  );
}
