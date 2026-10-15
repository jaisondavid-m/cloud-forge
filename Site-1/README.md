# CloudForge — CF-PS-44: Shared Cloud File Storage (Site 1: Primary)

CloudForge Site 1 is the primary cloud file manager service designed for multi-instance, cross-AZ file sharing powered directly by **AWS Elastic File System (EFS)**.

This application provides a modern dashboard for file management, real-time shared storage monitoring, file upload with drag-and-drop, inline file preview, file download, and in-place editing of text files (`.txt`, `.md`, `.json`). When files are created, updated, or removed, changes are immediately reflected across all EC2 instances mounted to the same shared EFS volume (including Site 2) without any local database or browser caching.

---

## 1. System Architecture

```
+-------------------------------------------------------------+
|                  Client Browser (Laptop / Presentation)     |
+-------------------------------------------------------------+
                               |
              REST API Calls   |   Vite Dev Proxy: /api
                               v
+-------------------------------------------------------------+
|               Site 1 Node (EC2 Instance / Host)             |
|  - Frontend: React 18 + Vite + Tailwind CSS (Port 5173)     |
|  - Backend:  FastAPI + Uvicorn (Port 8000)                  |
+-------------------------------------------------------------+
                               |
                   POSIX Read / Write (NFS)
                               v
+-------------------------------------------------------------+
|                 AWS Elastic File System (EFS)               |
|                     (Shared Mount Target)                   |
+-------------------------------------------------------------+
                               ^
                   POSIX Read / Write (NFS)
                               |
+-------------------------------------------------------------+
|               Site 2 Node (Secondary / Recovery EC2)        |
|  - Accesses the identical shared EFS filesystem in parallel  |
+-------------------------------------------------------------+
```

---

## 2. Directory Structure

```text
Site-1/
├── .env.example              # Root environment configuration template
├── README.md                 # Complete documentation and run instructions
├── backend/                  # Python FastAPI Backend
│   ├── .env                  # Active environment variables
│   ├── .env.example          # Environment variables template
│   ├── config.py             # App settings (EFS_MOUNT_PATH, CORS, size limits)
│   ├── main.py               # FastAPI application and route endpoints
│   ├── storage.py            # EFS POSIX operations and security boundaries
│   ├── test_api.py           # Automated test suite for endpoints
│   ├── requirements.txt      # Python dependencies
│   └── storage/              # Local storage directory simulating EFS mount
└── frontend/                 # React + Vite + Tailwind CSS Frontend
    ├── index.html            # Web app entry HTML
    ├── package.json          # Node dependencies and scripts
    ├── postcss.config.js     # PostCSS setup
    ├── tailwind.config.js    # Tailwind color palette & styling
    ├── vite.config.js        # Vite config with API proxy to localhost:8000
    └── src/
        ├── api.js            # Centralized API fetcher
        ├── App.jsx           # Main dashboard orchestrator
        ├── index.css         # Tailwind base and custom scrollbar
        ├── main.jsx          # React DOM root
        └── components/
            ├── Header.jsx             # CloudForge logo & Primary Site status
            ├── StorageStatusCard.jsx  # EFS mount health & disk space
            ├── FileUpload.jsx         # Drag-and-drop 10 MB uploader
            ├── FileTable.jsx          # File list with Site 2 sync trigger
            ├── FilePreviewModal.jsx   # Text / image / document previewer
            ├── FileEditorModal.jsx    # Monospace editor for .txt, .md, .json
            └── NotificationToast.jsx  # Toast notification system
```

---

## 3. Security Implementation

1. **Path Traversal Protection**: Filenames are strictly sanitized with `os.path.basename`, stripped of null bytes, and path boundaries are verified using canonical path resolution (`is_relative_to` / `commonpath`). Traversal patterns such as `../`, directory separators, and hidden files are rejected with `HTTP 400 Bad Request`.
2. **File Size Enforcement**: Uploads are restricted to a maximum of **10 MB**. The server monitors stream chunks in real-time, instantly terminates oversized transfers, and cleans up temporary partial files (`HTTP 413 Payload Too Large`).
3. **Overwrite Prevention**: To prevent data races and accidental overwrites in a shared multi-instance environment, uploading an already-existing filename returns `HTTP 409 Conflict`.
4. **Editable File Restriction**: In-place content updates are restricted strictly to text formats: `.txt`, `.md`, and `.json`. Any attempt to edit binary or unsupported files is rejected (`HTTP 400 Bad Request`).
5. **Information Masking**: Internal server filesystem paths, host directories, and AWS credentials are never exposed in API responses or HTTP error messages.
6. **Strict CORS Policy**: FastAPI CORS middleware allows only origins defined in `FRONTEND_ORIGIN`.

---

## 4. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check returning site name, ID, and timestamp |
| `GET` | `/api/storage/status` | Returns EFS mount status, write capability, and disk capacity |
| `GET` | `/api/files` | Lists all files in the shared EFS directory with metadata |
| `POST` | `/api/files/upload` | Uploads a file (multipart, max 10 MB, prevents overwriting) |
| `GET` | `/api/files/{filename}` | Downloads (`?download=true`) or previews the file content |
| `PUT` | `/api/files/{filename}` | Updates content for `.txt`, `.md`, or `.json` files |

---

## 5. Local Setup & Execution (Windows)

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+ or Python Launcher `py`)

### Step 1: Start the FastAPI Backend
Open a PowerShell terminal in `Site-1\backend`:
```powershell
cd E:\Projects\cloudforge\Site-1\backend

# Install dependencies
py -m pip install -r requirements.txt

# Run the automated verification test suite
py test_api.py

# Start the FastAPI server on port 8000
py -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000`. You can view the interactive Swagger API documentation at `http://127.0.0.1:8000/docs`.

### Step 2: Start the React Frontend
Open a second PowerShell terminal in `Site-1\frontend`:
```powershell
cd E:\Projects\cloudforge\Site-1\frontend

# Install dependencies (if not already installed)
npm install

# Start the Vite development server on port 5173
npm run dev
```
Open your browser and navigate to:
**`http://localhost:5173`**

Vite automatically proxies all `/api` requests to `http://127.0.0.1:8000`.

---

## 6. Linux EC2 Deployment (AWS EFS)

### Step 1: Mount AWS EFS on EC2
Install the EFS client and mount the file system:
```bash
# Update packages
sudo apt-get update -y
sudo apt-get install -y nfs-common python3-pip python3-venv git

# Create mount directory
sudo mkdir -p /mnt/efs/shared

# Mount using AWS EFS Mount Helper or standard NFS
# Replace fs-XXXXXX with your actual AWS EFS File System ID
sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \
  fs-XXXXXX.efs.us-east-1.amazonaws.com:/ /mnt/efs/shared

# Ensure read/write permissions for application user
sudo chown -R ubuntu:ubuntu /mnt/efs/shared
sudo chmod -R 775 /mnt/efs/shared

# (Optional) Persist mount across reboots in /etc/fstab:
# fs-XXXXXX.efs.us-east-1.amazonaws.com:/ /mnt/efs/shared nfs4 defaults,_netdev 0 0
```

### Step 2: Configure Environment Variables
In `Site-1/backend/.env`:
```bash
EFS_MOUNT_PATH=/mnt/efs/shared
HOST=0.0.0.0
PORT=8000
SITE_NAME=Site-1 (Primary)
SITE_ID=site-1
FRONTEND_ORIGIN=http://<EC2-PUBLIC-IP>:5173,http://localhost:5173
MAX_UPLOAD_SIZE_MB=10
```

### Step 3: Run the Backend Service
```bash
cd /path/to/Site-1/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with uvicorn (or use systemd for 24/7 background service)
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Step 4: Build and Serve Frontend on EC2
```bash
cd /path/to/Site-1/frontend
npm install
npm run build

# Serve production build using Vite preview or Nginx / Caddy
npm run preview -- --host 0.0.0.0 --port 5173
```

---

## 7. Multi-Site EFS Verification Workflow

1. **Upload on Site 1**: Upload any file (e.g., `document.txt` or an image) via Site 1 UI.
2. **Access from Site 2**: On the second EC2 instance mounted to `/mnt/efs/shared`, the file is immediately readable from disk.
3. **Edit on Site 1**: Click the **Edit** action on a `.txt`, `.md`, or `.json` file, make changes, and click **Save Changes**. The file is written to EFS in POSIX format.
4. **Detect External Changes**: When Site 2 creates or edits a file in the shared directory, click **Check Site 2 Updates** (or let the automatic background sync poll) on Site 1 to see the new files and updated timestamps instantly.
