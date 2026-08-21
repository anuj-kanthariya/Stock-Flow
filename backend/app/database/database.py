"""
SQLAlchemy async engine and session factory.
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# ─── Engine & Session Factory ──────────────────────────────────────────────────
if not settings.DATABASE_URL:
    print("WARNING: DATABASE_URL is not set. Database operations will fail.")
    engine = None
    AsyncSessionLocal = None
else:
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        poolclass=NullPool,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0,
        },
    )
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


# ─── Declarative Base ─────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ─── Dependency ───────────────────────────────────────────────────────────────
async def get_db() -> AsyncSession:
    """FastAPI dependency that provides a database session per request."""
    if not AsyncSessionLocal:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail="Database is not configured. Missing DATABASE_URL.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
