FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY config.py storage.py main.py ./

# Create default storage directory (overridden by EFS mount)
RUN mkdir -p /mnt/efs/shared

# Environment defaults (overridden by docker-compose or .env)
ENV EFS_MOUNT_PATH=/mnt/efs/shared
ENV HOST=0.0.0.0
ENV PORT=8001
ENV SITE_NAME="Site-2 (Recovery Site)"
ENV SITE_ID=site-2
ENV READ_ONLY_MODE=true
ENV FRONTEND_ORIGIN=http://localhost:5174,http://127.0.0.1:5174
ENV MAX_PREVIEW_BYTES=1048576
ENV MAX_FILE_LIST_COUNT=1000

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
