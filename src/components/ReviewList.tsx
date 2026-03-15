'use client';

import { useState, useEffect } from 'react';

interface Review {
  id: string;
  applicationId: string;
  reviewerId: string;
  revieweeId: string;
  punctualityRating: number;
  attitudeRating: number;
  skillsRating: number;
  overallRating: number;
  comment: string | null;
  reviewType: 'employer_to_seeker' | 'seeker_to_employer';
  createdAt: string;
}

interface ReviewListProps {
  userId: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewList({ userId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [userId]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews?userId=${userId}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews ?? []);
        setAverageRating(data.averageRating ?? 0);
        setReviewCount(data.reviewCount ?? 0);
      } else {
        setError(data.message || 'Không thể tải đánh giá.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="py-4 text-sm text-gray-500">Đang tải đánh giá...</div>;
  }

  if (error) {
    return <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Đánh giá</h2>
        <div className="flex items-center gap-2">
          {reviewCount > 0 ? (
            <>
              <span className="text-xl font-bold text-gray-900">{averageRating}</span>
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-sm text-gray-500">({reviewCount} đánh giá)</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Chưa có đánh giá</span>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={review.overallRating} />
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
                <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                  {review.reviewType === 'employer_to_seeker'
                    ? 'Từ nhà tuyển dụng'
                    : 'Từ người tìm việc'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-gray-600">
                <div>
                  Đúng giờ: <StarRating rating={review.punctualityRating} />
                </div>
                <div>
                  Thái độ: <StarRating rating={review.attitudeRating} />
                </div>
                <div>
                  Kỹ năng: <StarRating rating={review.skillsRating} />
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-gray-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
