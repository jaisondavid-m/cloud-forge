import os
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

from config import settings
from storage import (
    ensure_storage_dir,
    sanitize_and_validate_filename,
    get_safe_file_path,
    get_file_metadata,
    get_storage_status,
    list_files,
)

app = FastAPI(
    title="CloudForge Site-1 API",
    description="Primary File Manager Service for CloudForge Shared EFS Storage",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS strictly for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: Ensure storage directory is initialized
@app.on_event("startup")
async def startup_event():
    try:
        ensure_storage_dir()
    except Exception as e:
        print(f"[Warning] Failed to initialize storage mount directory: {e}")

class FileUpdatePayload(BaseModel):
    content: str = Field(..., description="Full text content for the file")

@app.get("/api/health")
async def health_check():
    """Health check endpoint indicating site status and timestamp."""
    return {
        "status": "healthy",
        "site": settings.SITE_NAME,
        "site_id": settings.SITE_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }

@app.get("/api/storage/status")
async def storage_status():
    """Returns EFS storage mount status, write capability, and disk usage."""
    return get_storage_status()

@app.get("/api/files")
async def get_files():
    """Lists all files stored in the shared EFS directory."""
    files = list_files()
    return {
        "count": len(files),
        "files": files,
        "site": settings.SITE_NAME,
    }

@app.post("/api/files/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(file: UploadFile = File(...)):
    """
    Uploads a new file to shared EFS storage.
    - Limits size to 10 MB.
    - Strictly prevents overwriting existing files (returns 409 Conflict).
    - Validates filename to prevent path traversal.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided in upload payload."
        )

    safe_name = sanitize_and_validate_filename(file.filename)
    target_path = get_safe_file_path(safe_name)

    # Prevent overwriting existing files
    if target_path.exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A file named '{safe_name}' already exists in shared storage. Overwriting is disabled to prevent accidental data loss."
        )

    # Read and enforce max file size limit (10 MB)
    max_bytes = settings.max_upload_bytes
    total_written = 0
    chunk_size = 64 * 1024  # 64 KB chunks

    try:
        with open(target_path, "wb") as buffer:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_written += len(chunk)
                if total_written > max_bytes:
                    # Clean up partially written file
                    buffer.close()
                    if target_path.exists():
                        target_path.unlink()
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_MB} MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception:
        if target_path.exists():
            try:
                target_path.unlink()
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file to shared storage."
        )
    finally:
        await file.close()

    metadata = get_file_metadata(target_path)
    return {
        "message": f"File '{safe_name}' uploaded successfully to shared storage.",
        "file": metadata,
    }

@app.get("/api/files/{filename}")
async def get_file(filename: str, download: bool = Query(False, description="Force download attachment")):
    """
    Fetches a file for preview or download.
    - If download=true, returns Content-Disposition attachment.
    - Otherwise returns inline for previewing.
    """
    target_path = get_safe_file_path(filename)

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{filename}' was not found in shared storage."
        )

    metadata = get_file_metadata(target_path)
    disposition = "attachment" if download else "inline"

    return FileResponse(
        path=target_path,
        media_type=metadata["mime_type"],
        filename=metadata["name"],
        content_disposition_type=disposition,
    )

@app.put("/api/files/{filename}")
async def update_file(filename: str, payload: FileUpdatePayload):
    """
    Updates the content of an existing text file in shared EFS storage.
    - Restricted to .txt, .md, and .json files.
    - Overwrites file content with the updated version.
    """
    target_path = get_safe_file_path(filename)

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{filename}' was not found in shared storage."
        )

    ext = target_path.suffix.lower()
    if ext not in settings.EDITABLE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Editing is restricted to text formats ({', '.join(sorted(settings.EDITABLE_EXTENSIONS))}). '{ext}' files cannot be edited."
        )

    # Check payload size limit (10MB)
    content_bytes = payload.content.encode("utf-8")
    if len(content_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Content exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB."
        )

    try:
        # Atomic write or direct overwrite with exact newline preserving POSIX / UNIX standard
        with open(target_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(payload.content)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to write updated content to shared storage."
        )

    metadata = get_file_metadata(target_path)
    return {
        "message": f"File '{filename}' updated successfully.",
        "file": metadata,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
