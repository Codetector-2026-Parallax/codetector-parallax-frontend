-- MuniDB challenge data from munidb (1).sql, converted to PostgreSQL.
-- Organizer-approved ID swaps align the data with the Google Doc answers:
-- rental 40 <-> 41, ATM transaction 701 <-> 702. Evidence and people are unchanged.
-- Invoke with target_schema and backup_schema psql variables.
-- The previous challenge schema is archived; app/team progress is preserved.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA :"target_schema";
SET LOCAL search_path TO :"target_schema";

CREATE TABLE "user" (
    id_user INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(20),
    age INTEGER,
    dob DATE,
    job VARCHAR(100),
    address VARCHAR(255)
);

CREATE TABLE museum (
    id_museum INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255)
);

CREATE TABLE room (
    id_room INTEGER PRIMARY KEY,
    id_museum INTEGER REFERENCES museum(id_museum),
    name VARCHAR(100) NOT NULL
);

CREATE TABLE artifact (
    id_artifact INTEGER PRIMARY KEY,
    id_room INTEGER REFERENCES room(id_room),
    name VARCHAR(100) NOT NULL
);

CREATE TABLE theft_report (
    id_report INTEGER PRIMARY KEY,
    id_artifact INTEGER REFERENCES artifact(id_artifact),
    last_seen_at TIMESTAMP NOT NULL,
    discovered_at TIMESTAMP NOT NULL
);

CREATE TABLE carpark (
    id_carpark INTEGER PRIMARY KEY,
    id_museum INTEGER REFERENCES museum(id_museum),
    name VARCHAR(100),
    address VARCHAR(255)
);

CREATE TABLE car (
    id_car INTEGER PRIMARY KEY,
    plate_number VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(50),
    create_date DATE,
    is_rental SMALLINT CHECK (is_rental IN (0, 1)),
    color VARCHAR(50)
);

CREATE TABLE carpark_history (
    id_location INTEGER REFERENCES carpark(id_carpark),
    id_car INTEGER REFERENCES car(id_car),
    entrance_time TIMESTAMP,
    exit_time TIMESTAMP,
    camera_code VARCHAR(50),
    PRIMARY KEY (id_car, entrance_time)
);

CREATE TABLE carrental (
    id_rental INTEGER PRIMARY KEY,
    id_car INTEGER REFERENCES car(id_car),
    id_dealer INTEGER REFERENCES "user"(id_user),
    id_renter INTEGER REFERENCES "user"(id_user),
    id_driver INTEGER REFERENCES "user"(id_user),
    rental_time TIMESTAMP NOT NULL,
    return_time TIMESTAMP NOT NULL,
    organization VARCHAR(100)
);

CREATE TABLE atm (
    id_atm INTEGER PRIMARY KEY,
    name VARCHAR(100),
    address VARCHAR(255)
);

CREATE TABLE atm_transaction (
    transaction_id INTEGER PRIMARY KEY,
    person_id INTEGER REFERENCES "user"(id_user),
    atm_id INTEGER REFERENCES atm(id_atm),
    transaction_time TIMESTAMP NOT NULL,
    amount DECIMAL(18,2)
);

CREATE TABLE call_log (
    id_call INTEGER PRIMARY KEY,
    calling_time TIMESTAMP NOT NULL,
    id_caller INTEGER REFERENCES "user"(id_user),
    id_receiver INTEGER REFERENCES "user"(id_user),
    duration_time DOUBLE PRECISION
);

CREATE TABLE museum_log (
    id_visit INTEGER PRIMARY KEY,
    id_user INTEGER REFERENCES "user"(id_user),
    id_room INTEGER REFERENCES room(id_room),
    event_type VARCHAR(20),
    recorded_at TIMESTAMP NOT NULL
);

CREATE TABLE witness_statement (
    id_statement INTEGER PRIMARY KEY,
    id_witness INTEGER REFERENCES "user"(id_user),
    statement_text TEXT NOT NULL,
    recorded_at TIMESTAMP NOT NULL
);

INSERT INTO "user" (id_user, name, gender, age, dob, job, address) VALUES
(20, 'Minh', 'Nam', 42, '1984-03-12', 'Đại lý cho thuê xe', '10 đường P'),
(21, 'Hùng', 'Nam', 38, '1988-06-18', 'Đại lý cho thuê xe', '12 đường P'),
(101, 'Bình', 'Nam', 31, '1995-02-14', 'Kế toán', '11 đường A'),
(102, 'Nam', 'Nam', 28, '1998-07-20', 'Kỹ thuật viên', '18 đường M, phòng 302'), 
(103, 'Huy', 'Nam', 29, '1997-01-05', 'Nhân viên văn phòng', '20 đường B'),
(109, 'Long', 'Nam', 30, '1996-05-19', 'Tài xế', '22 đường C'),
(104, 'Thu', 'Nữ', 27, '1999-08-25', 'Giáo viên', '24 đường D'),
(105, 'Khánh', 'Nam', 32, '1994-04-11', 'Kỹ sư', '26 đường E'),
(106, 'Dũng', 'Nam', 33, '1993-10-01', 'Nhân viên kinh doanh', '28 đường F'),
(107, 'Tuấn', 'Nam', 26, '2000-03-10', 'Nhân viên IT', '15 đường X'),
(108, 'Phương', 'Nữ', 25, '2001-09-12', 'Sinh viên', '17 đường Z'),
(110, 'Việt', 'Nam', 34, '1992-12-01', 'Kiến trúc sư', '19 đường K'),
(111, 'Trang', 'Nữ', 29, '1997-04-15', 'Nhân viên truyền thông', '21 đường L'),
(301, 'Quang', 'Nam', 36, '1989-11-02', 'Bảo vệ bãi đỗ xe', '30 đường G'),
(302, 'Lan', 'Nữ', 39, '1987-02-08', 'Bán hàng', '32 đường H'),
(303, 'Hoa', 'Nữ', 34, '1992-09-15', 'Nhân viên soát vé', '34 đường K'),
(304, 'Sơn', 'Nam', 35, '1990-12-10', 'Bảo vệ', '36 đường L'),
(305, 'Mai', 'Nữ', 41, '1985-03-30', 'Bán hàng', '38 đường N'),
(306, 'Hải', 'Nam', 35, '1991-07-07', 'Nhân viên bảo tàng', '40 đường Q'),
(500, 'An', 'Nam', 28, '1998-01-02', 'Nhân viên văn phòng', '42 đường R'),
(501, 'Linh', 'Nữ', 29, '1997-05-06', 'Nhân viên văn phòng', '44 đường S');

INSERT INTO museum (id_museum, name, address) VALUES
(1, 'Bảo tàng X', '25 đường Y'),
(2, 'Bảo tàng Y', '60 đường V');

INSERT INTO room (id_room, id_museum, name) VALUES
(1, 1, 'Sảnh vé'),
(3, 1, 'Phòng trưng bày số 3'),
(4, 1, 'Nhà vệ sinh'),
(8, 2, 'Phòng trưng bày chính');

INSERT INTO artifact (id_artifact, id_room, name) VALUES
(50, 3, 'Ấn vàng'),
(51, 3, 'Bình gốm cổ'),
(52, 8, 'Kiếm cổ');

INSERT INTO theft_report (id_report, id_artifact, last_seen_at, discovered_at) VALUES
(1, 50, '2026-10-10 17:20:00', '2026-10-10 17:45:00');

INSERT INTO carpark (id_carpark, id_museum, name, address) VALUES
(31, 1, 'Bãi phía trước', 'Cổng trước, 25 đường Y'),
(32, 1, 'Bãi phía sau', 'Cổng sau, 25 đường Y');

INSERT INTO car (id_car, plate_number, brand, create_date, is_rental, color) VALUES
(12, '30A-12345', 'Toyota', '2022-01-10', 1, 'Đỏ'), 
(15, '30A-23456', 'Honda', '2021-03-20', 1, 'Đỏ'),  
(18, '30A-34567', 'Mazda', '2023-02-15', 1, 'Đỏ'),  
(22, '30A-45678', 'Toyota', '2020-05-04', 1, 'Đen');

INSERT INTO carpark_history (id_location, id_car, entrance_time, exit_time, camera_code) VALUES
(31, 12, '2026-10-10 14:55:00', '2026-10-10 17:34:00', 'CAM-X-FRONT'), 
(31, 15, '2026-10-10 14:50:00', '2026-10-10 17:36:00', 'CAM-X-FRONT'), 
(31, 18, '2026-10-10 14:58:00', '2026-10-10 17:39:00', 'CAM-X-FRONT'); 

INSERT INTO carrental (id_rental, id_car, id_dealer, id_renter, id_driver, rental_time, return_time, organization) VALUES
(41, 12, 20, 102, 102, '2026-10-10 14:00:00', '2026-10-10 18:10:00', 'Minh Car'),
(40, 15, 21, 103, 109, '2026-10-10 14:00:00', '2026-10-10 19:00:00', 'Hùng Car'),
(42, 18, 20, 104, 104, '2026-10-10 14:10:00', '2026-10-10 19:00:00', 'Minh Car');

INSERT INTO atm (id_atm, name, address) VALUES
(7, 'ATM ngân hàng Z', 'Trước ngân hàng Z, số 8 đường T'),
(8, 'ATM ngân hàng K', 'Gần cổng Bảo tàng X, số 25 đường Y');

INSERT INTO atm_transaction (transaction_id, person_id, atm_id, transaction_time, amount) VALUES
(702, 102, 7, '2026-10-10 14:35:00', 3000000),
(701, 104, 7, '2026-10-10 14:35:00', 1000000),
(703, 105, 7, '2026-10-10 14:37:00', 2000000);

INSERT INTO call_log (id_call, calling_time, id_caller, id_receiver, duration_time) VALUES
(801, '2026-10-10 15:12:00', 102, NULL, 95);

INSERT INTO museum_log (id_visit, id_user, id_room, event_type, recorded_at) VALUES
(901, 102, 1, 'enter', '2026-10-10 14:58:00'),
(902, 102, 4, 'enter', '2026-10-10 15:02:00'), 
(903, 102, 4, 'exit', '2026-10-10 17:22:00'),
(904, 102, 3, 'enter', '2026-10-10 17:24:00'),

(905, 104, 3, 'enter', '2026-10-10 17:21:00'),
(906, 105, 3, 'enter', '2026-10-10 17:22:00'),
(907, 107, 3, 'enter', '2026-10-10 17:23:00'),
(908, 108, 3, 'enter', '2026-10-10 17:25:00'),
(909, 110, 3, 'enter', '2026-10-10 17:26:00'),
(910, 111, 3, 'enter', '2026-10-10 17:27:00');

INSERT INTO witness_statement (id_statement, id_witness, statement_text, recorded_at) VALUES
(1, 301, 'Ngày 10/10/2026, khoảng 17:30–17:40, tôi thấy chiếc xe màu đỏ rời bãi đỗ phía trước Bảo tàng X rất vội vã lúc 17:34.', '2026-10-11 08:00:00'), 
(5, 21, 'Tại đại lý Hùng Car, tôi nhớ rõ chiếc xe biển số 30A-23456 do Huy (103) đứng tên hộ, nhưng người lái thực tế là Long (109).', '2026-10-11 08:50:00'), 
(6, 302, 'Ngày 10/10/2026, khoảng 14:30–14:50, tôi thấy một người vừa nhận xe ở khu vực đường P đã ghé vào cây ATM trước ngân hàng Z ở số 8 đường T để rút tiền mặt với thái độ rất lén lút.', '2026-10-11 08:20:00'), 
(15, 304, 'Tôi là nhân viên vệ sinh bảo tàng, chiều 10/10 tôi thấy rất nhiều người ra vào phòng trưng bày số 3 từ 17:20 đến 17:45 vì lúc đó bảo tàng đang chuẩn bị đóng cửa đổi ca.', '2026-10-11 11:00:00'), 
(16, 301, 'Nếu ai đó cố tình dùng bảng lịch sử ra vào phòng (Museum_log) để tìm kẻ gian mà không kiểm tra chuỗi thuê xe và ATM trước, họ sẽ sa vào ma trận vì có tới hàng loạt người vào phòng số 3 vào thời điểm đó!', '2026-10-11 11:15:00');

GRANT USAGE ON SCHEMA :"target_schema" TO game_player;
GRANT SELECT ON ALL TABLES IN SCHEMA :"target_schema" TO game_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA :"target_schema" GRANT SELECT ON TABLES TO game_player;
ALTER SCHEMA challenge RENAME TO :"backup_schema";
REVOKE ALL ON SCHEMA :"backup_schema" FROM game_player;
ALTER SCHEMA :"target_schema" RENAME TO challenge;
COMMIT;
