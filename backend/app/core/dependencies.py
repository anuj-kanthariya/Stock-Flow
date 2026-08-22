from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_supabase_user
from app.database.database import get_db
from app.models.models import User

import uuid

async def get_current_user(
    supabase_user: dict = Depends(get_supabase_user),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Fetch the current user, or create one if it's their first login."""
    try:
        uid = uuid.UUID(supabase_user["id"])
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user ID format")
        
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    
    if not user:
        # First-time login: create the profile automatically
        try:
            # Fallback name if none provided
            name = supabase_user.get("full_name")
            if not name or not name.strip():
                name = supabase_user.get("email") or "Unknown User"
                
            user = User(
                id=uid,
                name=name,
                email=supabase_user.get("email"),
                role="owner", # Default new signups to owner so they can use the app
                avatar_url=supabase_user.get("avatar_url", ""),
                is_active=True,
                profile_completed=False,
                invoice_prefix="INV",
                invoice_numbering_preference="sequential"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        except Exception as e:
            await db.rollback()
            print(f"Failed to create user profile: {e}")
            raise HTTPException(status_code=500, detail="Failed to create user profile")
            
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure the current user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_owner(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Ensure the current user has the 'owner' role."""
    if current_user.role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Owner access required."
        )
    return current_user
