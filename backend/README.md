# Codetector 2026 - Parallax Backend API

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
