// src/app/api/places/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { placeId } = await request.json();

    if (!placeId) {
      return NextResponse.json({ error: 'Thiếu Place ID' }, { status: 400 });
    }

    const apiKey = process.env.SERPAPI_KEY;

    // Gọi sang SerpApi để lấy review từ Google Maps dựa trên Place ID (hoặc mã data_id)
    const serpApiUrl = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=${placeId}&api_key=${apiKey}&hl=vi`;

    const response = await fetch(serpApiUrl);
    const data = await response.json();

    // SerpApi trả về mảng reviews nằm trong trường 'reviews'
    if (!response.ok || !data.reviews || data.reviews.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy review nào từ SerpApi' }, { status: 404 });
    }

    // Lấy 5 review mới nhất theo tiêu chí nghiệm thu của PRD [cite: 21]
    const top5Reviews = data.reviews.slice(0, 5);

    // Định dạng lại dữ liệu chuẩn để đưa vào bảng Supabase
    const reviewsToInsert = top5Reviews.map((rev: any) => ({
      place_id: placeId,
      author_name: rev.user?.name || 'Ẩn danh',
      rating: Math.round(rev.rating), // Đảm bảo rating là số nguyên từ 1-5
      content: rev.snippet || 'Không có nội dung văn bản.',
      status: 'Pending',
    }));

    // Lưu vào Supabase
    const { error: dbError } = await supabase
      .from('reviews')
      .insert(reviewsToInsert);

    if (dbError) {
      return NextResponse.json({ error: `Lỗi lưu DB: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Đã lấy dữ liệu thực qua SerpApi thành công!' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}