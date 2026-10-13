# Codetector 2026 - Parallax Backend API

## Chặng 1: Truy tìm thủ phạm

Chặng 1 gồm 3 câu hỏi tuần tự. Cập nhật nội dung từ `app/game_content.py` bằng:

```bash
docker compose exec backend python -m seed.seed_chapter_1
docker compose restart backend
```

Lệnh cập nhật giữ nguyên tiến độ đội và lịch sử nộp bài. Trong schema hiện tại, `Stage.stage_number` và `Team.current_stage` lưu số thứ tự **câu hỏi**; giá trị 4 nghĩa là đã hoàn thành cả 3 câu của Chặng 1. API `/api/v1/stages/outline` cung cấp mục lục và trạng thái khóa. Đáp án chuẩn chỉ nằm ở backend.

Nguồn nội dung: https://docs.google.com/document/d/1kT8z4ftLiFw9ELOl9EfQv8e4NIYJYWbZQvmXFnV5mpo/edit

### Nạp dữ liệu MuniDB

`munidb_challenge.sql` chuyển cú pháp SQL Server của `munidb (1).sql` sang PostgreSQL. Script chỉ thay schema `challenge`, giữ nguyên tài khoản, tiến độ và lịch sử bài nộp trong schema `app`. Các bảng và dữ liệu `challenge` cũ được đổi tên thành schema sao lưu; nếu nhập lỗi, toàn bộ giao dịch rollback.

Theo lựa chọn của người tổ chức, các mã trong dữ liệu đã được hoán đổi để khớp đáp án Docs: hợp đồng của Nam là `41` (hợp đồng xe `30A-23456` chuyển sang `40`), giao dịch ATM của Nam là `702` (giao dịch của Thu chuyển sang `701`). Nội dung bằng chứng giữ nguyên.

Chạy từ thư mục `backend` bằng PowerShell, đặt tên schema mới và sao lưu riêng cho mỗi lần nhập:

```powershell
docker compose cp ./munidb_challenge.sql postgres:/tmp/munidb_challenge.sql
docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -v target_schema=challenge_import_20261013 -v backup_schema=challenge_backup_20261013 -U postgres -d codetector -f /tmp/munidb_challenge.sql
docker compose exec backend python -m seed.seed_chapter_1
docker compose restart backend
```

Chọn tên schema chưa tồn tại để tránh ghi đè bản sao lưu. Sau khi nhập, đối chiếu đáp án câu hỏi với mã thực tế trong dữ liệu trước khi mở thi.

Hệ thống Backend xây dựng bằng **FastAPI** và **PostgreSQL** phục vụ giải đấu CTF Trinh thám Parallax 2026:
- 🛡️ **SQL Sandbox an toàn:** Phân quyền qua role PostgreSQL `game_player` (chỉ đọc trên schema `challenge`, giới hạn statement timeout 3s).
- 📝 **Form chấm đáp án đa trường (Dynamic Form Validation):** Thí sinh phải điền đúng và đủ tất cả các manh mối mới được qua màn.
- ⚡ **WebSocket Real-time Sync:** Tự động đồng bộ màn chơi giữa tất cả các thành viên trong cùng một đội thi.

---

## 1. Cấu trúc Database (Dual Schema)

1. **Schema `app`:** Quản lý đội chơi, các màn chơi (`stages`), đáp án chuẩn (`correct_answers` dạng JSONB), và lịch sử nộp bài (`submissions`). Chỉ backend admin mới có quyền truy cập.
2. **Schema `challenge`:** Chứa toàn bộ các bảng dữ liệu câu đố để thí sinh viết query điều tra (`artifacts`, `suspects`, `access_logs`, ...). Role `game_player` chỉ có quyền `SELECT` trên schema này.

---

## 2. Hướng dẫn chạy nhanh bằng Docker

```bash
cd backend
# 1. Khởi động PostgreSQL và FastAPI
docker compose up -d --build

# 2. Khởi tạo tài khoản các đội thi
docker compose exec backend python -m seed.seed_teams
```

- **Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Root:** [http://localhost:8000](http://localhost:8000)
- **PostgreSQL Port:** `5432`

---

## 3. Hướng dẫn chạy Local (Python venv)

### Yêu cầu:
- Python 3.11+
- PostgreSQL 15+

### Các bước:
```bash
cd backend

# 1. Tạo môi trường ảo
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate # Linux/Mac

# 2. Cài đặt thư viện
pip install -r requirements.txt

# 3. Copy file môi trường và điều chỉnh DATABASE_URL
cp .env.example .env

# 4. Chạy script SQL init_db.sql trong PostgreSQL của bạn
psql -U postgres -d codetector -f init_db.sql

# 5. Seed đội thi
python -m seed.seed_teams

# 6. Chạy dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 4. Danh sách API chính

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Đăng nhập đội thi, nhận Bearer JWT token |
| `GET` | `/api/v1/auth/me` | Lấy thông tin đội và màn chơi hiện tại |
| `GET` | `/api/v1/stages/current` | Lấy đề bài và `form_schema` của màn hiện tại (ẩn đáp án) |
| `POST` | `/api/v1/sandbox/query` | Chạy câu lệnh SQL điều tra với role `game_player` |
| `POST` | `/api/v1/submissions/submit` | Nộp form đáp án, đối chiếu, tăng màn và phát WebSocket |
| `WS` | `/ws/team?token=...` | WebSocket phòng thi theo đội, tự động nhảy màn |
