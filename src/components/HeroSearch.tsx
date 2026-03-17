'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const DA_NANG_DISTRICTS = [
  'Tất cả Đà Nẵng',
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
  'Hòa Vang',
];

export default function HeroSearch() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const router = useRouter();

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (location && location !== 'Tất cả Đà Nẵng') params.set('location', location);
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="mx-auto flex max-w-3xl flex-col gap-2 rounded-xl bg-white p-2 shadow-xl sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5"
    >
      {/* Keyword input */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Vị trí tuyển dụng, tên công ty..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full rounded-lg py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none sm:rounded-full"
          aria-label="Tìm kiếm việc làm"
        />
      </div>

      {/* Divider */}
      <div className="hidden h-6 w-px bg-gray-200 sm:block" />

      {/* Location select */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full appearance-none rounded-lg bg-transparent py-2.5 pl-10 pr-8 text-sm text-gray-700 focus:outline-none sm:w-44 sm:rounded-full"
          aria-label="Chọn khu vực"
        >
          <option value="">Địa điểm</option>
          {DA_NANG_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Search button */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-primary-700 sm:rounded-full"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Tìm kiếm
      </button>
    </form>
  );
}
