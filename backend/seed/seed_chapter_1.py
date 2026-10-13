"""Update question content without resetting team progress or submissions."""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.game_content import QUESTIONS
from app.models.stage import Stage


async def seed():
    async with AsyncSessionLocal() as session:
        for question in QUESTIONS:
            result = await session.execute(select(Stage).where(Stage.stage_number == question["number"]))
            stage = result.scalar_one_or_none()
            if stage is None:
                stage = Stage(stage_number=question["number"])
                session.add(stage)
            stage.title = question["title"]
            stage.story_description = question["description"]
            stage.clues_guide = f"Định dạng trả lời: {question['format']}. Ví dụ: {question['placeholder']}. Nộp một chuỗi duy nhất, giữ nguyên dấu gạch nối và dấu hai chấm nếu có."
            stage.form_schema = [{
                "key": "answer", "label": f"Đáp án: {question['format']}",
                "type": "text", "placeholder": question["placeholder"], "required": True,
            }]
            stage.correct_answers = {"answer": {"value": question["answer"], "format": "exact"}}
        await session.commit()
    print("Updated Chapter 1: 3 questions. Existing team progress and submission history preserved.")


if __name__ == "__main__":
    asyncio.run(seed())
