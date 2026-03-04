# Money Pro — Premium Finance Tracker 💰

Ứng dụng quản lý chi tiêu cá nhân tối giản, mạnh mẽ với giao diện Premium và lưu trữ đám mây Supabase. Được xây dựng với kiến trúc Layered (MVC) và Clean Code.

## ✨ Tính năng nổi bật
- **Giao diện Glassmorphism:** Trải nghiệm người dùng cao cấp với hiệu ứng mờ kính và biểu đồ tương tác cao.
- **Smart Dashboard (New):**
    - **Summary Cards:** Theo dõi tổng chi tiêu theo Ngày, Tuần, Tháng và Năm ngay lập tức.
    - **Daily Spending:** Bảng chi tiết chi tiêu trong ngày với tính năng cuộn mượt mà.
    - **Reorganized Layout:** Ưu tiên thông tin quan trọng nhất, biểu đồ phân tích được chuyển xuống dưới để có cái nhìn tổng quát hơn.
- **Supabase Cloud Storage:** Lưu trữ dữ liệu an toàn trên PostgreSQL thay vì file JSON cục bộ.
- **Tự động Đồng bộ (Auto Sync):** Tự động phát hiện và import dữ liệu từ `expenses.json` và `budget.json` vào database khi khởi động.
- **Quản lý Ngân sách:** Thiết lập hạn mức chi tiêu cho từng hạng mục và theo dõi tiến độ theo thời gian thực.
- **Smart Input:** Hỗ trợ nhập liệu nhanh với các hậu tố `k` (ngàn) và `m` (triệu), ví dụ: `1.2m`, `50k`.
- **Remote Access:** Hỗ trợ tunnel qua LocalTunnel để truy cập ứng dụng từ bất kỳ đâu.

## 🚀 Cấu trúc dự án (Monorepo)
Dự án được phân chia rõ ràng giữa Backend và Frontend:

### Backend (Flask)
- `backend/app.py`: Entry point của API server.
- `backend/core/services.py`: Xử lý logic nghiệp vụ và tính toán tổng hợp (Summary).
- `backend/core/supabase_storage.py`: Lớp giao tiếp với Supabase.
- `backend/tests/`: Hệ thống unit test và integration test.

### Frontend (React + Vite)
- `frontend/src/App.jsx`: Quản lý trạng thái ứng dụng và điều hướng.
- `frontend/src/components/Dashboard.jsx`: Giao diện Dashboard mới với các thẻ tổng hợp và bảng chi tiêu.
- `frontend/src/index.css`: Hệ thống thiết kế (Design System) Premium.
- `frontend/src/api/moneyApi.js`: Client kết nối với Backend API.

## 🛠 Cài đặt & Chạy nhanh

Dự án sử dụng **Makefile** để tự động hóa các tác vụ.

### 1. Cài đặt toàn bộ
```bash
make install
```

### 2. Chạy ứng dụng (Cả Backend & Frontend)
```bash
make run
```
- Backend chạy tại: `http://localhost:5001`
- Frontend chạy tại: `http://localhost:5173`

### 3. Kiểm thử
```bash
make test          # Chạy tất cả test
make test-backend  # Chỉ chạy test backend
make test-frontend # Chỉ chạy test frontend
```

### 4. Các lệnh khác
- `make help`: Hiển thị tất cả các lệnh hỗ trợ.
- `make clean`: Dọn dẹp các tệp tạm thời và virtual environment.

## 📡 Cấu hình .env
Tạo file `.env` ở thư mục gốc:
```text
SUPABASE_URL="URL_CUA_BAN"
SUPABASE_KEY="KEY_CUA_BAN"
SUPABASE_USER_ID="UUID_USER_CUA_BAN"
ALLOWED_ORIGINS="http://localhost:5173"
```

---
*Phát triển bởi Claw Assistant cho huynhquochuy008*
