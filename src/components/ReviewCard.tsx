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
  selected_reply?: string | null;
}

interface ReviewCardProps {
  review: Review;
  onStatusChange: () => void;
}

export default function ReviewCard({ review, onStatusChange }: ReviewCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [selectedOption, setSelectedOption] = useState<'standard' | 'friendly' | 'troubleshooting' | null>(null);

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
      if(response.ok) onStatusChange(); // Re-fetch lại danh sách ở component cha để hiển thị lên màn hình
    } catch (error) {
      console.error('Lỗi khi gọi API Generate AI:', error);
      alert('Đã xảy ra lỗi khi gọi AI.');
    } finally {
      setIsGenerating(false);
    }
  };

    // Logic xử lý khi chọn Approve câu trả lời
    const handleApprove = async () => {
      if(!selectedOption || !review.ai_responses) return;

      // Lấy nội dung phản hồi đã chọn
      const approvedContent = review.ai_responses[selectedOption];

      setIsApproving(true);
      try {
        const response = await fetch('/api/approve-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reviewId: review.id, selectedReply: approvedContent }),
        });
        if(response.ok) {
          alert('Phản hồi đã được duyệt thành công!');
          onStatusChange(); // Re-fetch lại danh sách ở component cha để hiển thị lên
        } else {
          alert('Duyệt phản hồi thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        console.error('Lỗi khi gọi API Approve Reply:', error);
        alert('Đã xảy ra lỗi khi duyệt phản hồi.');
      } finally {
        setIsApproving(false);
      }
    };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
      {/* Header & Content Card giữ nguyên */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="font-semibold text-slate-900 text-sm mr-3">{review.author_name}</span>
          <span className="text-amber-500 font-medium text-sm">{'★'.repeat(review.rating)}</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
          review.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
        }`}>
          {review.status}
        </span>
      </div>
      <p className="text-slate-600 text-sm leading-relaxed mb-4">{review.content}</p>

      {/* Khu vực xử lý AI & Approve */}
      <div className="border-t border-slate-100 pt-4">
        {/* Nút bấm sinh AI ban đầu nếu chưa có data */}
        {!review.ai_responses && review.status === 'Pending' && (
          <div className="flex justify-end">
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'AI đang viết...' : '✨ Generate AI Reply'}
            </button>
          </div>
        )}

        {/* TRẠNG THÁI 1: Nếu review đang ở PENDING và ĐÃ CÓ gợi ý AI -> Cho chọn và Approve */}
        {review.ai_responses && review.status === 'Pending' && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500">Click chọn 1 trong 3 phương án để duyệt:</p>
            
            {/* Option 1: Tiêu chuẩn */}
            <div 
              onClick={() => setSelectedOption('standard')}
              className={`rounded-lg border p-3 cursor-pointer transition-all ${
                selectedOption === 'standard' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <p className="text-xs font-semibold text-slate-700 mb-1">📋 Tiêu chuẩn</p>
              <p className="text-sm text-slate-600">{review.ai_responses.standard}</p>
            </div>

            {/* Option 2: Thân thiện */}
            <div 
              onClick={() => setSelectedOption('friendly')}
              className={`rounded-lg border p-3 cursor-pointer transition-all ${
                selectedOption === 'friendly' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <p className="text-xs font-semibold text-slate-700 mb-1">❤️ Thân thiện</p>
              <p className="text-sm text-slate-600">{review.ai_responses.friendly}</p>
            </div>

            {/* Option 3: Khắc phục lỗi */}
            <div 
              onClick={() => setSelectedOption('troubleshooting')}
              className={`rounded-lg border p-3 cursor-pointer transition-all ${
                selectedOption === 'troubleshooting' ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <p className="text-xs font-semibold text-slate-700 mb-1">🛠️ Khắc phục lỗi</p>
              <p className="text-sm text-slate-600">{review.ai_responses.troubleshooting}</p>
            </div>

            {/* Nút hành động Approve */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleApprove}
                disabled={!selectedOption || isApproving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isApproving ? 'Sử dụng...' : '✅ Approve Response'}
              </button>
            </div>
          </div>
        )}

        {/* TRẠNG THÁI 2: Nếu review đã ở RESOLVED -> Chỉ hiển thị câu trả lời cuối cùng được duyệt */}
        {review.status === 'Resolved' && (
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-4 mt-1">
            <p className="text-xs font-bold text-emerald-700 mb-1.5 flex items-center gap-1">
              💬 Câu trả lời đã duyệt chính thức:
            </p>
            <p className="text-sm text-slate-700 italic leading-relaxed">
              "{review.selected_reply || review.ai_responses?.standard}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}