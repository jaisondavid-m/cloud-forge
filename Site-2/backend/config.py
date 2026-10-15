import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List, Set

class Settings(BaseSettings):
    EFS_MOUNT_PATH: str = os.getenv("EFS_MOUNT_PATH", "../../Site-1/backend/storage")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))
    SITE_NAME: str = os.getenv("SITE_NAME", "Site-2 (Recovery Site)")
    SITE_ID: str = os.getenv("SITE_ID", "site-2")
    READ_ONLY_MODE: bool = True
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5174,http://127.0.0.1:5174,http://localhost:5173")
    MAX_PREVIEW_BYTES: int = int(os.getenv("MAX_PREVIEW_BYTES", "1048576"))
    MAX_FILE_LIST_COUNT: int = int(os.getenv("MAX_FILE_LIST_COUNT", "1000"))

    # Text extensions allowed for safe text preview
    ALLOWED_PREVIEW_EXTENSIONS: Set[str] = {
        ".txt", ".md", ".json", ".log", ".csv", ".yaml", ".yml", ".xml", ".html", ".css", ".js", ".py"
    }

    @property
    def cors_origins(self) -> List[str]:
        origins = [orig.strip() for orig in self.FRONTEND_ORIGIN.split(",") if orig.strip()]
        return origins if origins else ["http://localhost:5174"]

    @property
    def storage_path(self) -> Path:
        return Path(self.EFS_MOUNT_PATH).resolve()

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
