from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from datetime import datetime, timezone, timedelta
import os

from app.database.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.models import User, GoogleConnection
from app.schemas.schemas import GoogleSyncTokensRequest, GoogleContactsListResponse, GoogleContactResponse

router = APIRouter()

from app.core.config import settings

GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET

def get_current_utc():
    return datetime.now(timezone.utc)

@router.post("/sync-tokens")
async def sync_google_tokens(
    request: GoogleSyncTokensRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    # Store or update the tokens
    result = await db.execute(select(GoogleConnection).where(GoogleConnection.user_id == current_user.id))
    connection = result.scalar_one_or_none()

    # The access token from Supabase usually lives for 1 hour
    expires_at = get_current_utc() + timedelta(seconds=3599)

    if connection:
        connection.access_token = request.access_token
        if request.refresh_token:
            connection.refresh_token = request.refresh_token
        connection.expires_at = expires_at
    else:
        connection = GoogleConnection(
            user_id=current_user.id,
            access_token=request.access_token,
            refresh_token=request.refresh_token,
            expires_at=expires_at
        )
        db.add(connection)

    await db.commit()
    return {"message": "Google Contacts synced successfully"}

@router.get("/contacts", response_model=GoogleContactsListResponse)
async def get_google_contacts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(GoogleConnection).where(GoogleConnection.user_id == current_user.id))
    connection = result.scalar_one_or_none()

    if not connection:
        raise HTTPException(status_code=404, detail="Google Contacts not connected.")

    # Check if token needs refresh
    if connection.expires_at <= get_current_utc() + timedelta(minutes=5):
        if not connection.refresh_token:
            # Need reauth
            raise HTTPException(status_code=401, detail="GOOGLE_REAUTH_REQUIRED")
        
        # Refresh token
        async with httpx.AsyncClient() as client:
            refresh_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "refresh_token": connection.refresh_token,
                    "grant_type": "refresh_token"
                }
            )
            
        if refresh_response.status_code != 200:
            raise HTTPException(status_code=401, detail="GOOGLE_REAUTH_REQUIRED")
            
        token_data = refresh_response.json()
        connection.access_token = token_data.get("access_token")
        connection.expires_at = get_current_utc() + timedelta(seconds=token_data.get("expires_in", 3599))
        await db.commit()

    # Call Google People API
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://people.googleapis.com/v1/people/me/connections",
            params={
                "personFields": "names,emailAddresses,phoneNumbers,photos",
                "pageSize": 1000
            },
            headers={
                "Authorization": f"Bearer {connection.access_token}"
            }
        )

    if response.status_code != 200:
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="GOOGLE_REAUTH_REQUIRED")
        raise HTTPException(status_code=500, detail="Failed to fetch Google Contacts.")

    data = response.json()
    connections = data.get("connections", [])
    
    formatted_contacts = []
    for conn in connections:
        # Get emails
        email = None
        emails = conn.get("emailAddresses", [])
        if emails:
            email = emails[0].get("value")
            
        # Get phones
        phone = None
        phones = conn.get("phoneNumbers", [])
        if phones:
            phone = phones[0].get("value")

        # Get name with fallback
        name = conn.get("names", [{}])[0].get("displayName")
        if not name:
            name = email if email else phone
            if not name:
                continue
                
        # Get photo
        photo = None
        photos = conn.get("photos", [])
        if photos:
            photo = photos[0].get("url")
            
        formatted_contacts.append(GoogleContactResponse(
            name=name,
            phone=phone,
            email=email,
            photo=photo
        ))

    # Sort contacts alphabetically by name (case-insensitive)
    formatted_contacts.sort(key=lambda x: (x.name or "").lower())

    return GoogleContactsListResponse(contacts=formatted_contacts)

@router.delete("/disconnect")
async def disconnect_google(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(GoogleConnection).where(GoogleConnection.user_id == current_user.id))
    connection = result.scalar_one_or_none()

    if connection:
        await db.delete(connection)
        await db.commit()

    return {"message": "Disconnected successfully"}
