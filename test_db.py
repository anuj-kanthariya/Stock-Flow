import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine

async def test_connection():
    database_url = "postgresql+asyncpg://postgres.oybttnomdynltrtulcxt:MinorProject_28101902@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
    print(f"Testing connection to: {database_url}")
    try:
        engine = create_async_engine(database_url, echo=True)
        from sqlalchemy import text
        async with engine.connect() as conn:
            print("Connection successful, testing parameterized query...")
            await conn.execute(text("SELECT * FROM profiles WHERE id = :id"), {"id": "00000000-0000-0000-0000-000000000000"})
            print("Parameterized query successful!")
    except Exception as e:
        print("Exception:", e)

if __name__ == "__main__":
    asyncio.run(test_connection())
