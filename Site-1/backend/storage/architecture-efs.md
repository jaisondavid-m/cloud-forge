# CloudForge — CF-PS-44: Shared Cloud File Storage

Welcome to the CloudForge Primary Node (Site 1).

## Key Architecture Highlights:
- **Shared Storage Backend:** AWS Elastic File System (EFS) mounted via NFS POSIX interface.
- **Multi-Instance Concurrency:** Any file written or modified by Site 1 is immediately visible to Site 2, and vice-versa.
- **Zero Local Caching:** Reads and writes query the live filesystem directly.
- **Safe Operations:** Path traversal protection, 10 MB upload limits, and overwrite prevention are actively enforced.

Try editing this file directly through the Site 1 File Manager!
