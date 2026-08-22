"""
StockFlow Backend – FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.middleware.logging import LoggingMiddleware
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)
from app.routers import (
    auth,
    users,
    products,
    categories,
    customers,
    invoices,
    stock_transactions,
    reports,
    settings as settings_router,
    google,
)

# Conditionally ensure uploads directory exists
# In serverless environments like Vercel, the filesystem is often read-only, so we skip this.
try:
    os.makedirs("uploads/products", exist_ok=True)
except OSError:
    pass


app = FastAPI(
    title=settings.APP_NAME,
    description="Smart Inventory & Billing API for Modern Wholesalers",
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

@app.on_event("startup")
async def db_schema_migration():
    from app.database.database import engine
    from sqlalchemy import text
    if not engine:
        logger.warning("Skipping DB migration: Database engine is not initialized (DATABASE_URL missing).")
        return
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE customers ADD COLUMN IF NOT EXISTS show_in_main_list BOOLEAN DEFAULT FALSE;"))
    except Exception as e:
        logger.exception("FATAL: Schema migration failed during startup.")
        raise

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Exception Handlers ───────────────────────────────────────────────────────
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request, exc: SQLAlchemyError):
    logger.exception("Database error occurred while processing request to %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "A server error occurred while accessing the database. Please try again later."}
    )

# ─── Custom Middleware ────────────────────────────────────────────────────────
app.add_middleware(LoggingMiddleware)

# ─── Static Files ─────────────────────────────────────────────────────────────
try:
    if os.path.exists("uploads"):
        app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
except Exception:
    pass

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(google.router, prefix="/api/v1/google", tags=["google"])
app.include_router(invoices.router, prefix="/api/v1/invoices", tags=["Invoices"])
app.include_router(stock_transactions.router, prefix="/api/v1/stock", tags=["Stock"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "StockFlow API is running",
        "version": settings.APP_VERSION,
        "docs": "/api/docs",
    }


@app.get("/api/health", tags=["Health"])
async def health_check():
    from app.database.database import engine
    from sqlalchemy import text
    if not engine:
        return JSONResponse(status_code=503, content={"status": "unhealthy", "detail": "Database engine not initialized"})
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.exception("Health check failed")
        return JSONResponse(status_code=503, content={"status": "unhealthy", "detail": "Database connection failed"})
