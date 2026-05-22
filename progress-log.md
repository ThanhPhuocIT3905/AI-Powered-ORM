[Ngày 1 — 22/05/2026]

### Tiến độ thực hiện

- Khởi tạo dự án Next.js kết hợp Tailwind CSS. Đẩy mã nguồn lên GitHub để ghi nhận commit đầu tiên.
- Tạo bảng `reviews` trên Supabase với các trường: `id`, `author`, `content`, `rating`, `ai_responses` (dạng JSONB), `status` (mặc định là Pending).
- Chèn trực tiếp 5 câu review mẫu (cả tiếng Việt và tiếng Anh) vào bảng qua Table Editor của Supabase.
- Xây dựng UI Dashboard hiển thị danh sách 5 review này trên màn hình.

### Các vấn đề & cách xử lý

**1. Lỗi Crash/Build Error khi Deploy lên Vercel lần đầu**
	- Khi đẩy mã nguồn lên Vercel để kiểm thử theo DoD, hệ thống báo Build thành công nhưng thao tác bị lỗi (hoặc lỗi ngay từ vòng Build).
	- **Nguyên nhân & cách xử lý:**
		1. *Thiếu biến môi trường:* Chưa cấu hình `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trên Vercel. Đã bổ sung đầy đủ trong Project Settings > Environment Variables.
		2. *Lỗi TypeScript:* Một số đoạn code bị lỗi do không đồng bộ kiểu dữ liệu giữa Client và DB. Đã refactor lại interface `Review` đảm bảo an toàn kiểu dữ liệu.

**2. Lỗi Hydration khi render số Sao (Rating) bằng ký tự đặc biệt (`★`)**
	- **Giải quyết:** Đã chuẩn hóa dữ liệu string trả về từ client/server hoặc quản lý state hiển thị đồng bộ qua `useEffect` để tránh lỗi hydration.

**3. Rủi ro về thời gian với Google Places API**
	- **Giải quyết:** Do việc xin API Key Google Maps và cấu hình Billing tốn thời gian, đã chủ động chuyển sang dùng sample data nạp thẳng vào Supabase, đồng thời làm hiệu ứng Fetching giả lập trên UI. Việc này giúp tập trung vào tính năng AI Engine ở các ngày tiếp theo.

**4. Code ban đầu dồn hết vào 1 file `page.tsx` gây rối**
	- **Giải quyết:** Đã refactor, tách thành các component con để chuẩn bị cho Ngày 2, đảm bảo khi bấm "Generate AI" ở Card nào thì chỉ Card đó loading, tránh re-render toàn bộ trang.
