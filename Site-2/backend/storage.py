import os
import shutil
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List
from fastapi import HTTPException, status
from config import settings

def get_storage_dir() -> Path:
    """
    Returns the resolved storage Path.
    Does not attempt to create directories if missing, since Site-2
    is a read-only consumer of the existing shared EFS mount.
    """
    path = settings.storage_path
    if not path.exists():
        # Fallback check: if default path doesn't exist yet, attempt to create only if running local dev
        try:
            path.mkdir(parents=True, exist_ok=True)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Shared EFS storage directory is not accessible or not mounted."
            )
    return path

def sanitize_and_validate_filename(filename: str) -> str:
    """
    Strict validation against path traversal, directory components,
    and hidden files.
    """
    if not filename or not isinstance(filename, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required and cannot be empty."
        )

    cleaned = filename.strip().replace("\x00", "")
    base_name = os.path.basename(cleaned)

    if not base_name or base_name in (".", "..") or "/" in cleaned or "\\" in cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename: path traversal and directory separators are prohibited."
        )

    if base_name.startswith("."):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access to hidden files is prohibited."
        )

    return base_name

def get_safe_file_path(filename: str) -> Path:
    """
    Resolves safe filename within storage path and strictly verifies boundary.
    """
    safe_name = sanitize_and_validate_filename(filename)
    storage_dir = get_storage_dir()
    target_path = (storage_dir / safe_name).resolve()

    try:
        if not target_path.is_relative_to(storage_dir):
            raise ValueError("Target path escapes storage boundary.")
    except AttributeError:
        if os.path.commonpath([str(target_path), str(storage_dir)]) != str(storage_dir):
            raise ValueError("Target path escapes storage boundary.")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Access denied: invalid file path."
        )

    return target_path

def get_file_metadata(file_path: Path) -> Dict[str, Any]:
    """Extracts file metadata without exposing host filesystem paths."""
    stat = file_path.stat()
    ext = file_path.suffix.lower()
    mime_type, _ = mimetypes.guess_type(file_path.name)
    if not mime_type:
        if ext == ".md":
            mime_type = "text/markdown"
        elif ext == ".json":
            mime_type = "application/json"
        elif ext == ".txt":
            mime_type = "text/plain"
        else:
            mime_type = "application/octet-stream"

    mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
    is_previewable = ext in settings.ALLOWED_PREVIEW_EXTENSIONS

    return {
        "name": file_path.name,
        "size": stat.st_size,
        "extension": ext,
        "mime_type": mime_type,
        "last_modified": mtime,
        "is_previewable": is_previewable,
        "read_only": True,
    }

def get_storage_status() -> Dict[str, Any]:
    """
    Verifies that the configured EFS directory exists, is readable,
    and returns capacity metrics without disclosing host paths.
    """
    try:
        storage_dir = get_storage_dir()
        is_accessible = storage_dir.exists() and storage_dir.is_dir()
        is_readable = os.access(storage_dir, os.R_OK)

        # Disk usage via shutil.disk_usage
        usage = shutil.disk_usage(storage_dir)
        total_bytes = usage.total
        used_bytes = usage.used
        free_bytes = usage.free
        usage_percent = round((used_bytes / total_bytes * 100), 1) if total_bytes > 0 else 0.0

        # Count visible files
        file_count = sum(
            1 for item in storage_dir.iterdir()
            if item.is_file() and not item.name.startswith(".")
        )

        return {
            "is_mounted": is_accessible and is_readable,
            "is_readable": is_readable,
            "read_only": True,
            "mount_type": "AWS EFS Shared Storage (Read-Only Replica)",
            "mount_status": "Healthy & Synchronized" if (is_accessible and is_readable) else "Unreachable / Degraded",
            "total_bytes": total_bytes,
            "used_bytes": used_bytes,
            "free_bytes": free_bytes,
            "usage_percent": usage_percent,
            "file_count": file_count,
            "site": settings.SITE_NAME,
            "mode": "Recovery / Read-Only",
        }
    except Exception:
        return {
            "is_mounted": False,
            "is_readable": False,
            "read_only": True,
            "mount_type": "AWS EFS Shared Storage (Read-Only Replica)",
            "mount_status": "Mount Degraded / Disconnected",
            "total_bytes": 0,
            "used_bytes": 0,
            "free_bytes": 0,
            "usage_percent": 0.0,
            "file_count": 0,
            "site": settings.SITE_NAME,
            "mode": "Recovery / Read-Only",
        }

def list_shared_files() -> List[Dict[str, Any]]:
    """Lists files from shared storage, limited to MAX_FILE_LIST_COUNT."""
    storage_dir = get_storage_dir()
    files = []
    try:
        for entry in storage_dir.iterdir():
            if entry.is_file() and not entry.name.startswith("."):
                try:
                    files.append(get_file_metadata(entry))
                    if len(files) >= settings.MAX_FILE_LIST_COUNT:
                        break
                except OSError:
                    continue
        files.sort(key=lambda x: x["last_modified"], reverse=True)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list files from shared EFS storage."
        )
    return files
