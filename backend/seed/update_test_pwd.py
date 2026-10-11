import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.team import Team
from sqlalchemy import update


async def run():
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(Team)
            .where(Team.username == "test")
            .values(password_hash=hash_password("1234"))
        )
        await session.commit()
    print("Cập nhật mật khẩu test thành công!")


if __name__ == "__main__":
    asyncio.run(run())
