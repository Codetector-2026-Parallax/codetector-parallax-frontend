-- ========================================================
-- CODETECTOR 2026 - PARALLAX
-- DETECTIVE INVESTIGATION SCHEMA (challenge)
-- ========================================================

CREATE SCHEMA IF NOT EXISTS challenge;

-- 1. BẢNG USER (NGƯỜI DÙNG / NHÂN VẬT ĐIỀU TRA)
CREATE TABLE IF NOT EXISTS challenge.users (
    id_user SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    age INT,
    dob DATE,
    job VARCHAR(100)
);

-- Tạo view để query cả "user" lẫn "users" cho tiện
CREATE OR REPLACE VIEW challenge."user" AS SELECT * FROM challenge.users;

-- 2. BẢNG CALL_LOG (NHẬT KÝ ĐIỆN THOẠI)
CREATE TABLE IF NOT EXISTS challenge.call_log (
    id_call SERIAL PRIMARY KEY,
    calling_time TIMESTAMP NOT NULL,
    id_caller VARCHAR(50) NOT NULL,   -- hoặc liên kết id_user
    id_receiver VARCHAR(50) NOT NULL, -- hoặc liên kết id_user
    duration_time FLOAT NOT NULL      -- số phút gọi
);

-- 3. BẢNG ATM
CREATE TABLE IF NOT EXISTS challenge.atm (
    id_atm SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL
);

-- 4. BẢNG ATM_TRANSACTION (GIAO DỊCH RÚT/CHUYỂN TIỀN)
CREATE TABLE IF NOT EXISTS challenge.atm_transaction (
    transaction_id SERIAL PRIMARY KEY,
    person_id INT REFERENCES challenge.users(id_user),
    atm_id INT REFERENCES challenge.atm(id_atm),
    transaction_time TIMESTAMP NOT NULL,
    amount DECIMAL(15, 2) NOT NULL
);

-- 5. BẢNG MUSEUM (BẢO TÀNG)
CREATE TABLE IF NOT EXISTS challenge.museum (
    id_museum SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL
);

-- 6. BẢNG MUSEUM_LOG (NHẬT KÝ VÀO PHÒNG BẢO TÀNG)
CREATE TABLE IF NOT EXISTS challenge.museum_log (
    id_visit SERIAL PRIMARY KEY,
    id_user INT REFERENCES challenge.users(id_user),
    id_museum INT REFERENCES challenge.museum(id_museum),
    id_room INT NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'CHECK_IN', 'ALARM_TRIGGER', 'VAULT_OPEN'
    recorded_at TIMESTAMP NOT NULL
);

-- 7. BẢNG CARPARK (BÃI ĐỖ XE)
CREATE TABLE IF NOT EXISTS challenge.carpark (
    id_carpark SERIAL PRIMARY KEY,
    id_museum INT REFERENCES challenge.museum(id_museum),
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL
);

-- 8. BẢNG CAR (PHƯƠNG TIỆN XE HƠI)
CREATE TABLE IF NOT EXISTS challenge.car (
    id_car SERIAL PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    create_date DATE,
    is_rental BOOLEAN DEFAULT FALSE,
    color VARCHAR(30)
);

-- 9. BẢNG CARPARK_HISTORY (LỊCH SỬ XE RA VÀO BÃI)
CREATE TABLE IF NOT EXISTS challenge.carpark_history (
    id_location SERIAL PRIMARY KEY,
    id_carpark INT REFERENCES challenge.carpark(id_carpark),
    id_car INT REFERENCES challenge.car(id_car),
    entrace_time TIMESTAMP NOT NULL,
    exit_time TIMESTAMP,
    camera_code VARCHAR(50)
);

-- 10. BẢNG CARRENTAL (HỢP ĐỒNG THUÊ XE)
CREATE TABLE IF NOT EXISTS challenge.car_rental (
    id_rental SERIAL PRIMARY KEY,
    id_car INT REFERENCES challenge.car(id_car),
    id_dealer INT,
    id_renter INT REFERENCES challenge.users(id_user),
    id_driver INT REFERENCES challenge.users(id_user),
    rental_time TIMESTAMP NOT NULL,
    return_time TIMESTAMP,
    organization VARCHAR(150)
);

-- Tạo alias view "carRental"
CREATE OR REPLACE VIEW challenge."carRental" AS SELECT * FROM challenge.car_rental;
CREATE OR REPLACE VIEW challenge."carPark_History" AS SELECT * FROM challenge.carpark_history;
CREATE OR REPLACE VIEW challenge."ATM_Transaction" AS SELECT * FROM challenge.atm_transaction;
CREATE OR REPLACE VIEW challenge."Museum_log" AS SELECT * FROM challenge.museum_log;

-- CẤP QUYỀN CHO USER GAME_PLAYER CHỈ ĐƯỢC PHÉP TRUY VẤN ĐỌC
GRANT USAGE ON SCHEMA challenge TO game_player;
GRANT SELECT ON ALL TABLES IN SCHEMA challenge TO game_player;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA challenge TO game_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA challenge GRANT SELECT ON TABLES TO game_player;

-- ========================================================
-- FAKE DATA KỊCH BẢN PHÁ ÁN (MOCK DETECTIVE DATA)
-- ========================================================

-- 1. USERS (Bao gồm nghi phạm, đồng phạm, và người bình thường)
INSERT INTO challenge.users (id_user, name, gender, age, dob, job) VALUES
(1, 'Arthur Vance (NULL)', 'Nam', 34, '1992-05-14', 'Kỹ sư an ninh mạng / Cựu bảo vệ'),
(2, 'Elena Rostova', 'Nữ', 29, '1997-11-20', 'Môi giới nghệ thuật'),
(3, 'Marcus Cole', 'Nam', 41, '1985-02-08', 'Tài xế tự do'),
(4, 'Nguyen Van A', 'Nam', 45, '1981-08-12', 'Đội trưởng bảo vệ bảo tàng'),
(5, 'Tran Thi Bich', 'Nữ', 26, '2000-03-15', 'Hướng dẫn viên du lịch'),
(6, 'David Sterling', 'Nam', 55, '1971-09-30', 'Nhà sưu tầm cổ vật'),
(7, 'Le Hoang Long', 'Nam', 22, '2004-07-04', 'Sinh viên thực tập'),
(8, 'Pham Thu Thao', 'Nữ', 31, '1995-12-01', 'Kế toán trưởng')
ON CONFLICT (id_user) DO NOTHING;

-- 2. CALL_LOG (Các cuộc gọi bí mật trước và sau khi trộm cổ vật)
INSERT INTO challenge.call_log (id_call, calling_time, id_caller, id_receiver, duration_time) VALUES
(1, '2026-10-10 20:15:00', '1', '2', 4.5),  -- Arthur gọi Elena: Lên kế hoạch
(2, '2026-10-10 21:05:00', '2', '3', 2.1),  -- Elena gọi Marcus: Chuẩn bị xe đón
(3, '2026-10-10 21:40:00', '4', '8', 1.0),  -- Bảo vệ gọi kế toán
(4, '2026-10-10 23:50:00', '1', '3', 0.8),  -- Arthur gọi Marcus: "Xe đã ở cửa sau chưa?"
(5, '2026-10-11 00:10:00', '3', '2', 1.2),  -- Marcus gọi Elena: Đã tẩu thoát an toàn
(6, '2026-10-11 08:30:00', '5', '4', 3.0)   -- Báo cáo vụ việc buổi sáng
ON CONFLICT (id_call) DO NOTHING;

-- 3. ATM
INSERT INTO challenge.atm (id_atm, name, address) VALUES
(1, 'ATM Vietcombank - Cổng Bảo Tàng Aureum', 'Số 1 Phố Hoàng Gia, Hà Nội'),
(2, 'ATM Techcombank - Ga Trung Tâm', 'Số 45 Phố Điện Biên Phủ, Hà Nội'),
(3, 'ATM BIDV - Bến Xe Phía Tây', 'Số 120 Đường Giải Phóng, Hà Nội')
ON CONFLICT (id_atm) DO NOTHING;

-- 4. ATM_TRANSACTION (Rút tiền mặt bất thường trước giờ gây án)
INSERT INTO challenge.atm_transaction (transaction_id, person_id, atm_id, transaction_time, amount) VALUES
(1, 1, 1, '2026-10-10 22:30:00', 50000000.00), -- Arthur rút 50 triệu ngay cổng bảo tàng
(2, 5, 1, '2026-10-10 17:15:00', 2000000.00),
(3, 3, 2, '2026-10-10 20:00:00', 10000000.00), -- Marcus rút tiền xăng xe
(4, 7, 3, '2026-10-10 18:45:00', 500000.00)
ON CONFLICT (transaction_id) DO NOTHING;

-- 5. MUSEUM
INSERT INTO challenge.museum (id_museum, name, address) VALUES
(1, 'Bảo tàng Cổ vật Aureum', 'Số 1 Phố Hoàng Gia, Quận Hoàn Kiếm, Hà Nội')
ON CONFLICT (id_museum) DO NOTHING;

-- 6. MUSEUM_LOG (Nhật ký ra vào các phòng trưng bày)
INSERT INTO challenge.museum_log (id_visit, id_user, id_museum, id_room, event_type, recorded_at) VALUES
(1, 4, 1, 101, 'CHECK_IN', '2026-10-10 18:00:00'),
(2, 2, 1, 203, 'TICKET_SCAN', '2026-10-10 19:30:00'), -- Elena do thám phòng 203
(3, 1, 1, 999, 'BYPASS_CIPHER', '2026-10-10 23:45:00'), -- Arthur hack mở phòng chứa Parallax (Phòng 999)
(4, 1, 1, 999, 'VAULT_OPEN', '2026-10-10 23:48:00'),
(5, 4, 1, 999, 'ALARM_TRIGGER', '2026-10-10 23:55:00') -- Chuông báo động reo
ON CONFLICT (id_visit) DO NOTHING;

-- 7. CARPARK
INSERT INTO challenge.carpark (id_carpark, id_museum, name, address) VALUES
(1, 1, 'Bãi đỗ xe ngầm Aureum P1', 'Tầng hầm B1, Bảo tàng Aureum'),
(2, 1, 'Bãi đỗ xe ngoài trời Cổng Tây', 'Cổng Tây, Bảo tàng Aureum')
ON CONFLICT (id_carpark) DO NOTHING;

-- 8. CAR (Các phương tiện nghi vấn)
INSERT INTO challenge.car (id_car, plate_number, brand, create_date, is_rental, color) VALUES
(1, '30H-999.88', 'Ford Everest SUV', '2023-01-15', true, 'Đen mờ'),  -- Xe tẩu thoát
(2, '29A-123.45', 'Toyota Vios', '2020-05-10', false, 'Bạc'),
(3, '30E-777.12', 'Mercedes C300', '2022-09-20', false, 'Trắng'),
(4, '29D-456.78', 'Hyundai Accent', '2021-11-05', true, 'Xám')
ON CONFLICT (id_car) DO NOTHING;

-- 9. CARPARK_HISTORY (Camera ghi nhận xe ra vào bãi đêm gây án)
INSERT INTO challenge.carpark_history (id_location, id_carpark, id_car, entrace_time, exit_time, camera_code) VALUES
(1, 1, 1, '2026-10-10 23:10:00', '2026-10-11 00:05:00', 'CAM_GATE_WEST'), -- Xe SUV đen vào lúc 23:10 và vọt đi lúc 00:05!
(2, 1, 2, '2026-10-10 18:30:00', '2026-10-10 21:00:00', 'CAM_GATE_MAIN'),
(3, 2, 3, '2026-10-10 19:15:00', '2026-10-10 22:30:00', 'CAM_OUTDOOR_02')
ON CONFLICT (id_location) DO NOTHING;

-- 10. CAR_RENTAL (Hợp đồng thuê chiếc xe SUV đen)
INSERT INTO challenge.car_rental (id_rental, id_car, id_dealer, id_renter, id_driver, rental_time, return_time, organization) VALUES
(1, 1, 101, 2, 3, '2026-10-10 14:00:00', '2026-10-11 06:00:00', 'Công ty Nghệ Thuật Horizon (Bình phong)'),
(2, 4, 102, 5, 5, '2026-10-08 09:00:00', '2026-10-09 18:00:00', 'Cá nhân')
ON CONFLICT (id_rental) DO NOTHING;
