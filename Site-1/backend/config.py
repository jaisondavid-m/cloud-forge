import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    EFS_MOUNT_PATH: str = os.getenv("EFS_MOUNT_PATH", "./storage")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    SITE_NAME: str = os.getenv("SITE_NAME", "Site-1 (Primary)")
    SITE_ID: str = os.getenv("SITE_ID", "site-1")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173")
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))

    # Security: Editable extensions
    EDITABLE_EXTENSIONS: set = {".txt", ".md", ".json"}

    @property
    def cors_origins(self) -> List[str]:
        origins = [orig.strip() for orig in self.FRONTEND_ORIGIN.split(",") if orig.strip()]
        return origins if origins else ["http://localhost:5173"]

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def storage_path(self) -> Path:
        # Resolve to an absolute path for local disk verification
        p = Path(self.EFS_MOUNT_PATH).resolve()
        return p

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
