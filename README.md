# UCOrm - AI-Powered Customer Review Management Dashboard (MVP 0)

UCOrm là một bảng điều khiển (Dashboard) giúp doanh nghiệp quản lý và tự động hóa quy trình phản hồi đánh giá của khách hàng từ Google Maps bằng trí tuệ nhân tạo (AI). Dự án được phát triển dưới dạng **Proof of Concept (PoC) / MVP 0** nhằm chứng minh khả năng tích hợp Full-stack và tối ưu hóa vận hành bằng AI.

---

## 🎯 Tư duy Thiết kế & Quản trị Rủi ro (MVP Mindset)

Dự án ban đầu được hoạch định triển khai trong **7 ngày**. Tuy nhiên, do trùng lịch thi học phần bất khả kháng, thời gian thực tế bị nén lại chỉ còn **4 ngày nước rút**. Để đảm bảo bàn giao sản phẩm chạy thực tế đúng hạn mà không thỏa hiệp về chất lượng luồng đi dữ liệu, mình đã áp dụng tư duy quản trị rủi ro như sau:

### 1. Lý do lựa chọn Tech Stack (Next.js + Supabase)
- **Next.js (App Router):** Giúp xây dựng cả Frontend lẫn API Backend (Route Handlers) trên cùng một dự án. Tránh mất thời gian thiết lập độc lập 2 source code riêng biệt, tối ưu hóa tốc độ deploy lên Vercel.
- **Supabase (PostgreSQL):** Cung cấp hệ thống Database mạnh mẽ và giao diện Table Editor trực quan. Khả năng lưu trữ dữ liệu dạng `JSONB` giúp lưu thẳng 3 phương án gợi ý của AI vào cùng một dòng trong bảng `reviews`, triệt tiêu hoàn toàn thời gian thiết lập các bảng phụ vô lý trong giai đoạn MVP.

### 2. Chủ động dùng Sample Data để bảo vệ luồng AI (Core Feature)
- Theo PRD gốc, hệ thống cần kết nối trực tiếp với Google Places API. Tuy nhiên, việc đăng ký và xác thực tài khoản Google Cloud bắt buộc liên kết thẻ tín dụng quốc tế, có rủi ro duyệt chậm và chi phí cao.
- **Quyết định quản trị rủi ro:** Mình đã chủ động chuyển hướng sang kết hợp giữa **Dữ liệu mẫu (Sample Data)** được bơm sẵn dưới Database và tích hợp **SerpApi** (giải pháp cào dữ liệu Google Maps giá rẻ/miễn phí qua mã `data_id`). Quyết định này giúp mình cô lập rủi ro từ bên thứ ba, dồn 100% tài nguyên để hoàn thiện luồng logic cốt lõi: **Sinh AI đa ngôn ngữ $\rightarrow$ User lựa chọn $\rightarrow$ Bấm Approve $\rightarrow$ Đồng bộ DB.**

---

## 📅 Nhật ký phát triển dự án

### 🚀 Ngày 1 — Setup Khung & Thiết kế Database
- **UI Dashboard:** Thiết kế giao diện quy tụ trên 1 màn hình đơn giản. Tách nhỏ thành các component (`PlaceIdFetcher`, `StatusTabs`, `ReviewCard`) ngay từ đầu để quản lý State cô lập, tránh re-render thừa.
- **Supabase:** Khởi tạo bảng `reviews` với cấu trúc lưu trữ trạng thái (`Pending` / `Resolved`) và cột `ai_responses (JSONB)`.

### 🤖 Ngày 2 — Tích hợp AI & Lớp Phòng Ngự Dữ Liệu
- **Chuyển hướng sang Gemini API:** Thay vì OpenAI (yêu cầu nạp tiền trước), mình chọn `gemini-2.5-flash` thông qua SDK `@google/genai` mới nhất để tận dụng hạn mức miễn phí và tốc độ xử lý cao.
- **Xử lý lỗi String-JSON:** Phát hiện SDK Gemini trả về dữ liệu thô dạng chuỗi String định dạng JSON khiến UI không bóc tách được thuộc tính. Đã triển khai lớp phòng ngự bọc hàm `JSON.parse()` ở cả Backend (trước khi lưu) và Frontend (khi render) để hệ thống chạy ổn định.

### 🛠️ Ngày 3 — Hoàn thiện Luồng Duyệt (Approve) & Đa Ngôn Ngữ
- **Sửa luồng Logic Trạng thái:** Sửa lỗi Backend cũ (vừa sinh AI xong tự đổi sang `Resolved`), giữ nguyên trạng thái `Pending` sau khi gọi AI để nhường quyền quyết định cho User.
- **API Duyệt bài:** Viết API `/api/reviews/approve` và tạo thêm cột `selected_reply` trong Supabase để lưu lại duy nhất 1 câu trả lời được chọn, đồng thời đẩy review sang tab "Đã xử lý".
- **Prompting Đa ngôn ngữ:** Tối ưu hóa Prompt hệ thống cho Gemini. Hệ thống tự động nhận diện ngôn ngữ của khách (Tiếng Anh, Tiếng Nhật,...) để rep lại bằng chính ngôn ngữ đó chứ không ép ra tiếng Việt như trước.

---

## ⚖️ Đánh giá Dự án (Điểm mạnh & Điểm yếu)

### 👍 Điểm mạnh (Ưu điểm)
1. **Kiến trúc dữ liệu gọn gàng:** Tận dụng triệt để kiểu dữ liệu `JSONB` của PostgreSQL để lưu trữ linh hoạt các phương án AI mà không làm phình to cấu trúc bảng.
2. **Trải nghiệm người dùng mượt mà:** Hệ thống phân chia Tab rõ ràng, có trạng thái Loading cho từng chiếc Card riêng biệt khi sinh AI.
3. **Khả năng thích ứng quốc tế:** AI tự động xử lý đa ngôn ngữ tự nhiên như người bản xứ, sẵn sàng mở rộng quy mô sản phẩm.

### 👎 Điểm yếu (Hạn chế hiện tại & Hướng tối ưu)
1. **Tốc độ phản hồi của AI (Latency):** - *Thực trạng:* Đề bài yêu cầu thời gian sinh AI phải `< 5 giây`. Tuy nhiên, trong môi trường kiểm thử thực tế, việc ép Gemini sinh cấu trúc JSON cố định cùng lúc 3 phương án (Standard, Friendly, Troubleshooting) đôi khi khiến thời gian phản hồi kéo dài từ **5 - 10 giây**.
   - *Hướng khắc phục trong MVP 1:* Sẽ cấu hình streaming dữ liệu hoặc chuyển sang các model cực nhẹ chuyên dụng cho cấu trúc JSON như `Gemini 1.5 Flash-8B`, đồng thời tối ưu lại độ dài Prompt để giảm thời gian chờ (Time-to-First-Token).
2. **Phụ thuộc vào cấu trúc chuỗi Hex của SerpApi:** Người dùng phải lấy mã `data_id` từ Playground của SerpApi thay vì nhập Place ID dạng chữ thông thường của Google.

---

## 💻 Hướng dẫn chạy dự án ở máy Local

### 1. Chuẩn bị các biến môi trường (Environment Variables)
Tạo một file `.env.local` nằm ở thư mục gốc của dự án và điền đầy đủ các thông tin sau:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_gemini_api_key
SERPAPI_KEY=your_serpapi_key
```
### 2. Cấu hình Database (Supabase SQL)
Vào SQL Editor trên Supabase Dashboard và chạy lệnh sau để khởi tạo bảng:

```
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_name TEXT NOT NULL,
    rating INT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    ai_responses JSONB DEFAULT NULL,
    selected_reply TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 3. Cài đặt và khởi chạy
#### Cài đặt các thư viện phụ thuộc
- npm install

#### Chạy dự án ở chế độ Development
- npm run dev

---

## 🧪 Tài nguyên kiểm thử (Sample Data IDs for Testing)

Để thuận tiện cho quá trình chấm bài và test luồng gọi API SerpApi kết hợp AI, mình đã chuẩn bị sẵn danh sách các mã `data_id` thực tế của các địa điểm nổi tiếng tại Đà Nẵng (đã được kiểm tra luồng dữ liệu chạy ổn định 100%):

| Tên địa điểm | Mã `data_id` để nhập vào ô test | Ngôn ngữ review dự kiến | Mục đích test phù hợp |
| :--- | :--- | :--- | :--- |
| **Cộng Cà Phê (Đà Nẵng)** | `0x314217000f57260f:0xc032da1776a3c1e9` | Tiếng Việt / Tiếng Anh | Test luồng đồng bộ cơ bản, reviews ngắn gọn. |
| **Khách sạn Hilton (Đà Nẵng)** | `0x3142183030cc0f53:0x9f7d7927946123f7` | Tiếng Anh / Tiếng Hàn | **Cực tốt để test tính năng Đa ngôn ngữ (Multi-language)** của Gemini. |
| **Kem bơ Cô Vân (Chợ Bắc Mỹ An)** | `0x3142170d0e90a73b:0x2eef86e7543e55db` | Tiếng Việt (Phong cách local) | Test khả năng xử lý từ ngữ địa phương/thân thiện của AI. |

---

## 📚 Tài liệu tham khảo (References)

Dự án được nghiên cứu và hoàn thiện dựa trên việc đọc hiểu và vận dụng các tài liệu kỹ thuật chính thức sau:

1. **Next.js App Router Docs:** Tra cứu cấu trúc File-system Based Routing để setup chuẩn hệ thống API Route Handler tại thư mục `src/app/api/`.
   - *Nguồn:* [Next.js Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
2. **Google GenAI SDK (New Releases):** Nghiên cứu cách tích hợp thư viện `@google/genai` mới nhất và cấu hình tính năng **Structured Outputs (`responseSchema`)** để ép mô hình `gemini-2.5-flash` trả về đúng định dạng JSON 3 phương án phản hồi.
   - *Nguồn:* [Google Gemini Structured Outputs Guide](https://ai.google.dev/gemini-api/docs/structured-output?example=recipe)
3. **Supabase JavaScript Client:** Sử dụng tài liệu thư viện `@supabase/supabase-js` để tối ưu câu lệnh cập nhật đồng thời (`.update()`) cho cả hai trường `ai_responses` và `status` trong một Request duy nhất.
   - *Nguồn:* [Supabase Update Data Reference](https://supabase.com/docs/reference/javascript/update)
4. **SerpApi Google Maps Reviews API:** Khảo sát cấu trúc dữ liệu trả về và cách khai thác tham số `data_id` để thực hiện bypass rào cản chi phí của Google Places API chính chủ.
   - *Nguồn:* [SerpApi Google Maps Reviews Playground](https://serpapi.com/google-maps-reviews-api)