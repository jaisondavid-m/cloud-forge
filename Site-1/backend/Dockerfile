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
ENV PORT=8000
ENV SITE_NAME="Site-1 (Primary)"
ENV SITE_ID=site-1
ENV FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
ENV MAX_UPLOAD_SIZE_MB=10

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
