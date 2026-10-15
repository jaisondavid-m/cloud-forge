import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    print("=== Testing Site-2 (Recovery Site) FastAPI Endpoints ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    assert health_data["status"] == "healthy"
    assert health_data["read_only"] is True
    print("[PASS] 1. GET /api/health:", health_data)

    # 2. Storage status
    res = client.get("/api/storage/status")
    assert res.status_code == 200, f"Storage status failed: {res.text}"
    storage_data = res.json()
    assert "is_mounted" in storage_data
    assert "is_readable" in storage_data
    assert storage_data["read_only"] is True
    print("[PASS] 2. GET /api/storage/status:", storage_data)

    # 3. List shared files
    res = client.get("/api/files")
    assert res.status_code == 200, f"File listing failed: {res.text}"
    files_data = res.json()
    assert "files" in files_data
    assert files_data["read_only"] is True
    print(f"[PASS] 3. GET /api/files: Found {len(files_data['files'])} files shared from EFS")

    # 4. Preview sample file if present
    if files_data["files"]:
        first_file = files_data["files"][0]
        fname = first_file["name"]
        print(f"Testing preview on '{fname}'...")

        # Preview endpoint
        if first_file.get("is_previewable"):
            res = client.get(f"/api/files/{fname}/preview")
            assert res.status_code == 200, f"Preview failed: {res.text}"
            preview_data = res.json()
            assert "content" in preview_data
            assert preview_data["read_only"] is True
            print(f"[PASS] 4. GET /api/files/{fname}/preview verified successfully")

        # Download / read endpoint
        res = client.get(f"/api/files/{fname}")
        assert res.status_code == 200, f"Download failed: {res.text}"
        print(f"[PASS] 5. GET /api/files/{fname} download/read verified")

    # 6. Read-Only Security Guard: Reject upload attempts (HTTP 403)
    res = client.post("/api/files/upload")
    assert res.status_code == 403, f"Expected 403 for upload, got {res.status_code}"
    print("[PASS] 6. Upload rejection verified (HTTP 403 Forbidden):", res.json()["detail"])

    # 7. Read-Only Security Guard: Reject PUT update attempts (HTTP 403)
    res = client.put("/api/files/somefile.txt", json={"content": "hacked"})
    assert res.status_code == 403, f"Expected 403 for update, got {res.status_code}"
    print("[PASS] 7. Update rejection verified (HTTP 403 Forbidden):", res.json()["detail"])

    # 8. Read-Only Security Guard: Reject DELETE attempts (HTTP 403)
    res = client.delete("/api/files/somefile.txt")
    assert res.status_code == 403, f"Expected 403 for delete, got {res.status_code}"
    print("[PASS] 8. Delete rejection verified (HTTP 403 Forbidden):", res.json()["detail"])

    # 9. Path traversal prevention (HTTP 400)
    res = client.get("/api/files/..%2F..%2Fsecrets.txt")
    assert res.status_code == 400 or res.status_code == 404
    print("[PASS] 9. Path traversal rejection verified")

    # 10. Missing file returns 404
    res = client.get("/api/files/non_existent_recovery_file.txt")
    assert res.status_code == 404
    print("[PASS] 10. Missing file 404 verified")

    print("\nALL SITE-2 BACKEND TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    run_tests()
