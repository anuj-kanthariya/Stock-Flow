"""
JWT token creation, verification, and password hashing utilities.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings

# ─── Password Hashing ─────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ─── OTP Utilities ────────────────────────────────────────────────────────────
import secrets

def generate_otp(length: int = 6) -> str:
    """Generate a cryptographically secure numeric OTP."""
    digits = "0123456789"
    return "".join(secrets.choice(digits) for _ in range(length))


# ─── JWT Tokens ───────────────────────────────────────────────────────────────
def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta
        else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create a signed JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


from supabase import create_async_client, AsyncClient

_async_supabase: Optional[AsyncClient] = None

async def get_async_supabase_client() -> AsyncClient:
    global _async_supabase
    if _async_supabase is None:
        _async_supabase = await create_async_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _async_supabase

async def get_supabase_user(token: str = Depends(oauth2_scheme)) -> dict:
    """FastAPI dependency: validate token and extract user details from Supabase."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Validate token against Supabase Auth service asynchronously to prevent event loop blocking
        client = await get_async_supabase_client()
        user_response = await client.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise credentials_exception
            
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "full_name": user_response.user.user_metadata.get("full_name", ""),
            "avatar_url": user_response.user.user_metadata.get("avatar_url", ""),
        }
    except Exception as e:
        print(f"Auth error: {e}")
        raise credentials_exception
