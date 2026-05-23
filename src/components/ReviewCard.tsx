'use client';
import { useState } from 'react';

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

interface ReviewCardProps {
  review: Review;
  onStatusChange: () => void;
}

export default function ReviewCard({ review, onStatusChange }: ReviewCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewId: review.id }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(`Thất bại: ${result?.error || 'Không thể tạo phản hồi AI'}`);
        return;
      }

      onStatusChange();
    } catch (error) {
      console.error('Lỗi khi gọi API Generate AI:', error);
      alert('Đã xảy ra lỗi khi gọi AI.');
    } finally {
      setIsGenerating(false);
    }
};

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
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

      <p className="text-slate-600 text-sm leading-relaxed mb-4">{review.content}</p>

      <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
        {!review.ai_responses && review.status === 'Pending' && (
          <div className="flex justify-end">
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  AI đang viết...
                </>
              ) : '✨ Generate AI Reply'}
            </button>
          </div>
        )}

        {review.ai_responses && (
          <div className="space-y-3 mt-2">
            <p className="text-xs font-semibold text-slate-500">AI Gợi ý phản hồi:</p>
            
            {(() => {
              // Logic phòng ngự: Nếu ai_responses bị lưu nhầm thành dạng chuỗi String, ta tự parse sang Object
              let responses = review.ai_responses;
              if (typeof responses === 'string') {
                try {
                  responses = JSON.parse(responses);
                } catch (e) {
                  return <p className="text-xs text-red-500">Dữ liệu AI bị lỗi định dạng không thể hiển thị.</p>;
                }
              }

              // Nếu parse xong hoặc data chuẩn Object rồi thì render ra giao diện [cite: 23]
              return (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Tiêu chuẩn</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{responses?.standard || 'Đang cập nhật...'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Thân thiện</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{responses?.friendly || 'Đang cập nhật...'}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Khắc phục lỗi</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{responses?.troubleshooting || 'Đang cập nhật...'}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}