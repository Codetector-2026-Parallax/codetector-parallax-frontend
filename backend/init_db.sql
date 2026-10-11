-- ========================================================
-- CODETECTOR 2026 - PARALLAX
-- DATABASE INITIALIZATION SCRIPT (POSTGRESQL)
-- ========================================================

-- 1. TẠO 2 SCHEMA ĐỘC LẬP
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS challenge;

-- 2. TẠO USER SANDBOX CHO THÍ SINH
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'game_player') THEN
        CREATE ROLE game_player WITH LOGIN PASSWORD 'game_player_password';
    END IF;
END
$$;

-- THU HỒI QUYỀN TRÊN CÁC SCHEMA HỆ THỐNG
REVOKE ALL ON DATABASE codetector FROM game_player;
REVOKE ALL ON SCHEMA public, app FROM game_player;

-- CẤP QUYỀN CHỈ ĐỌC TRÊN SCHEMA CHALLENGE
GRANT USAGE ON SCHEMA challenge TO game_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA challenge GRANT SELECT ON TABLES TO game_player;

-- RÀNG BUỘC AN TOÀN TRÊN ROLE GAME_PLAYER
ALTER ROLE game_player SET default_transaction_read_only = on;
ALTER ROLE game_player SET statement_timeout = '3000ms';
ALTER ROLE game_player SET search_path = challenge;

-- ========================================================
-- SCHEMA APP (HỆ THỐNG QUẢN LÝ GAME)
-- ========================================================

-- Bảng Teams (Đội thi)
CREATE TABLE IF NOT EXISTS app.teams (
    id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    current_stage INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Stages (Màn chơi, Form câu hỏi & Đáp án chuẩn)
CREATE TABLE IF NOT EXISTS app.stages (
    id SERIAL PRIMARY KEY,
    stage_number INT UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    story_description TEXT,
    clues_guide TEXT,
    form_schema JSONB NOT NULL,
    correct_answers JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Submissions (Lịch sử nộp form của các đội)
CREATE TABLE IF NOT EXISTS app.submissions (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES app.teams(id) ON DELETE CASCADE,
    stage_id INT REFERENCES app.stages(id),
    submitted_answers JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    failed_keys TEXT[],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_username ON app.teams(username);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON app.submissions(team_id, stage_id);

-- ========================================================
-- SCHEMA CHALLENGE (DỮ LIỆU ĐIỀU TRA CHO THÍ SINH)
-- ========================================================

CREATE TABLE IF NOT EXISTS challenge.artifacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room VARCHAR(100) NOT NULL,
    estimated_value_usd NUMERIC(15, 2),
    status VARCHAR(50) DEFAULT 'SECURE'
);

CREATE TABLE IF NOT EXISTS challenge.suspects (
    id SERIAL PRIMARY KEY,
    alias VARCHAR(100) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(100),
    known_affiliation VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS challenge.access_logs (
    id SERIAL PRIMARY KEY,
    log_time TIMESTAMP NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    person_name VARCHAR(255),
    door_accessed VARCHAR(100) NOT NULL,
    access_granted BOOLEAN NOT NULL
);

-- Cấp quyền SELECT trên các bảng challenge vừa tạo cho game_player
GRANT SELECT ON ALL TABLES IN SCHEMA challenge TO game_player;

-- ========================================================
-- SEED DATA BAN ĐẦU
-- ========================================================

-- Mật khẩu mặc định: 'PassWord#2026A' (được hash bằng bcrypt)
-- Hash tương ứng: $2b$12$eQ264o08yv6.G92kI662j.zG1Zq78w8qf2wWqH55gHhZ9e2QZ8VWy
-- Sẽ được seed chính xác qua Python seed script.

-- Seed Stage 1
INSERT INTO app.stages (stage_number, title, story_description, clues_guide, form_schema, correct_answers)
VALUES (
    1,
    'Hồ sơ chuyên án: Bảo tàng Aureum',
    'Tại bảo tàng Aureum, những hiện vật quý giá đã bị đánh cắp ngay trước ngày triển lãm. Các thám tử hãy truy vấn dữ liệu camera và nhật ký ra vào để tìm ra thông tin then chốt.',
    'Gợi ý: Hãy kiểm tra bảng `challenge.artifacts` và `challenge.access_logs` vào khoảng đêm ngày 10/10.',
    '[
        {"key": "stolen_item", "label": "Hiện vật bị đánh cắp", "type": "text", "placeholder": "Tên hiện vật"},
        {"key": "suspect", "label": "Đối tượng tình nghi", "type": "text", "placeholder": "Bí danh hoặc tên nghi phạm"},
        {"key": "crime_time", "label": "Thời gian đột nhập", "type": "text", "placeholder": "HH:MM (ví dụ 23:45)"}
    ]'::jsonb,
    '{
        "stolen_item": "Viên ngọc Parallax",
        "suspect": "NULL",
        "crime_time": "23:45"
    }'::jsonb
) ON CONFLICT (stage_number) DO NOTHING;

-- Seed dữ liệu điều tra mẫu vào schema challenge
INSERT INTO challenge.artifacts (name, room, estimated_value_usd, status) VALUES
('Viên ngọc Parallax', 'Phòng Trưng Bày Trung Tâm', 5000000.00, 'MISSING'),
('Vương miện Aureum', 'Phòng Hoàng Gia', 3500000.00, 'SECURE'),
('Bản thảo cổ thế kỷ XV', 'Kho Lưu Trữ A', 1200000.00, 'SECURE')
ON CONFLICT DO NOTHING;

INSERT INTO challenge.suspects (alias, full_name, role, known_affiliation) VALUES
('NULL', 'Chưa rõ danh tính', 'Bậc thầy công nghệ / Hacker', 'Bóng đêm Cipher'),
('Shadow_01', 'Arthur Vance', 'Cựu nhân viên bảo vệ', 'Ngoại vi'),
('Specter', 'Elena Rostova', 'Nhà thẩm định nghệ thuật', 'Độc lập')
ON CONFLICT DO NOTHING;

INSERT INTO challenge.access_logs (log_time, badge_id, person_name, door_accessed, access_granted) VALUES
('2026-10-10 22:15:00', 'GUARD_01', 'Arthur Vance', 'Cửa Chính', true),
('2026-10-10 23:30:00', 'TECH_09', 'Elena Rostova', 'Kho Lưu Trữ A', true),
('2026-10-10 23:45:00', 'UNKNOWN_GHOST', 'NULL (Bypass Cipher)', 'Phòng Trưng Bày Trung Tâm', true),
('2026-10-10 23:58:00', 'GUARD_02', 'Nguyen Van A', 'Cổng Sau', true)
ON CONFLICT DO NOTHING;
