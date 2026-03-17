'use client';

import { useState } from 'react';

const LOCATIONS = [
  'Ngẫu Nhiên',
  'Hải Châu',
  'Thanh Khê',
  'Sơn Trà',
  'Ngũ Hành Sơn',
  'Liên Chiểu',
  'Cẩm Lệ',
  'Hòa Vang',
];

export default function LocationTabs() {
  const [active, setActive] = useState('Ngẫu Nhiên');

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-gray-500">Lọc theo:</span>
      {LOCATIONS.map((loc) => (
        <button
          key={loc}
          onClick={() => setActive(loc)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === loc
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-primary-50 hover:text-primary-600'
          }`}
        >
          {loc}
        </button>
      ))}
    </div>
  );
}
