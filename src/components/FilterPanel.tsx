'use client';

import { useState, useCallback } from 'react';
import type { FilterState } from '@/lib/types';

const DA_NANG_DISTRICTS = [
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
  'Hòa Vang',
];

const JOB_CATEGORIES = [
  'Phục vụ sự kiện',
  'Nhà hàng/Khách sạn',
  'Bán hàng',
  'Truyền thông',
  'Hành chính',
  'Kho vận',
  'Khác',
];

const SALARY_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'Dưới 30,000đ/giờ', min: 0, max: 29999 },
  { label: '30,000-50,000đ/giờ', min: 30000, max: 50000 },
  { label: '50,000-80,000đ/giờ', min: 50000, max: 80000 },
  { label: 'Trên 80,000đ/giờ', min: 80001, max: 999999999 },
];

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  matchingCount: number;
}

export default function FilterPanel({ filters, onFilterChange, matchingCount }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = useCallback(
    (partial: Partial<FilterState>) => {
      onFilterChange({ ...filters, ...partial });
    },
    [filters, onFilterChange],
  );

  const clearFilters = useCallback(() => {
    onFilterChange({
      location: null,
      jobCategory: null,
      salaryRange: null,
      workDate: null,
      keyword: '',
    });
  }, [onFilterChange]);

  const hasActiveFilters =
    filters.location !== null ||
    filters.jobCategory !== null ||
    filters.salaryRange !== null ||
    filters.workDate !== null ||
    filters.keyword.trim() !== '';

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      {/* Keyword search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm kiếm việc làm..."
          value={filters.keyword}
          onChange={(e) => updateFilter({ keyword: e.target.value })}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm
            placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          aria-label="Tìm kiếm việc làm theo từ khóa"
        />
      </div>

      {/* Toggle filters on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-3 flex w-full items-center justify-between text-sm font-medium text-primary-600 sm:hidden"
        aria-expanded={isExpanded}
      >
        <span>Bộ lọc {hasActiveFilters ? '(đang lọc)' : ''}</span>
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter controls */}
      <div className={`mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${isExpanded ? '' : 'hidden sm:grid'}`}>
        {/* Location */}
        <div>
          <label htmlFor="filter-location" className="mb-1 block text-xs font-medium text-gray-600">
            Khu vực
          </label>
          <select
            id="filter-location"
            value={filters.location ?? ''}
            onChange={(e) => updateFilter({ location: e.target.value || null })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Tất cả khu vực</option>
            {DA_NANG_DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Job category */}
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-xs font-medium text-gray-600">
            Loại việc
          </label>
          <select
            id="filter-category"
            value={filters.jobCategory ?? ''}
            onChange={(e) => updateFilter({ jobCategory: e.target.value || null })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Tất cả loại việc</option>
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Salary range */}
        <div>
          <label htmlFor="filter-salary" className="mb-1 block text-xs font-medium text-gray-600">
            Mức lương
          </label>
          <select
            id="filter-salary"
            value={
              filters.salaryRange
                ? `${filters.salaryRange.min}-${filters.salaryRange.max}`
                : ''
            }
            onChange={(e) => {
              if (!e.target.value) {
                updateFilter({ salaryRange: null });
              } else {
                const [min, max] = e.target.value.split('-').map(Number);
                updateFilter({ salaryRange: { min, max } });
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Tất cả mức lương</option>
            {SALARY_RANGES.map((r) => (
              <option key={r.label} value={`${r.min}-${r.max}`}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Work date */}
        <div>
          <label htmlFor="filter-date" className="mb-1 block text-xs font-medium text-gray-600">
            Ngày làm việc
          </label>
          <input
            id="filter-date"
            type="date"
            value={filters.workDate ?? ''}
            onChange={(e) => updateFilter({ workDate: e.target.value || null })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Matching count + clear */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Tìm thấy <span className="font-semibold text-primary-700">{matchingCount}</span> việc làm
        </p>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  );
}
