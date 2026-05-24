// src/app/api/reviews/approve/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { reviewId, selectedReply } = await request.json();

    if (!reviewId || !selectedReply) {
      return NextResponse.json({ error: 'Thiếu dữ liệu duyệt' }, { status: 400 });
    }

    // Cập nhật trạng thái thành Resolved và lưu câu trả lời được chọn vào cột selected_reply
    const { error } = await supabase
      .from('reviews')
      .update({
        status: 'Resolved',
        selected_reply: selectedReply // Lưu câu trả lời được chọn
      })
      .eq('id', reviewId);

    if (error) {
      console.error('Lỗi khi cập nhật trạng thái Approve:', error);
      return NextResponse.json({ error: 'Không thể cập nhật trạng thái duyệt' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Duyệt câu trả lời thành công!' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}