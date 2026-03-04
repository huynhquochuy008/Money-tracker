# Money Pro — Premium Finance Tracker 💰

Ứng dụng quản lý chi tiêu cá nhân tối giản, mạnh mẽ với giao diện Premium và lưu trữ đám mây Supabase. Được xây dựng với kiến trúc Layered (MVC) và Clean Code.

## ✨ Tính năng nổi bật
- **Giao diện Glassmorphism:** Trải nghiệm người dùng cao cấp với hiệu ứng mờ kính và biểu đồ tương tác cao.
- **Supabase Cloud Storage:** Lưu trữ dữ liệu an toàn trên PostgreSQL thay vì file JSON cục bộ.
- **Tự động Đồng bộ (Auto Sync):** Tự động phát hiện và import dữ liệu từ `expenses.json` và `budget.json` vào database khi khởi động.
- **Quản lý Ngân sách:** Thiết lập hạn mức chi tiêu cho từng hạng mục và theo dõi tiến độ theo thời gian thực.
- **Smart Input:** Hỗ trợ nhập liệu nhanh với các hậu tố `k` (ngàn) và `m` (triệu), ví dụ: `1.2m`, `50k`.
- **Remote Access:** Hỗ trợ tunnel qua LocalTunnel để truy cập ứng dụng từ bất kỳ đâu.

## 🚀 Kiến trúc dự án
- `app.py`: Entry point của ứng dụng (Flask Server).
- `core/supabase_storage.py`: Lớp quản lý dữ liệu tương tác với Supabase API.
- `core/services.py`: Business logic Layer xử lý nghiệp vụ tài chính.
- `core/models/`: Định nghĩa các Pydantic models (`Expense`, `Budget`, `UserProfile`).
- `templates/index.html`: Giao diện người dùng duy nhất (Single Page Application).

## 🛠 Cài đặt & Chạy

### 1. Yêu cầu hệ thống
- Python 3.10+
- Tài khoản [Supabase](https://supabase.com/)

### 2. Thiết lập môi trường
1. Clone dự án:
   ```bash
   git clone https://github.com/huynhquochuynh008/Money-tracker.git
   cd Money-tracker
   ```
2. Tạo Virtual Environment và cài đặt dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Cấu hình `.env`:
   Tạo file `.env` từ mẫu sau:
   ```text
   SUPABASE_URL="URL_CUA_BAN"
   SUPABASE_KEY="KEY_CUA_BAN"
   SUPABASE_USER_ID="UUID_USER_CUA_BAN"
   ```

### 3. Khởi tạo Database
Copy nội dung trong `init.sql` và chạy trong **Supabase SQL Editor** để tạo các bảng cần thiết.

### 4. Chạy ứng dụng
```bash
python3 app.py
```
Truy cập tại: `http://localhost:5000`

## 📡 Truy cập từ xa (Tunnel)
Nếu bạn chạy trên server từ xa, bạn có thể mở tunnel:
```bash
npm install -g localtunnel
lt --port 5000
```

---
*Phát triển bởi Claw Assistant cho huynhquochuy008*
