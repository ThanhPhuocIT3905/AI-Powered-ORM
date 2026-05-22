'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PlaceIdFetcher from '../components/PlaceIdFetcher';
import StatusTabs from '../components/StatusTabs';
import ReviewCard from '../components/ReviewCard';

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

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setReviews(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter(r => r.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-indigo-600 tracking-tight flex items-center gap-2">
            ✨ UCOrm <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">AI PoC</span>
          </h1>
          <div className="text-sm text-slate-500">Product by UCTalent Labs</div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Component Nhập mã Địa điểm */}
        <PlaceIdFetcher onFetchSuccess={fetchReviews} />

        {/* Component Bộ lọc trạng thái */}
        <StatusTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          pendingCount={reviews.filter(r => r.status === 'Pending').length}
          resolvedCount={reviews.filter(r => r.status === 'Resolved').length}
        />

        {/* Danh sách Review */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Đang tải dữ liệu từ Supabase...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-150 text-slate-400 text-sm">
            Không có đánh giá nào trong danh mục này.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} onStatusChange={fetchReviews} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}