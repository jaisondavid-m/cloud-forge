// API client for CloudForge Site-2 (Recovery Site)

const BASE_URL = '/api';

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

export async function fetchFilePreview(filename) {
  const res = await fetch(`${BASE_URL}/files/${encodeURIComponent(filename)}/preview`);
  return handleResponse(res);
}

export function getDownloadUrl(filename) {
  return `${BASE_URL}/files/${encodeURIComponent(filename)}?download=true`;
}

export function getRawFileUrl(filename) {
  return `${BASE_URL}/files/${encodeURIComponent(filename)}`;
}
