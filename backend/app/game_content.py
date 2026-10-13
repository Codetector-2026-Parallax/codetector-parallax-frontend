"""Chapter 1 content from the organizer's Google Doc. Answers stay server-side."""

CHAPTER_NUMBER = 1
CHAPTER_TITLE = "Truy tìm thủ phạm"
CASE_DESCRIPTION = """Bảo tàng X, tọa lạc tại số 25 đường Y, vừa báo cáo mất trộm một báu vật vô cùng quý giá (Ấn vàng). Vụ việc đã được ghi nhận trong hệ thống cơ sở dữ liệu của thành phố (MuniDB) tại bảng Theft_report với mã báo cáo id_report = 1.

Đội ngũ điều tra được cung cấp quyền truy vấn cơ sở dữ liệu MuniDB. Bằng cách viết các câu lệnh SQL kết hợp phân tích lời khai nhân chứng (witness_statement), hãy khảo sát cấu trúc và mối quan hệ giữa các bảng về lịch trình di chuyển, phương tiện, giao dịch tài chính và nhật ký ra vào bảo tàng.

Vượt qua các dữ liệu nhiễu và bẫy logic để tìm ra đúng một nghi phạm duy nhất khớp hoàn toàn với chuỗi hành vi phạm tội. Trả lời đúng từng câu theo thứ tự để mở khóa câu tiếp theo."""

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
