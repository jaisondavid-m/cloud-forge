import os
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from config import settings
from storage import (
    get_storage_dir,
    sanitize_and_validate_filename,
    get_safe_file_path,
    get_file_metadata,
    get_storage_status,
    list_shared_files,
)

app = FastAPI(
    title="CloudForge Site-2 API (Recovery Site)",
    description="Read-Only Consumer Service for CloudForge Shared EFS Storage",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Health check endpoint indicating site status, mode, and timestamp."""
    return {
        "status": "healthy",
        "site": settings.SITE_NAME,
        "site_id": settings.SITE_ID,
        "mode": "Recovery / Read-Only",
        "read_only": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }

@app.get("/api/storage/status")
async def storage_status():
    """Verifies that the configured EFS directory is mounted, accessible, and readable."""
    return get_storage_status()

@app.get("/api/files")
async def get_files():
    """Lists all files stored in the shared EFS directory."""
    files = list_shared_files()
    return {
        "count": len(files),
        "files": files,
        "site": settings.SITE_NAME,
        "read_only": True,
    }

@app.get("/api/files/{filename}")
async def get_file(filename: str, download: bool = Query(False, description="Download as attachment")):
    """
    Safely reads or downloads an allowed file from shared EFS storage.
    """
    target_path = get_safe_file_path(filename)

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{filename}' was not found in shared EFS storage."
        )

    metadata = get_file_metadata(target_path)
    disposition = "attachment" if download else "inline"

    return FileResponse(
        path=target_path,
        media_type=metadata["mime_type"],
        filename=metadata["name"],
        content_disposition_type=disposition,
    )

@app.get("/api/files/{filename}/preview")
async def get_file_preview(filename: str):
    """
    Returns safe text previews for supported text files (.txt, .md, .json, etc.).
    Truncates content safely if exceeding MAX_PREVIEW_BYTES.
    """
    target_path = get_safe_file_path(filename)

    if not target_path.exists() or not target_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{filename}' was not found in shared EFS storage."
        )

    ext = target_path.suffix.lower()
    if ext not in settings.ALLOWED_PREVIEW_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File '{filename}' ({ext}) is not a supported text format for text preview."
        )

    metadata = get_file_metadata(target_path)

    try:
        # Read with size limit to prevent memory exhaustion
        with open(target_path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read(settings.MAX_PREVIEW_BYTES + 1)

        is_truncated = len(content) > settings.MAX_PREVIEW_BYTES
        if is_truncated:
            content = content[:settings.MAX_PREVIEW_BYTES]

        return {
            "name": filename,
            "content": content,
            "is_truncated": is_truncated,
            "size": metadata["size"],
            "mime_type": metadata["mime_type"],
            "extension": metadata["extension"],
            "read_only": True,
        }
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to read file preview from shared storage."
        )

# ==============================================================================
# Read-Only Security Guard: Explicitly Reject All Modification Requests
# ==============================================================================

@app.post("/api/files/upload")
@app.post("/api/files")
async def reject_upload():
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Read-only Recovery Site: file uploads and creations are strictly disabled on Site 2."
    )

@app.put("/api/files/{filename}")
@app.patch("/api/files/{filename}")
async def reject_update(filename: str):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Read-only Recovery Site: file modifications are strictly disabled on Site 2."
    )

@app.delete("/api/files/{filename}")
async def reject_delete(filename: str):
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Read-only Recovery Site: file deletions are strictly disabled on Site 2."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
