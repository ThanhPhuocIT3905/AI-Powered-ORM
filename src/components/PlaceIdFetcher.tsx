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

    try {
      // Gọi trực tiếp đến API Route SerpApi vừa viết
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId: placeId.trim() }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Đồng bộ thành công 5 review thật từ Google Maps vào Database! ');
        onFetchSuccess(); // Re-fetch lại danh sách ở component cha để hiển thị lên màn hình [cite: 25]
        setPlaceId('');
      } else {
        alert(`Thất bại: ${result.error || 'Vui lòng kiểm tra lại Place ID hoặc API Key'}`);
      }
    } catch (error) {
      console.error('Lỗi kết nối API:', error);
      alert('Đã xảy ra lỗi kết nối hệ thống.');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Kết nối địa điểm Google Maps</h2>
      <form onSubmit={handleFetchGoogleMaps} className="flex gap-3">
        <input
          type="text"
          placeholder="Nhập SerpApi data_id (Ví dụ: 0x3142183eef55b4bb:0x1121d102f1d2a1e9)..."
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