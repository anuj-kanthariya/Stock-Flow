import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from app.core.config import settings

import logging

logger = logging.getLogger(__name__)

class StorageProvider:
    async def upload(self, file: UploadFile, directory: str, user_id: str, filename_prefix: str, token: str = None) -> str:
        raise NotImplementedError
        
    async def delete(self, path_or_url: str, directory: str, token: str = None):
        pass

class LocalStorageProvider(StorageProvider):
    async def upload(self, file: UploadFile, directory: str, user_id: str, filename_prefix: str, token: str = None) -> str:
        # Create directory if it doesn't exist (local dev only)
        os.makedirs(f"uploads/{directory}/{user_id}", exist_ok=True)
        
        ext = os.path.splitext(file.filename)[1].lower()
        new_filename = f"{filename_prefix}-{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join("uploads", directory, user_id, new_filename)
        
        file_content = await file.read()
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(file_content)
            
        return f"/uploads/{directory}/{user_id}/{new_filename}"

class VercelEphemeralStorageProvider(StorageProvider):
    async def upload(self, file: UploadFile, directory: str, user_id: str, filename_prefix: str, token: str = None) -> str:
        # In Vercel, the filesystem is read-only or ephemeral.
        raise HTTPException(
            status_code=501, 
            detail="File uploads are disabled in this environment. Please configure an external storage provider."
        )

class SupabaseStorageProvider(StorageProvider):
    def __init__(self):
        from supabase import create_client, Client
        url: str = settings.SUPABASE_URL
        key: str = settings.SUPABASE_KEY
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables for SupabaseStorageProvider")
        self.supabase: Client = create_client(url, key)

    async def upload(self, file: UploadFile, directory: str, user_id: str, filename_prefix: str, token: str = None) -> str:
        # directory corresponds to the bucket name
        ext = os.path.splitext(file.filename)[1].lower()
        new_filename = f"{filename_prefix}-{uuid.uuid4().hex[:8]}{ext}"
        
        # Scoped path: e.g. avatars/{user_id}/avatar-uuid.png
        supabase_path = f"{user_id}/{new_filename}"
        
        content_type = file.content_type or "application/octet-stream"
        file_content = await file.read()
        
        # Use an authenticated client if token is provided
        client = self.supabase
        if token:
            from supabase import create_client, ClientOptions
            client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY,
                options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
            )
        
        # Upload to Supabase Storage
        from fastapi.concurrency import run_in_threadpool
        try:
            res = await run_in_threadpool(
                client.storage.from_(directory).upload,
                file=file_content,
                path=supabase_path,
                file_options={"content-type": content_type, "x-upsert": "true"}
            )
        except Exception as e:
            logger.error("SUPABASE_STORAGE_UPLOAD_EXCEPTION\nexception_type=%s\nexception_message=%s", type(e).__name__, str(e), exc_info=True)
            
            # Extract error message if it's a StorageApiError or similar JSON response
            detail = "Failed to upload file to storage provider. Please try again."
            if hasattr(e, 'to_dict'):
                try:
                    err_dict = e.to_dict()
                    if 'message' in err_dict:
                        detail = f"Upload failed: {err_dict['message']}"
                except:
                    pass
            elif hasattr(e, 'message'):
                detail = f"Upload failed: {e.message}"
            else:
                detail = f"Upload failed: {str(e)}"
                
            raise HTTPException(status_code=500, detail=detail)
            
        # Get public URL
        public_url = client.storage.from_(directory).get_public_url(supabase_path)
        return public_url

    async def delete(self, path_or_url: str, directory: str, token: str = None):
        client = self.supabase
        if token:
            from supabase import create_client, ClientOptions
            client = create_client(
                self.supabase.supabase_url,
                self.supabase.supabase_key,
                options=ClientOptions(headers={"Authorization": f"Bearer {token}"})
            )
        
        try:
            path = path_or_url
            if "public/" + directory + "/" in path_or_url:
                path = path_or_url.split("public/" + directory + "/")[1].split("?")[0]
                
            from fastapi.concurrency import run_in_threadpool
            await run_in_threadpool(
                client.storage.from_(directory).remove,
                [path]
            )
        except Exception as e:
            logger.error("SUPABASE_STORAGE_DELETE_EXCEPTION\nexception_type=%s\nexception_message=%s", type(e).__name__, str(e), exc_info=True)

# Factory to get the appropriate storage provider
def get_storage_provider() -> StorageProvider:
    # Always use Supabase in Vercel production to avoid read-only filesystem errors
    if os.getenv("VERCEL"):
        return SupabaseStorageProvider()
        
    provider = settings.STORAGE_PROVIDER.lower()
    if provider == "supabase":
        return SupabaseStorageProvider()
    elif provider == "vercel":
        return VercelEphemeralStorageProvider()
    else:
        return LocalStorageProvider()

storage = get_storage_provider()

