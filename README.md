# CloudForge — CF-PS-44: Shared Cloud File Storage

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![AWS EFS](https://img.shields.io/badge/Storage-AWS_EFS-FF9900.svg?logo=amazon-aws&logoColor=white)](https://aws.amazon.com/efs/)
[![Docker](https://img.shields.io/badge/Container-Docker_Compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

A enterprise-grade dual-site shared cloud file storage solution deployed across independent AWS EC2 instances connected via an **Amazon Elastic File System (AWS EFS)** network share. Demonstrates real-time cross-instance synchronization and read-only disaster recovery without manual file transfer.

---

## 🏛️ Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │             AWS Cloud VPC               │
                      │                                         │
                      │       ┌─────────────────────────┐       │
                      │       │   Amazon EFS Storage    │       │
                      │       │      (NFSv4 Mount)      │       │
                      │       └──────▲───────────▲──────┘       │
                      │              │           │              │
                      │    Read/Write│           │Read-Only     │
                      │              │           │              │
        ┌─────────────┴──────────┐   │           │   ┌──────────┴──────────────┐
        │   EC2 Instance - Site 1│───┘           └───│   EC2 Instance - Site 2 │
        │     (Primary Site)     │                   │      (Recovery Site)    │
        │                        │                   │                         │
        │ ┌────────────────────┐ │                   │ ┌─────────────────────┐ │
        │ │ FastAPI (Port 8000)│ │                   │ │ FastAPI (Port 8001) │ │
        │ └─────────▲──────────┘ │                   │ └──────────▲──────────┘ │
        │           │ REST API   │                   │            │ REST API   │
        │ ┌─────────┴──────────┐ │                   │ ┌──────────┴──────────┐ │
        │ │ React (Port 5173)  │ │                   │ │ React (Port 5174)   │ │
        │ └────────────────────┘ │                   │ └─────────────────────┘ │
        └────────────────────────┘                   └─────────────────────────┘
```

- **Site 1 (Primary File Manager)**: Full read/write file manager for uploading, editing, previewing, and downloading files.
- **Site 2 (Recovery Site)**: Read-only replication dashboard that verifies real-time EFS file consistency with automated 5-second polling and an automated health verification matrix.

---

## 📂 Project Structure

```text
cloudforge/
├── .gitignore
├── README.md
├── Site-1/                           # Primary Site (Read/Write)
│   ├── docker-compose.yml            # Docker Compose setup for Site 1
│   ├── .env.example
│   ├── README.md
│   ├── backend/                      # Python FastAPI (Port 8000)
│   │   ├── Dockerfile
│   │   ├── config.py
│   │   ├── storage.py
│   │   ├── main.py
│   │   ├── test_api.py
│   │   └── requirements.txt
│   └── frontend/                     # React + Vite + Tailwind CSS (Port 5173)
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── package.json
│       ├── vite.config.js
│       └── src/
└── Site-2/                           # Recovery Site (Read-Only)
    ├── docker-compose.yml            # Docker Compose setup for Site 2
    ├── .env.example
    ├── README.md
    ├── backend/                      # Python FastAPI (Port 8001)
    │   ├── Dockerfile
    │   ├── config.py
    │   ├── storage.py
    │   ├── main.py
    │   ├── test_api.py
    │   └── requirements.txt
    └── frontend/                     # React + Vite + Tailwind CSS (Port 5174)
        ├── Dockerfile
        ├── nginx.conf
        ├── package.json
        ├── vite.config.js
        └── src/
```

---

## 🚀 Quick Start (Local Development)

### 1. Site 1 (Primary Site)

```powershell
# Backend (Port 8000)
cd e:\Projects\cloudforge\Site-1\backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload

# Frontend (Port 5173) - New Terminal
cd e:\Projects\cloudforge\Site-1\frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to manage files.

---

### 2. Site 2 (Recovery Site)

```powershell
# Backend (Port 8001)
cd e:\Projects\cloudforge\Site-2\backend
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8001 --reload

# Frontend (Port 5174) - New Terminal
cd e:\Projects\cloudforge\Site-2\frontend
npm install
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) to monitor real-time file replication.

---

## 🐳 Docker & Docker Compose Deployment

Both sites contain independent Docker and Docker Compose configurations.

### Deploy Site 1:
```bash
cd Site-1
docker compose up --build -d
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Deploy Site 2:
```bash
cd Site-2
docker compose up --build -d
```
- Frontend: `http://localhost:5174`
- Backend API: `http://localhost:8001`
- API Docs: `http://localhost:8001/docs`

---

## ☁️ AWS EFS EC2 Deployment Guide

On each EC2 Linux instance:
```bash
# 1. Install EFS mount helper
sudo dnf install -y amazon-efs-utils   # AL2023 / Fedora
# OR: sudo apt install -y amazon-efs-utils   # Ubuntu

# 2. Create mount point
sudo mkdir -p /mnt/efs/shared

# 3. Mount EFS File System
sudo mount -t efs -o tls fs-xxxxxx:/ /mnt/efs/shared

# 4. Set environment variable
export EFS_MOUNT_PATH=/mnt/efs/shared
```

---

## 🛡️ Security Features
- **Path Traversal Protection**: All paths resolved and validated within root sandbox.
- **Read-Only Enforcement**: Recovery backend enforces strict read operations; write endpoints rejected.
- **Strict MIME & Extension Whitelist**: Controlled upload validation.
- **Audit Logging**: System and access logs tracked for all operations.
