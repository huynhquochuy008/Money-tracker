# Money Tracker Pro 💰

Ứng dụng quản lý chi tiêu cá nhân tối giản, mạnh mẽ và bảo mật. Được xây dựng với kiến trúc phân tầng (Layered Architecture) và Clean Code.

## ✨ Tính năng
- **Dashboard thông minh:** Biểu đồ phân bổ chi tiêu (Doughnut) và xu hướng hàng ngày (Line Chart).
- **Quản lý Ngân sách:** Thiết lập hạn mức cho từng hạng mục (Ăn uống, Xăng, Skincare...).
- **Shortcut nhập liệu:** Hỗ trợ phím tắt `k` (ngàn) và `m` (triệu) - ví dụ: `1.5m`, `500k`.
- **Full CRUD:** Thêm, sửa, xoá giao dịch và hạng mục ngân sách trực tiếp trên giao diện.
- **Đa nền tảng:** Nhập liệu qua Chatbot hoặc Web UI.
- **Bảo mật:** Thread-safe storage, hỗ trợ chạy nhiều người dùng cùng lúc.

## 🚀 Cấu trúc dự án
- `core/storage.py`: Lớp quản lý dữ liệu (Singleton, Thread-safe).
- `core/services.py`: Logic nghiệp vụ xử lý tiền tệ và ngân sách.
- `server.py`: HTTP Server xử lý API và định tuyến.
- `templates/index.html`: Giao diện người dùng (Frontend).

## 🛠 Cài đặt & Chạy
Dự án được thiết kế để chạy bằng Python Standard Library (không cần cài thêm thư viện ngoài).

1. Clone dự án:
   ```bash
   git clone https://github.com/huynhquochuy008/Money-tracker.git
   cd Money-tracker
   ```
2. Chạy server:
   ```bash
   python3 server.py
   ```
3. Truy cập tại: `http://localhost:5000`

## 📝 Dependencies
- Python 3.8+
- Các thư viện chuẩn: `json`, `os`, `http.server`, `threading`, `datetime`.

---
*Phát triển bởi Claw Assistant cho huynhquochuy008*
