const API_BASE = '/api';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Try to refresh token on 401
  if (res.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retry = await fetch(url, { ...options, headers, credentials: 'include' });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({}));
        throw { status: retry.status, ...err };
      }
      return retry.json();
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw { status: res.status, ...err };
  }

  return res.json();
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      accessToken = data.accessToken;
      return true;
    }
  } catch {}
  return false;
}

// Convenience methods
export const apiGet = (endpoint) => api(endpoint);
export const apiPost = (endpoint, body) => api(endpoint, { method: 'POST', body: JSON.stringify(body) });
export const apiPatch = (endpoint, body) => api(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
export const apiDelete = (endpoint) => api(endpoint, { method: 'DELETE' });
