import asyncio
from app.core.db import AsyncSessionLocal
from sqlalchemy import update
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as session:
        await session.execute(update(User).where(User.username == 'admin').values(is_superuser=True))
        await session.commit()
        print('Superuser updated')

if __name__ == "__main__":
    asyncio.run(main())
