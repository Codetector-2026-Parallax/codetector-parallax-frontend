import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.team import Team

SAMPLE_TEAMS = [
    {
        "team_name": "Đội Thử Nghiệm Alpha",
        "username": "test",
        "password": "1234",
    },
    {
        "team_name": "Shadow Cipher",
        "username": "detective_01",
        "password": "PassWord#2026A",
    },
    {
        "team_name": "Aureum Enigma",
        "username": "detective_02",
        "password": "PassWord#2026B",
    },
    {
        "team_name": "Quantum Clue",
        "username": "detective_03",
        "password": "PassWord#2026C",
    },
]


async def seed():
    print("Bắt đầu khởi tạo tài khoản đội thi...")
    async with AsyncSessionLocal() as session:
        for t in SAMPLE_TEAMS:
            stmt = select(Team).where(Team.username == t["username"])
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            if existing:
                print(f"Đội {t['username']} đã tồn tại trong database (Bỏ qua).")
                continue

            new_team = Team(
                team_name=t["team_name"],
                username=t["username"],
                password_hash=hash_password(t["password"]),
                current_stage=1,
                is_active=True,
            )
            session.add(new_team)
            print(f"Đã tạo đội: {t['team_name']} ({t['username']}) - Mật khẩu: {t['password']}")

        await session.commit()
    print("Hoàn tất seed dữ liệu đội thi!")


if __name__ == "__main__":
    asyncio.run(seed())
