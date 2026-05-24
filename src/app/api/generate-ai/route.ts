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
          description: "Phản hồi chuyên nghiệp, lịch sự, trung tính. Sử dụng chính ngôn ngữ của bài đánh giá."
        },
        friendly: {
          type: Type.STRING,
          description: "Phản hồi thân thiện, gần gũi, sử dụng ngôn từ ấm áp. Sử dụng chính ngôn ngữ của bài đánh giá."
        },
        troubleshooting: {
          type: Type.STRING,
          description: "Phản hồi tập trung xin lỗi, nhận trách nhiệm và đưa ra hướng giải quyết cụ thể nếu khách phàn nàn. Sử dụng chính ngôn ngữ của bài đánh giá."
        }
      },
      required: ["standard", "friendly", "troubleshooting"],
    };

    // Gọi Gemini API sinh phản hồi có cấu trúc (Structured Outputs) 
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Sử dụng model flash thế hệ mới: siêu tốc (< 2 giây) và tối ưu JSON

      // Sửa lại prompt để Gemini có thể tự nhận diện ngôn ngữ và trả về phản hồi bằng đúng ngôn ngữ đó, đồng thời giữ nguyên định dạng JSON đã yêu cầu
      contents: `Hãy phân tích kỹ nội dung và ngôn ngữ của đánh giá ${reviewData.rating} sao này từ khách hàng "${reviewData.author_name}":
  
        Nội dung đánh giá: "${reviewData.content}"
    
        YÊU CẦU BẮT BUỘC: 
        1. Hãy tự động nhận diện xem khách hàng đang viết bằng ngôn ngữ nào (Tiếng Việt, Tiếng Anh, Tiếng Nhật, Tiếng Hàn,...).
        2. Tạo ra 3 phương án phản hồi (standard, friendly, troubleshooting) bằng CHÍNH NGÔN NGỮ ĐÓ của khách hàng. Không được tự ý dịch câu phản hồi sang tiếng Việt nếu khách viết bằng tiếng nước ngoài.`,
        config: {
          // Sửa lại system instruction để định hướng vai trò đa ngôn ngữ cho Gemini
        systemInstruction: 'Bạn là một chuyên gia quản trị danh tiếng (ORM) quốc tế, có khả năng phản hồi khách hàng bằng nhiều ngôn ngữ một cách tự nhiên như người bản xứ. Hãy giữ đúng định dạng JSON được yêu cầu.',
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
        // status: 'Resolved'  //
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