import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageProvider:
    async def upload(self, file: UploadFile, directory: str, filename_prefix: str) -> str:
        raise NotImplementedError

class LocalStorageProvider(StorageProvider):
    async def upload(self, file: UploadFile, directory: str, filename_prefix: str) -> str:
        # Create directory if it doesn't exist (local dev only)
        os.makedirs(f"uploads/{directory}", exist_ok=True)
        
        ext = os.path.splitext(file.filename)[1].lower()
        new_filename = f"{filename_prefix}-{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join("uploads", directory, new_filename)
        
        file_content = await file.read()
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(file_content)
            
        return f"/uploads/{directory}/{new_filename}"

class VercelEphemeralStorageProvider(StorageProvider):
    async def upload(self, file: UploadFile, directory: str, filename_prefix: str) -> str:
        # In Vercel, the filesystem is read-only or ephemeral.
        # This is a stub provider that prevents crashes but doesn't store anything persistently.
        # To fix this in production, you must implement S3, Supabase Storage, or Cloudinary.
        raise HTTPException(
            status_code=501, 
            detail="File uploads are disabled in this environment. Please configure an external storage provider."
        )

# Factory to get the appropriate storage provider
def get_storage_provider() -> StorageProvider:
    if settings.STORAGE_PROVIDER == "local":
        return LocalStorageProvider()
    elif settings.STORAGE_PROVIDER == "vercel":
        return VercelEphemeralStorageProvider()
    else:
        # Fallback to local
        return LocalStorageProvider()

storage = get_storage_provider()
