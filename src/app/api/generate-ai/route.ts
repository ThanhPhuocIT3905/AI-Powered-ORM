// src/app/api/generate-ai/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

// Khởi tạo Gemini Client với API Key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// 2. Khởi tạo Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Zod Schema dùng để validate dữ liệu ở tầng phòng ngự của Backend (Giữ nguyên contract)
const AIResponseSchema = z.object({
  standard: z.string(),
  friendly: z.string(),
  troubleshooting: z.string()
});

export async function POST(request: Request) {
  try {
    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Thiếu review ID' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Thiếu GEMINI_API_KEY trong cấu hình hệ thống' }, { status: 500 });
    }

    // Lấy thông tin review từ Supabase
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (reviewError || !reviewData) {
      console.error('Lỗi khi lấy thông tin review:', reviewError);
      return NextResponse.json({ error: 'Không tìm thấy thông tin review' }, { status: 404 });
    }

    // Định nghĩa Schema dạng Structured Outputs theo quy ước của SDK Gemini
    const geminiResponseSchema = {
      type: Type.OBJECT,
      properties: {
        standard: {
          type: Type.STRING,
          description: "Phản hồi chuyên nghiệp, lịch sự, trung tính bằng tiếng Việt."
        },
        friendly: {
          type: Type.STRING,
          description: "Phản hồi thân thiện, gần gũi, sử dụng ngôn từ ấm áp bằng tiếng Việt."
        },
        troubleshooting: {
          type: Type.STRING,
          description: "Phản hồi tập trung xin lỗi, nhận trách nhiệm và đưa ra hướng giải quyết cụ thể nếu khách phàn nàn bằng tiếng Việt."
        }
      },
      required: ["standard", "friendly", "troubleshooting"],
    };

    // Gọi Gemini API sinh phản hồi có cấu trúc (Structured Outputs) 
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Sử dụng model flash thế hệ mới: siêu tốc (< 2 giây) và tối ưu JSON
      contents: `Dựa trên đánh giá ${reviewData.rating} sao sau đây của khách hàng tên là "${reviewData.author_name}", hãy tạo ra 3 phương án phản hồi tương ứng bằng tiếng Việt.\n\nNội dung review: "${reviewData.content}"`,
      config: {
        systemInstruction: 'Bạn là một chuyên gia quản trị danh tiếng (ORM) và chăm sóc khách hàng chuyên nghiệp cho khách sạn/doanh nghiệp.',
        temperature: 0.7,
        // Ép Gemini trả về đúng định dạng JSON khớp với cấu trúc Schema
        responseMimeType: 'application/json',
        responseSchema: geminiResponseSchema,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      return NextResponse.json({ error: 'Không nhận được văn bản từ Gemini' }, { status: 500 });
    }

    let finalJsonData;
    try {
      finalJsonData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Lỗi parse chuỗi Gemini sang JSON Object:", responseText);
      return NextResponse.json({ error: 'Dữ liệu AI trả về không phải JSON hợp lệ' }, { status: 500 });
    }

    // Parse chuỗi JSON nhận từ Gemini và bọc qua Zod để đảm bảo tuyệt đối an toàn dữ liệu
    const aiResponses = AIResponseSchema.parse(JSON.parse(responseText));

    // Cập nhật vào Supabase (Giữ nguyên logic cập nhật song song trạng thái sang Resolved) [cite: 25]
    const { error: updateError } = await supabase
      .from('reviews')
      .update({ 
        ai_responses: aiResponses, // Cấu trúc lưu trữ JSON hoàn toàn không đổi
        status: 'Resolved' 
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Lỗi khi cập nhật vào Supabase:', updateError);
      return NextResponse.json({ error: 'Lỗi đồng bộ dữ liệu AI vào Hệ thống' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Đã tạo phản hồi bằng Gemini và đồng bộ hệ thống thành công!', 
      data: aiResponses
    }, { status: 200 });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      console.error('Zod validate JSON lỗi:', error.issues);
      return NextResponse.json({ error: 'Dữ liệu cấu trúc từ Gemini trả về bị sai Schema' }, { status: 500 });
    }

    const message = error instanceof Error ? error.message : 'Lỗi không xác định';
    console.error('Lỗi hệ thống khi xử lý Gemini:', error);
    return NextResponse.json({ error: `Lỗi khi tạo phản hồi AI: ${message}` }, { status: 500 });
  }
}