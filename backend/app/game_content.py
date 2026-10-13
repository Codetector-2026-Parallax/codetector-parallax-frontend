"""Chapter 1 content from the organizer's Google Doc. Answers stay server-side."""

CHAPTER_NUMBER = 1
CHAPTER_TITLE = "Truy tìm thủ phạm"
CASE_DESCRIPTION = """Bảo tàng X (số 25 đường Y) báo cáo mất trộm "Ấn vàng" (id_report = 1) vào ngày 10/10/2026. Hệ thống ghi nhận dữ liệu kỹ thuật gồm rất nhiều biến động về xe cộ, giao dịch tài chính và lượt ra vào bảo tàng trong khung giờ chiều.

Đội ngũ điều tra được cung cấp quyền truy vấn cơ sở dữ liệu MuniDB. Dữ liệu kỹ thuật chứa rất nhiều bẫy nhiễu: nhiều xe màu đỏ tẩu thoát cùng lúc, nhiều giao dịch ATM trùng giờ và nhiều người cùng vào phòng trưng bày do đổi ca. Nếu chỉ dùng câu lệnh SQL thuần túy, bạn có thể sa vào ma trận nghi án oan sai.

Yêu cầu bắt buộc: Kết hợp phân tích hệ thống lời khai nhân chứng (witness_statement), đặc biệt là các lời khai số 1, 5, 6, 15 và 16, để phá giải các bẫy logic và truy tìm ra đúng một nghi phạm duy nhất. Trả lời đúng từng câu theo thứ tự để mở khóa câu tiếp theo."""

QUESTIONS = [
    {
        "number": 1,
        "title": "Truy vết xe và hợp đồng thuê",
        "description": "Tìm biển số xe và mã hợp đồng thuê xe của nghi phạm vào chiều 10/10/2026.",
        "format": "Biển Số_Mã Hợp Đồng",
        "placeholder": "30A-xxxxx_xx",
        "answer": "30A-12345_41",
    },
    {
        "number": 2,
        "title": "Truy vết giao dịch ATM",
        "description": "Tìm mã giao dịch ATM và ID của nghi phạm thực hiện giao dịch lúc rút tiền lén lút.",
        "format": "Mã Giao Dịch_ID User",
        "placeholder": "xxx_xxx",
        "answer": "702_102",
    },
    {
        "number": 3,
        "title": "Xác định nghi phạm và thời điểm gây án",
        "description": "Tìm ID nghi phạm và thời điểm (giờ:phút) bước vào phòng trưng bày số 3 để lấy cắp báu vật.",
        "format": "ID User_HH:MM",
        "placeholder": "xxx_xx:xx",
        "answer": "102_17:24",
    },
]

TOTAL_QUESTIONS = len(QUESTIONS)
