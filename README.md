# 🕵️‍♂️ CØDETECTOR 2026 // PARALLAX

Hệ thống nền tảng thi đấu **CTF Trinh thám Điều tra bằng SQL (Detective SQL Challenge Platform)** với khả năng thực thi SQL Sandbox an toàn và đồng bộ tiến độ thời gian thực giữa các thành viên trong đội chơi.

---

## 🌟 TÍNH NĂNG NỔI BẬT

* 🖥️ **Detective Game Workspace (Giao diện phòng thi chuẩn Wireframe):**
  * **Đề bài & Hồ sơ vụ án:** Hiển thị cốt truyện, manh mối vụ án và tích hợp ngay bên dưới là **Form nộp đáp án động (Dynamic Form)** nhiều trường.
  * **Timer:** Đồng hồ đếm ngược trinh thám với thanh tiến trình trực quan.
  * **SQL Server Database Diagram (ERD):** Sơ đồ quan hệ 10 bảng dạng 2D Canvas tương tác: hỗ trợ Zoom, Pan, **kéo thả từng bảng (Draggable)**, đường dây liên kết SVG uốn lượn $1 : \infty$ và click để copy cột vào IDE.
  * **SQL IDE Sandbox:** Trình soạn thảo SQL Editor có đánh số dòng, gợi ý truy vấn mẫu và phím tắt `Ctrl + Enter` để chạy lệnh.
  * **Query Output:** Bảng hiển thị kết quả truy vấn đa dòng, đo thời gian thực thi (execution time ms) và bắt lỗi cú pháp an toàn.
* 🛡️ **Bảo mật SQL Sandbox Đa tầng (Dual Schema Architecture):**
  * Tách biệt **Schema `app`** (quản lý đội thi, đáp án chuẩn) và **Schema `challenge`** (dữ liệu câu đố).
  * Sandbox chạy qua PostgreSQL Role riêng biệt `game_player` (chỉ được `SELECT` trên schema `challenge`, ép `statement_timeout = 3000ms`, tự động gắn `LIMIT 50`). Thí sinh không thể xem trộm đáp án của BTC.
* ⚡ **Đồng bộ thời gian thực qua WebSocket (Team Real-time Sync):**
  * Cả 3-4 thành viên trong cùng một đội đăng nhập trên các máy tính khác nhau đều được kết nối vào phòng thi chung.
  * Khi **bất kỳ ai giải đúng và nộp bài**, hệ thống sẽ tự động phát tín hiệu WebSocket để **toàn bộ các máy của đội cùng chuyển sang màn tiếp theo**.

---

## 🏗️ CÔNG NGHỆ SỬ DỤNG

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, TanStack Router.
* **Backend:** FastAPI, Python 3.12, SQLAlchemy 2.0 (Asyncpg), PyJWT, Bcrypt, WebSockets.
* **Database & DevOps:** PostgreSQL 16 Alpine, Docker & Docker Compose.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN (QUICK START)

### 1. Yêu cầu môi trường
* Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản 18+ hoặc 20+)
* Đã cài đặt [Docker Desktop](https://www.docker.com/products/docker-desktop/) (hoặc Python 3.11+ & PostgreSQL nếu chạy thủ công)

---

### 2. Khởi động Backend & Database (Bằng Docker)

Mở một cửa sổ Terminal tại thư mục `backend`:

```bash
cd backend

# Khởi động dịch vụ PostgreSQL và FastAPI Backend
docker compose up -d --build

# Nạp dữ liệu 10 bảng vụ án và tài khoản các đội thi
docker compose exec backend python -m seed.seed_teams
Get-Content challenge_full_schema.sql -Raw | docker compose exec -T postgres psql -U postgres -d codetector
```

> **API Documentation (Swagger UI):** Truy cập [http://localhost:8000/docs](http://localhost:8000/docs)  
> **API Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

### 3. Khởi động Frontend

Mở một cửa sổ Terminal khác tại thư mục gốc `codetector-2026-parallax-fe`:

```bash
# Cài đặt các gói phụ thuộc (nếu chưa cài)
npm install

# Khởi chạy máy chủ phát triển
npm run dev
```

Truy cập giao diện Web tại: 👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🔑 TÀI KHOẢN ĐĂNG NHẬP THỬ NGHIỆM

Bạn có thể đăng nhập ngay tại [http://localhost:5173/login](http://localhost:5173/login) bằng các tài khoản đã tạo sẵn:

| Tên đăng nhập (Username) | Mật khẩu (Password) | Tên đội hiển thị | Ghi chú |
| :--- | :--- | :--- | :--- |
| **`test`** | **`1234`** | **Đội Thử Nghiệm Alpha** | Tài khoản test nhanh |
| **`detective_01`** | **`PassWord#2026A`** | **Shadow Cipher** | Đội chính thức 01 |
| **`detective_02`** | **`PassWord#2026B`** | **Aureum Enigma** | Đội chính thức 02 |
| **`detective_03`** | **`PassWord#2026C`** | **Quantum Clue** | Đội chính thức 03 |

---

## 📂 SƠ ĐỒ 10 BẢNG DỮ LIỆU ĐIỀU TRA (CHALLENGE SCHEMA)

Dữ liệu vụ án xoay quanh vụ trộm **Viên ngọc Parallax** tại Bảo tàng Aureum lúc 23:45 đêm ngày 10/10/2026:

```text
[ Call_log ] (Cuộc gọi)
      │
      ▼
   [ User ] ◀─── [ ATM_Transaction ] ◀─── [ ATM ] (Rút tiền mặt)
      │
      ├──────────────────────┐
      ▼                      ▼
 [ Museum_log ]          [ carRental ] (Hợp đồng thuê xe)
 (Quẹt thẻ phòng)            │
      │                      ▼
      ▼                   [ Car ] (Xe SUV biển 30H-999.88)
  [ Museum ]                 ▲
      │                      │
      ▼                      │
  [ Carpark ] ───▶ [ carPark_History ] (Camera bãi xe)
```

### 💡 Câu lệnh SQL mẫu để thí sinh phá án trên IDE:

**1. Lần theo chiếc xe SUV đen tẩu thoát khỏi bãi đỗ xe bảo tàng:**
```sql
SELECT u.name AS nguoi_thue, u.job, c.plate_number, c.brand, r.rental_time
FROM "carRental" r
JOIN "User" u ON r.id_renter = u.id_user
JOIN "Car" c ON r.id_car = c.id_car
WHERE c.color LIKE '%Đen%';
```

**2. Tìm đối tượng rút tiền mặt bất thường trước giờ gây án:**
```sql
SELECT u.name, a.name AS vi_tri_atm, t.transaction_time, t.amount
FROM "ATM_Transaction" t
JOIN "User" u ON t.person_id = u.id_user
JOIN "ATM" a ON t.atm_id = a.id_atm
ORDER BY t.transaction_time DESC;
```

**3. Bắt quả tang thời điểm đột nhập phòng ngọc:**
```sql
SELECT u.name, m.event_type, m.id_room, m.recorded_at
FROM "Museum_log" m
JOIN "User" u ON m.id_user = u.id_user
WHERE m.recorded_at >= '2026-10-10 23:00:00';
```

---

## 📁 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
codetector-2026-parallax-fe/
│
├── backend/                             # Dịch vụ Backend FastAPI & Database
│   ├── app/
│   │   ├── api/v1/                     # Các Endpoint: auth, stages, sandbox, submissions, ws
│   │   ├── core/                       # Database engine, Security (Bcrypt/JWT), WebSocket manager
│   │   ├── models/                     # SQLAlchemy models: Team, Stage, Submission
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   └── main.py                     # Entry point FastAPI, CORS, routers
│   ├── seed/                           # Script tạo tài khoản đội thi
│   ├── challenge_full_schema.sql       # 10 bảng câu đố và dữ liệu phá án
│   ├── init_db.sql                     # Script phân quyền Dual-schema & user game_player
│   ├── Dockerfile                      # Image Backend
│   └── docker-compose.yml              # PostgreSQL + FastAPI container stack
│
├── src/                                # Ứng dụng Frontend React
│   ├── components/game/                # Các thành phần giao diện phòng thi:
│   │   ├── GameHeader.tsx              # Header (Team, Stage, WebSocket status)
│   │   ├── ProblemDossierPanel.tsx     # Khung ĐỀ BÀI + Form nộp án nhiều trường
│   │   ├── TimerPanel.tsx              # Khung TIMER đếm ngược
│   │   ├── ErdVisualizerPanel.tsx      # Khung ERD (SQL Server Database Diagram 2D Canvas)
│   │   ├── SqlEditorPanel.tsx          # Khung IDE (Trình soạn thảo SQL sandbox)
│   │   ├── QueryOutputPanel.tsx        # Khung OUTPUT (Bảng kết quả & đo thời gian ms)
│   │   └── StageClearModal.tsx         # Popup vinh danh qua màn
│   ├── context/                        # AuthContext (Xác thực JWT của đội)
│   ├── pages/
│   │   ├── LandingPage.tsx             # Trang chủ giới thiệu cuộc thi
│   │   ├── LoginPage.tsx               # Trang đăng nhập đội thi
│   │   └── GameWorkspacePage.tsx       # Bàn làm việc phòng thi chính (/game)
│   ├── services/                       # API Client, Game Service, WebSocket Service
│   └── router.tsx                      # Cấu hình định tuyến TanStack Router
│
├── package.json
└── README.md
```

---

## 🛠️ CÁC LỆNH HỮU ÍCH

| Lệnh | Thư mục | Tác dụng |
| :--- | :--- | :--- |
| `npm run dev` | Thư mục gốc | Chạy Frontend trên máy chủ phát triển Vite |
| `npm run build` | Thư mục gốc | Kiểm tra TypeScript và đóng gói bản phát hành Frontend |
| `docker compose up -d` | `backend/` | Chạy nền database PostgreSQL và FastAPI |
| `docker compose logs -f backend` | `backend/` | Xem nhật ký log thời gian thực của backend |
| `docker compose down` | `backend/` | Dừng các container của backend |

---

© 2026 **JS Club - FPT University**. Phát triển phục vụ sự kiện Codetector 2026: Parallax.
