// src/app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Định nghĩa kiểu dữ liệu cho Review dựa trên Database
interface Review {
  id: string;
  author_name: string;
  rating: number;
  content: string;
  status: 'Pending' | 'Resolved';
  ai_responses: {
    standard?: string;
    friendly?: string;
    troubleshooting?: string;
  } | null;
}

export default function Dashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'Pending' | 'Resolved'>('Pending');
  const [placeId, setPlaceId] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(false);

  // 1. Hàm lấy dữ liệu từ Supabase về
  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Lỗi lấy dữ liệu:', error);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // 2. Luồng giả lập Fetch dữ liệu Google Maps (Né đá ngầm theo chiến lược MVP)
  const handleFetchGoogleMaps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeId.trim()) return;

    setIsFetching(true);
    // Giả lập loading 1.5 giây giống như đang cào dữ liệu thật từ Google API
    setTimeout(async () => {
      setIsFetching(false);
      setPlaceId('');
      alert('Đã đồng bộ thành công 5 review mới nhất từ Google Maps (Dữ liệu mẫu)!');
      fetchReviews(); // Re-load lại data
    }, 1500);
  };

  // Lọc danh sách hiển thị theo Tab (Pending / Resolved)
  const filteredReviews = reviews.filter(r => r.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight flex items-center gap-2">
            ✨ UCOrm <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">AI PoC</span>
          </h1>
          <div className="text-sm text-slate-500">Product by UCTalent Labs</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Section 1: Ô nhập Place ID (Epic 1) */}
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

        {/* Section 2: Bộ lọc Tabs trạng thái */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('Pending')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'Pending'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Chưa xử lý ({reviews.filter(r => r.status === 'Pending').length})
          </button>
          <button
            onClick={() => setActiveTab('Resolved')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'Resolved'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Đã xử lý ({reviews.filter(r => r.status === 'Resolved').length})
          </button>
        </div>

        {/* Section 3: Danh sách hiển thị Review */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Đang tải dữ liệu từ Supabase...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-150 text-slate-400 text-sm">
            Không có đánh giá nào trong danh mục này.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
                {/* Header card review */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-slate-900 text-sm mr-3">{review.author_name}</span>
                    <span className="text-amber-500 font-medium text-sm">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    review.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                  }`}>
                    {review.status}
                  </span>
                </div>

                {/* Nội dung Review */}
                <p className="text-slate-600 text-sm leading-relaxed mb-4">{review.content}</p>

                {/* Khu vực xử lý AI (Chuẩn bị sẵn layout cho Ngày 2) */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  {!review.ai_responses && review.status === 'Pending' && (
                    <div className="flex justify-end">
                      <button className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
                        ✨ Generate AI Reply
                      </button>
                    </div>
                  )}

                  {/* Khi đã có data AI sinh ra (Sẽ làm ở ngày tiếp theo) */}
                  {review.ai_responses && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-500">AI Gợi ý phản hồi:</p>
                      {/* Giao diện 3 Block option sẽ hiển thị ở đây */}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}