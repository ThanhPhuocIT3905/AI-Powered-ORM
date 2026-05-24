# [cite_start]UCOrm - AI-Powered Customer Review Management Dashboard (MVP 0) [cite: 2, 3]

[cite_start]Dự án thử nghiệm nhanh (Proof of Concept) để đánh giá khả năng tích hợp Full-stack và AI[cite: 3]. [cite_start]Do trùng lịch thi học phần nên mình đã chủ động rút gọn thời gian triển khai từ 7 ngày xuống còn 4 ngày nước rút mà vẫn đảm bảo sản phẩm chạy thực tế mượt mà[cite: 9, 12].

---

## 📅 Nhật ký làm dự án

### 🚀 [Ngày 1 — 22/05/2026]

#### 1. Việc đã làm được
- [cite_start]**Setup dự án:** Khởi tạo Next.js, Tailwind CSS và đẩy lên GitHub để tính commit ngày đầu tiên[cite: 8, 16].
- [cite_start]**Lên Database (Supabase):** Tạo bảng `reviews`[cite: 17]. [cite_start]Thiết kế cột `ai_responses` dạng `JSONB` để lưu thẳng 3 câu trả lời của AI vào cùng một dòng cho gọn, không cần tạo bảng phụ[cite: 23].
- [cite_start]**Bơm dữ liệu mẫu:** Tạo sẵn 5 câu review (cả tiếng Anh và tiếng Việt) bằng Table Editor của Supabase để có data test luồng[cite: 13, 21].
- [cite_start]**Làm UI Dashboard:** Gom mọi thứ vào 1 màn hình duy nhất[cite: 4, 25]. [cite_start]Mình chủ động tách nhỏ thành các component (`PlaceIdFetcher`, `StatusTabs`, `ReviewCard`) ngay từ đầu để sau này code không bị rối và tối ưu tốc độ load[cite: 9, 21, 25].

#### 2. Lỗi gặp phải & Cách mình sửa
- [cite_start]**Lỗi deploy Vercel:** Lần đầu đẩy lên web bị lỗi không thao tác được[cite: 9]. [cite_start]Nguyên nhân do mình quên điền các biến môi trường của Supabase trên Vercel, kèm theo vài chỗ TypeScript ép kiểu chưa chuẩn giữa Client và DB[cite: 17]. Mình đã vào Vercel Settings bù Environment Variables và refactor lại interface `Review` là xong.
- **Lỗi Hydration số sao (`★`):** Khi render mấy ký tự ngôi sao đặc biệt, Server và Client của Next.js bị lệch pha. Mình đã xử lý bằng cách quản lý state hiển thị đồng bộ qua `useEffect`.

---

### 🤖 [Ngày 2 — 23/05/2026]

#### 1. Việc đã làm được
- [cite_start]**Tạo API Route cho AI:** Viết xong endpoint `src/app/api/generate-ai/route.ts` để xử lý logic gọi AI sinh câu trả lời[cite: 16, 23].
- [cite_start]**Chuyển đổi sang Gemini API:** Tích hợp SDK `@google/genai` mới nhất để gọi model `gemini-2.5-flash` sinh 3 phương án phản hồi[cite: 17, 23].
- [cite_start]**Hoàn thiện luồng:** Kết nối nút bấm "Generate AI" ở Frontend với API thật, tự động cập nhật trạng thái review sang `Resolved` và lưu data vào Supabase[cite: 4, 23].

#### 2. Lỗi gặp phải & Cách mình sửa
- [cite_start]**Lỗi OpenAI bắt trả phí (Billing):** Ban đầu mình tính dùng OpenAI theo PRD[cite: 4, 17], nhưng ngặt nỗi bên này bắt liên kết thẻ tín dụng và nạp tiền trước mới cho chạy API, rất mất thời gian trong thế trận 4 ngày nước rút.
  - [cite_start]*Cách mình xử lý:* Để cứu tiến độ, mình chuyển hướng sang dùng **Gemini API (`gemini-2.5-flash`)**[cite: 17]. [cite_start]Vừa có gói miễn phí để test thoải mái, vừa cho tốc độ phản hồi siêu nhanh (~2 giây), đạt chuẩn tiêu chí `< 5s` của đề bài[cite: 23].
- [cite_start]**AI báo thành công nhưng UI trống trơn:** Bấm nút sinh AI xong, DB báo cập nhật trạng thái `Resolved` chuẩn chỉnh nhưng giao diện 3 ô gợi ý lại không hiện chữ[cite: 4, 23].
  - [cite_start]*Nguyên nhân:* SDK Gemini trả dữ liệu về dạng một chuỗi String định dạng JSON[cite: 23]. [cite_start]Mình quên không giải nén mà ném thẳng chuỗi này vào cột JSONB của Supabase, làm Frontend không bóc tách được các thuộc tính `.standard`, `.friendly` hay `.troubleshooting`[cite: 23].
  - *Cách mình xử lý:* Tại Backend, mình bọc thêm hàm `JSON.parse()` trước khi lưu vào DB. Ở Frontend (`ReviewCard.tsx`), mình viết thêm một lớp phòng ngự: tự động kiểm tra kiểu dữ liệu, nếu data từ DB bị lưu sai dạng chuỗi thì Client sẽ tự parse ngược lại thành Object. UI lập tức hiển thị mượt mà 100%.
  
  ### 🎯 [Kế hoạch Ngày 3 — 24/05/2026]
- Viết thêm API duyệt bài `/api/reviews/approve` và tạo thêm cột `selected_reply` trong Supabase để lưu lại câu trả lời duy nhất được chọn.
- Chỉnh sửa lại UI hiển thị ở Tab "Đã xử lý" để chỉ render đúng câu phản hồi đã duyệt.
- Tối ưu lại Prompt để Gemini tự động phản hồi theo đúng ngôn ngữ của khách hàng (Multi-language support).

--- 

### 🤖 [Ngày 3 — 24/05/2026]

#### 1. Việc đã làm được
- **Chốt luồng Approve:** Viết xong API `/api/reviews/approve` để đổi trạng thái review sang `Resolved` và lưu câu trả lời được duyệt vào Supabase.
- **Nâng cấp UI:** Sửa component `ReviewCard.tsx`, cho phép click chọn 1 trong 3 câu trả lời (viền đổi màu Indigo) trước khi bấm duyệt.
- **Làm AI đa ngôn ngữ:** Sửa lại Prompt cho Gemini 2.5 Flash để tự nhận diện ngôn ngữ của khách. Khách viết tiếng Anh/Nhật thì AI sẽ tự động rep lại bằng chính tiếng Anh/Nhật chứ không ép ra tiếng Việt như hôm qua.

#### 2. Lỗi gặp phải & Cách mình fix
- **Bấm sinh AI xong bị nhảy thẳng vào trạng thái "Đã xử lý":** * *Nguyên nhân:* Do code Backend cũ vừa sinh AI xong đã tự update `status: 'Resolved'` dưới DB, làm Frontend mất luôn menu cho User chọn 1 trong 3.
  * *Fix:* Bỏ dòng update status ở API sinh AI đi, chỉ lưu data vào cột `ai_responses` và giữ nguyên trạng thái `Pending` để chờ User bấm Approve.
- **Bấm Approve bị lỗi "Duyệt thất bại" (Network báo lỗi 404 HTML):**
  * *Nguyên nhân:* Gọi fetch ở Frontend một đường (`/api/reviews/approve`) nhưng đặt tên thư mục ở Backend một nẻo (`/api/approve-reply/route.ts`).
  * *Fix:* Đổi lại cấu trúc thư mục cho khớp 100% với URL fetch, restart lại server để Next.js xóa cache router là xong.
- **Lỗi gãy lệnh SQL khi bấm Approve:**
  * *Nguyên nhân:* Hệ thống cố lưu câu trả lời được chọn vào cột `selected_reply` nhưng bảng `reviews` trên Supabase chưa tạo cột này.
  * *Fix:* Vào SQL Editor của Supabase chạy lệnh `ALTER TABLE public.reviews ADD COLUMN selected_reply TEXT;` để thêm cột là chạy mượt ngay.
- **Lỗi SerpApi trả về mảng rỗng (Không tìm thấy review):**
  * *Nguyên nhân:* Do mình lấy nhầm mã `Google Place ID` ném vào tham số `data_id` của SerpApi.
  * *Fix:* Lên trang Playground của SerpApi, search địa điểm rồi lấy đúng mã Hex dạng `0x...:0x...` nạp vào ô nhập liệu là có data.