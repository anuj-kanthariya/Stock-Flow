"""Users, Stock, Reports, and Settings router stubs."""
from fastapi import APIRouter, Depends
from app.schemas.schemas import (
    UserCreate,
    UserUpdate,
    UserResponse,
    StockTransactionCreate,
    StockTransactionResponse,
    DashboardStats,
    AppSettingsUpdate,
    AppSettingsResponse,
)
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_active_user, get_db
from app.models.models import User
import os
from fastapi import File, UploadFile, HTTPException
from app.utils.storage import storage

# ─── Users ────────────────────────────────────────────────────────────────────
router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(data: UserUpdate, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        return current_user

    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    # Check if profile is complete based on required fields
    required_fields = ["company_name", "phone", "business_address"]
    is_complete = True
    for field in required_fields:
        if not getattr(current_user, field):
            is_complete = False
            break
            
    current_user.profile_completed = is_complete

    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/logo", response_model=UserResponse)
async def upload_company_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: jpg, jpeg, png, webp, svg")
    
    image_url = await storage.upload(file, "logos", str(current_user.id))
    current_user.company_logo_url = image_url
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.patch("/me/password")
async def change_password(current_password: str, new_password: str, current_user: User = Depends(get_current_active_user)):
    raise NotImplementedError
