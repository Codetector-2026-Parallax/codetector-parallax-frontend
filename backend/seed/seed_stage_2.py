import asyncio
from app.core.database import AsyncSessionLocal
from app.models.stage import Stage
from sqlalchemy import select


async def seed():
    async with AsyncSessionLocal() as session:
        # Check if Stage 2 already exists
        stmt = select(Stage).where(Stage.stage_number == 2)
        res = await session.execute(stmt)
        existing = res.scalar_one_or_none()

        stage_2_data = {
            "title": "Chặng 2: Cuộc đào tẩu - Lần theo dấu vết xe SUV đen",
            "story_description": "Sau khi lấy cắp viên ngọc Parallax, kẻ trộm đã tẩu thoát cùng đồng bọn. Hãy truy vết dữ liệu bãi đỗ xe (carpark_history), hợp đồng thuê xe (car_rental), và hồ sơ nhân vật (users) để vạch trần kẻ đứng tên thuê xe và tài xế lái xe tẩu thoát!",
            "clues_guide": "Gợi ý: Kiểm tra chiếc xe SUV màu Đen trong bảng `car` và `carpark_history`, sau đó truy cứu bảng `car_rental` để tìm tên người thuê (id_renter) và tài xế (id_driver).",
            "form_schema": [
                {
                    "key": "escape_plate",
                    "label": "Biển số xe tẩu thoát",
                    "type": "text",
                    "placeholder": "Ví dụ: 30H-999.88",
                    "required": True,
                },
                {
                    "key": "renter_name",
                    "label": "Họ tên người đứng tên hợp đồng thuê xe",
                    "type": "text",
                    "placeholder": "Ví dụ: Elena Rostova",
                    "required": True,
                },
                {
                    "key": "driver_name",
                    "label": "Họ tên tài xế chở kẻ trộm tẩu thoát",
                    "type": "text",
                    "placeholder": "Ví dụ: Marcus Cole",
                    "required": True,
                },
            ],
            "correct_answers": {
                "escape_plate": "30H-999.88",
                "renter_name": "Elena Rostova",
                "driver_name": "Marcus Cole",
            },
        }

        if existing:
            existing.title = stage_2_data["title"]
            existing.story_description = stage_2_data["story_description"]
            existing.clues_guide = stage_2_data["clues_guide"]
            existing.form_schema = stage_2_data["form_schema"]
            existing.correct_answers = stage_2_data["correct_answers"]
            print("Đã cập nhật Chặng 2.")
        else:
            new_stage = Stage(
                stage_number=2,
                title=stage_2_data["title"],
                story_description=stage_2_data["story_description"],
                clues_guide=stage_2_data["clues_guide"],
                form_schema=stage_2_data["form_schema"],
                correct_answers=stage_2_data["correct_answers"],
            )
            session.add(new_stage)
            print("Đã khởi tạo Chặng 2.")

        await session.commit()
    print("Hoàn tất thiết lập 2 Chặng thi đấu!")


if __name__ == "__main__":
    asyncio.run(seed())
