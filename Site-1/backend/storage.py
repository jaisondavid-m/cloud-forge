import os
import shutil
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from config import settings

def ensure_storage_dir() -> Path:
    """Ensures the storage directory exists and returns its resolved Path."""
    path = settings.storage_path
    try:
        path.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        # Do not expose internal server filesystem path details
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Storage directory could not be initialized or accessed."
        )
    return path

def sanitize_and_validate_filename(filename: str) -> str:
    """
    Strictly validates the filename to prevent path traversal, hidden files,
    or dangerous characters.
    """
    if not filename or not isinstance(filename, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required and cannot be empty."
        )

    # Clean whitespace and strip null bytes
    cleaned = filename.strip().replace("\x00", "")

    # Extract base name to strip any leading folders or path separators
    base_name = os.path.basename(cleaned)

    # Disallow path traversal patterns, hidden files starting with '.', or empty names
    if not base_name or base_name == "." or base_name == ".." or "/" in cleaned or "\\" in cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename: path traversal or directory components are not permitted."
        )

    if base_name.startswith("."):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hidden files starting with '.' are not permitted."
        )

    return base_name

def get_safe_file_path(filename: str) -> Path:
    """
    Resolves filename inside storage directory and verifies that the canonical path
    strictly stays within the allowed storage boundary.
    """
    safe_name = sanitize_and_validate_filename(filename)
    storage_dir = ensure_storage_dir()
    target_path = (storage_dir / safe_name).resolve()

    # Verify boundary
    try:
        # Python 3.9+ supports is_relative_to
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
    """Generates file metadata without disclosing host paths."""
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

    # Last modified UTC ISO format
    mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()

    return {
        "name": file_path.name,
        "size": stat.st_size,
        "extension": ext,
        "mime_type": mime_type,
        "last_modified": mtime,
        "is_editable": ext in settings.EDITABLE_EXTENSIONS,
    }

def get_storage_status() -> Dict[str, Any]:
    """
    Checks storage status, mount availability, and disk usage without
    exposing internal server filesystem paths or AWS credentials.
    """
    try:
        storage_dir = ensure_storage_dir()
        is_accessible = storage_dir.exists() and storage_dir.is_dir()

        # Check write permissions
        is_writable = False
        test_file = storage_dir / ".mount_health_check.tmp"
        try:
            test_file.write_text("health_check")
            if test_file.exists():
                test_file.unlink()
                is_writable = True
        except Exception:
            is_writable = False

        # Disk space via shutil.disk_usage
        usage = shutil.disk_usage(storage_dir)
        total_bytes = usage.total
        used_bytes = usage.used
        free_bytes = usage.free
        usage_percent = round((used_bytes / total_bytes * 100), 1) if total_bytes > 0 else 0.0

        # Count visible files
        file_count = sum(1 for item in storage_dir.iterdir() if item.is_file() and not item.name.startswith("."))

        return {
            "is_mounted": is_accessible and is_writable,
            "writable": is_writable,
            "mount_type": "AWS EFS Shared Storage",
            "mount_status": "Healthy & Synchronized" if is_writable else "Read-Only / Unreachable",
            "total_bytes": total_bytes,
            "used_bytes": used_bytes,
            "free_bytes": free_bytes,
            "usage_percent": usage_percent,
            "file_count": file_count,
            "site": settings.SITE_NAME,
        }
    except Exception:
        return {
            "is_mounted": False,
            "writable": False,
            "mount_type": "AWS EFS Shared Storage",
            "mount_status": "Mount Degraded / Disconnected",
            "total_bytes": 0,
            "used_bytes": 0,
            "free_bytes": 0,
            "usage_percent": 0.0,
            "file_count": 0,
            "site": settings.SITE_NAME,
        }

def list_files() -> List[Dict[str, Any]]:
    """Returns list of files in the shared storage directory."""
    storage_dir = ensure_storage_dir()
    files = []
    try:
        for entry in storage_dir.iterdir():
            if entry.is_file() and not entry.name.startswith("."):
                try:
                    files.append(get_file_metadata(entry))
                except OSError:
                    continue
        # Sort descending by last_modified
        files.sort(key=lambda x: x["last_modified"], reverse=True)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve file list from shared storage."
        )
    return files
