// Centralized API client for CloudForge Site-1 Backend

const BASE_URL = '/api';

/**
 * Handle HTTP response and return JSON or throw descriptive error.
 */
async function handleResponse(res) {
  if (!res.ok) {
    let errorDetail = 'An unexpected server error occurred.';
    try {
      const data = await res.json();
      if (data && data.detail) {
        errorDetail = data.detail;
      }
    } catch {
      errorDetail = `Request failed with status ${res.status}: ${res.statusText}`;
    }
    const error = new Error(errorDetail);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}

export async function fetchStorageStatus() {
  const res = await fetch(`${BASE_URL}/storage/status`);
  return handleResponse(res);
}

export async function fetchFiles() {
  const res = await fetch(`${BASE_URL}/files`);
  return handleResponse(res);
}

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/files/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function fetchFileContent(filename) {
  const res = await fetch(`${BASE_URL}/files/${encodeURIComponent(filename)}`);
  if (!res.ok) {
    let errorDetail = 'Could not load file content.';
    try {
      const data = await res.json();
      if (data && data.detail) errorDetail = data.detail;
    } catch {
      // fallback
    }
    const err = new Error(errorDetail);
    err.status = res.status;
    throw err;
  }
  return res.text();
}

export async function updateFileContent(filename, content) {
  const res = await fetch(`${BASE_URL}/files/${encodeURIComponent(filename)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

export function getDownloadUrl(filename) {
  return `${BASE_URL}/files/${encodeURIComponent(filename)}?download=true`;
}

export function getPreviewUrl(filename) {
  return `${BASE_URL}/files/${encodeURIComponent(filename)}`;
}
