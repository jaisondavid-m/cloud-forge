# CloudForge — CF-PS-44: Shared Cloud File Storage (Site 2: Recovery Site)

CloudForge Site 2 is the **read-only Recovery Site** designed to verify cross-instance file synchronization via **AWS Elastic File System (EFS)**. Files uploaded or edited on Site 1 (Primary) appear here in real-time without manual copying, databases, or browser caching.

All write, upload, edit, delete, and rename operations are **strictly disabled** at both the UI and API level. Modification endpoints explicitly return `HTTP 403 Forbidden`.

---

## 1. System Architecture

```
+-------------------------------------------------------------+
|               Client Browser (Hackathon Presentation)       |
+-------------------------------------------------------------+
                               |
                REST (Read-Only)  |  Vite Dev Proxy: /api
                               v
+-------------------------------------------------------------+
|              Site 2 Node (EC2 Instance / Host)              |
|  - Frontend: React 18 + Vite + Tailwind CSS (Port 5174)    |
|  - Backend:  FastAPI + Uvicorn (Port 8001)                  |
|  - Mode: READ-ONLY                                          |
+-------------------------------------------------------------+
                               |
                   POSIX Read (NFS)
                               v
+-------------------------------------------------------------+
|                 AWS Elastic File System (EFS)               |
|                     (Shared Mount Target)                   |
+-------------------------------------------------------------+
                               ^
                   POSIX Read / Write (NFS)
                               |
+-------------------------------------------------------------+
|            Site 1 Node (Primary File Manager EC2)           |
|  - Frontend Port 5173 / Backend Port 8000                   |
|  - Has full upload, edit, and file management capabilities   |
+-------------------------------------------------------------+
```

---

## 2. Directory Structure

```text
Site-2/
├── .env.example              # Root environment template
├── .gitignore                # Gitignore rules
├── README.md                 # Documentation and deployment guide
├── backend/                  # Python FastAPI Backend (Read-Only)
│   ├── .env                  # Active environment variables
│   ├── .env.example          # Environment template
│   ├── config.py             # App settings
│   ├── main.py               # FastAPI app with read-only guards
│   ├── storage.py            # EFS read operations & path validation
│   ├── test_api.py           # Automated test suite
│   └── requirements.txt      # Python dependencies
└── frontend/                 # React + Vite + Tailwind CSS Frontend
    ├── index.html            # App entry point
    ├── package.json           # Node dependencies
    ├── postcss.config.js      # PostCSS setup
    ├── tailwind.config.js     # Tailwind palette
    ├── vite.config.js         # Vite dev server + /api proxy
    └── src/
        ├── api.js             # API client (read-only calls only)
        ├── App.jsx            # Recovery dashboard orchestrator
        ├── index.css          # Tailwind base styles
        ├── main.jsx           # React DOM root
        └── components/
            ├── Header.jsx              # CloudForge logo + Recovery Site label
            ├── StorageStatusCard.jsx   # EFS mount health & disk metrics
            ├── VerificationPanel.jsx   # Live system verification checks
            ├── FileTable.jsx           # Read-only file list with preview/download
            ├── FilePreviewModal.jsx    # Text/image previewer (no edit button)
            └── NotificationToast.jsx   # Toast notification system
```

---

## 3. Read-Only Security

### UI Level
- No upload, edit, delete, rename, or overwrite controls exist in the interface.
- A prominent banner reads: **"Read-only Recovery Site — file modifications are disabled."**

### API Level
- **No file-modification endpoints exist** for normal operation.
- Explicit rejection routes are registered:
  - `POST /api/files/upload` → `403 Forbidden`
  - `POST /api/files` → `403 Forbidden`
  - `PUT /api/files/{filename}` → `403 Forbidden`
  - `PATCH /api/files/{filename}` → `403 Forbidden`
  - `DELETE /api/files/{filename}` → `403 Forbidden`
- CORS only allows `GET` and `OPTIONS` methods.

### Filesystem Level
- Path traversal is blocked by filename sanitization and canonical path boundary checks.
- Hidden files (starting with `.`) are rejected.
- Text previews are capped at `MAX_PREVIEW_BYTES` (1 MB) to prevent memory exhaustion.
- File listing is capped at `MAX_FILE_LIST_COUNT` (1000).
- Server paths and AWS credentials are never exposed in responses.

---

## 4. API Endpoints

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `GET` | `/api/health` | 200 | Backend health, site identity, read-only mode |
| `GET` | `/api/storage/status` | 200 | EFS mount check, readability, disk capacity |
| `GET` | `/api/files` | 200 | List all shared files with metadata |
| `GET` | `/api/files/{filename}` | 200 | Download or inline preview a file |
| `GET` | `/api/files/{filename}/preview` | 200 | Safe text preview for supported formats |
| `POST` | `/api/files/upload` | **403** | Rejected — read-only |
| `PUT` | `/api/files/{filename}` | **403** | Rejected — read-only |
| `PATCH` | `/api/files/{filename}` | **403** | Rejected — read-only |
| `DELETE` | `/api/files/{filename}` | **403** | Rejected — read-only |

---

## 5. Local Setup & Execution (Windows)

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+ via `py` launcher)
- **Site 1 backend must be running** (or at least `Site-1/backend/storage/` must exist with files)

### Step 1: Start the FastAPI Backend
```powershell
cd E:\Projects\cloudforge\Site-2\backend

# Install dependencies (shares the same packages as Site-1)
py -m pip install -r requirements.txt

# Run the automated test suite
py test_api.py

# Start the backend on port 8001
py -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```
Backend running at: **http://127.0.0.1:8001**
Swagger docs at: **http://127.0.0.1:8001/docs**

### Step 2: Start the React Frontend
```powershell
cd E:\Projects\cloudforge\Site-2\frontend

# Install dependencies (if not already done)
npm install

# Start Vite dev server on port 5174
npm run dev
```
Open your browser: **http://localhost:5174**

Vite proxies `/api` calls to `http://127.0.0.1:8001`.

---

## 6. Linux EC2 Deployment

### Step 1: Mount AWS EFS on the Site-2 EC2 Instance
```bash
sudo apt-get update -y
sudo apt-get install -y nfs-common python3-pip python3-venv git

sudo mkdir -p /mnt/efs/shared

# Mount EFS — use the SAME file system ID as Site 1
sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \
  fs-XXXXXX.efs.us-east-1.amazonaws.com:/ /mnt/efs/shared

sudo chown -R ubuntu:ubuntu /mnt/efs/shared
sudo chmod -R 775 /mnt/efs/shared
```

### Step 2: Configure Environment
In `Site-2/backend/.env`:
```bash
EFS_MOUNT_PATH=/mnt/efs/shared
HOST=0.0.0.0
PORT=8001
SITE_NAME=Site-2 (Recovery Site)
SITE_ID=site-2
READ_ONLY_MODE=true
FRONTEND_ORIGIN=http://<EC2-PUBLIC-IP>:5174,http://localhost:5174
MAX_PREVIEW_BYTES=1048576
MAX_FILE_LIST_COUNT=1000
```

### Step 3: Run Backend
```bash
cd Site-2/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Step 4: Build and Serve Frontend
```bash
cd Site-2/frontend
npm install
npm run build
npm run preview -- --host 0.0.0.0 --port 5174
```

---

## 7. Verification Steps

### A. Cross-Site Sync
1. Upload a file on Site 1 (e.g., `demo-report.txt`).
2. Wait 5 seconds (or click Refresh) on Site 2.
3. Verify the file appears in Site 2's file table with correct name, size, and timestamp.

### B. Content Updates
1. Edit a `.txt` file on Site 1 via the editor.
2. Click Refresh on Site 2.
3. Open the file preview on Site 2 and verify the updated content.

### C. Read-Only Enforcement
1. Open the Site 2 Swagger docs: `http://<host>:8001/docs`.
2. Attempt `POST /api/files/upload` — verify `403 Forbidden`.
3. Attempt `PUT /api/files/somefile.txt` — verify `403 Forbidden`.
4. Attempt `DELETE /api/files/somefile.txt` — verify `403 Forbidden`.
5. Confirm the UI has no upload, edit, or delete buttons.

### D. Verification Panel
1. Open Site 2 dashboard.
2. Check the Verification Panel shows:
   - ✅ Backend Reachable
   - ✅ EFS Mount Available
   - ✅ Shared Directory Readable
   - ✅ Read-Only Mode Active
   - File count matches Site 1
   - Last refresh timestamp updates every 5 seconds

### E. Storage Status
1. Check the Storage Status Card shows "Mounted & Readable".
2. Verify disk usage metrics are real values (not zeros or placeholders).
