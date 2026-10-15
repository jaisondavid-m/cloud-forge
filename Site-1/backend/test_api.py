import os
import io
from fastapi.testclient import TestClient
from main import app
from storage import ensure_storage_dir

client = TestClient(app)

def run_tests():
    print("=== Testing FastAPI Endpoints ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    data = res.json()
    assert data["status"] == "healthy"
    print("[PASS] 1. GET /api/health:", data)

    # 2. Storage status
    res = client.get("/api/storage/status")
    assert res.status_code == 200, f"Storage status failed: {res.text}"
    storage_data = res.json()
    assert "is_mounted" in storage_data
    assert "writable" in storage_data
    print("[PASS] 2. GET /api/storage/status:", storage_data)

    # 3. File listing
    res = client.get("/api/files")
    assert res.status_code == 200, f"Get files failed: {res.text}"
    files_data = res.json()
    assert "files" in files_data
    print("[PASS] 3. GET /api/files: Found", len(files_data["files"]), "files")

    # 4. Upload file
    test_filename = "test_shared_doc.txt"
    storage_dir = ensure_storage_dir()
    existing_file = storage_dir / test_filename
    if existing_file.exists():
        existing_file.unlink()

    file_bytes = b"Hello from CloudForge Site 1 Primary Node!\nThis file is stored on shared EFS."
    files = {"file": (test_filename, io.BytesIO(file_bytes), "text/plain")}
    res = client.post("/api/files/upload", files=files)
    assert res.status_code == 201, f"Upload failed: {res.text}"
    upload_data = res.json()
    print("[PASS] 4. POST /api/files/upload:", upload_data["message"])

    # 5. Overwrite prevention (409 Conflict)
    files = {"file": (test_filename, io.BytesIO(b"Try to overwrite"), "text/plain")}
    res = client.post("/api/files/upload", files=files)
    assert res.status_code == 409, f"Expected 409 Conflict, got: {res.status_code} {res.text}"
    print("[PASS] 5. Prevent overwrite 409 Conflict verified:", res.json()["detail"])

    # 6. Path traversal prevention
    bad_filename = "../../../etc_passwd.txt"
    files = {"file": (bad_filename, io.BytesIO(b"malicious"), "text/plain")}
    res = client.post("/api/files/upload", files=files)
    assert res.status_code == 400, f"Expected 400 Bad Request for path traversal, got: {res.status_code}"
    print("[PASS] 6. Path traversal rejection verified (HTTP 400)")

    # 7. Download/Preview file
    res = client.get(f"/api/files/{test_filename}")
    assert res.status_code == 200, f"Download failed: {res.text}"
    assert b"Hello from CloudForge" in res.content
    print("[PASS] 7. GET /api/files/{filename} preview/read verified")

    # 8. Update text file (PUT)
    new_content = "Updated content from Site 1 Primary at 2026-10-15.\nReady for Site 2 sync!"
    res = client.put(f"/api/files/{test_filename}", json={"content": new_content})
    assert res.status_code == 200, f"Update failed: {res.text}"
    assert res.json()["file"]["name"] == test_filename
    print("[PASS] 8. PUT /api/files/{filename} update verified:", res.json()["message"])

    # Verify content was updated on disk
    res = client.get(f"/api/files/{test_filename}")
    assert res.text == new_content
    print("[PASS] Verified updated content persisted to shared storage")

    # 9. Test restriction on editing non-text files
    img_name = "test_image.png"
    img_path = storage_dir / img_name
    img_path.write_bytes(b"\x89PNG\r\n\x1a\nfake_image_data")
    res = client.put(f"/api/files/{img_name}", json={"content": "malicious edit"})
    assert res.status_code == 400, f"Expected 400 for editing non-text file, got: {res.status_code}"
    print("[PASS] 9. Editing non-text file restriction verified (HTTP 400):", res.json()["detail"])
    if img_path.exists():
        img_path.unlink()

    # 10. Test 404 for non-existent file
    res = client.get("/api/files/non_existent_file.xyz")
    assert res.status_code == 404
    print("[PASS] 10. Missing file 404 verified")

    print("\nALL 10 TESTS PASSED SUCCESSFULLY! End-to-end functionality verified.")

if __name__ == "__main__":
    run_tests()
