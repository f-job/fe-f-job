'use client';

import { useState, useEffect } from 'react';

interface BookmarkButtonProps {
  jobSeekerId: string;
}

/**
 * Bookmark/unbookmark button for employers to save job seeker profiles.
 * Checks initial favorite status on mount and toggles on click.
 */
export default function BookmarkButton({ jobSeekerId }: BookmarkButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkFavoriteStatus() {
      try {
        const res = await fetch('/api/favorites');
        if (!res.ok) return;
        const data = await res.json();
        const favs: { jobSeekerId: string }[] = data.favorites ?? [];
        if (!cancelled) {
          setIsFavorited(favs.some((f) => f.jobSeekerId === jobSeekerId));
          setInitialized(true);
        }
      } catch {
        // Silently fail — button will default to unfavorited
        if (!cancelled) setInitialized(true);
      }
    }

    checkFavoriteStatus();
    return () => {
      cancelled = true;
    };
  }, [jobSeekerId]);

  async function handleToggle() {
    setLoading(true);
    try {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?jobSeekerId=${jobSeekerId}`, {
          method: 'DELETE',
        });
        if (res.ok) setIsFavorited(false);
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobSeekerId }),
        });
        if (res.ok) setIsFavorited(true);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  if (!initialized) {
    return (
      <button
        disabled
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-300 cursor-not-allowed"
        aria-label="Đang tải trạng thái yêu thích"
      >
        🤍
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1.5 text-sm border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorited
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
      }`}
      aria-label={isFavorited ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
      title={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
    >
      {loading ? '...' : isFavorited ? '❤️' : '🤍'}
    </button>
  );
}
