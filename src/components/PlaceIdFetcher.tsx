'use client';
import { useState } from 'react';

interface FetcherProps {
  onFetchSuccess: () => void;
}

export default function PlaceIdFetcher({ onFetchSuccess }: FetcherProps) {
  const [placeId, setPlaceId] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const handleFetchGoogleMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeId.trim()) return;

    setIsFetching(true);
    // Giả lập loading 1.5 giây né đá ngầm API Google Maps [cite: 13]
    setTimeout(() => {
      setIsFetching(false);
      setPlaceId('');
      alert('Đã đồng bộ thành công 5 review mới nhất từ Google Maps (Dữ liệu mẫu)!');
      onFetchSuccess();
    }, 1500);
  };

  return (
    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Kết nối địa điểm Google Maps</h2>
      <form onSubmit={handleFetchGoogleMaps} className="flex gap-3">
        <input
          type="text"
          placeholder="Nhập Google Place ID (Ví dụ: ChIJu0_V8b8ZQjER6X)..."
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          type="submit"
          disabled={isFetching}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isFetching ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Fetching...
            </>
          ) : 'Fetch Reviews'}
        </button>
      </form>
    </section>
  );
}