const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export async function fetchMessages(limit = 50) {
  const res = await fetch(`${API_URL}/api/messages?limit=${limit}`);
  return handleResponse(res);
}

export async function sendMessage({ text, senderId, senderName }) {
  const res = await fetch(`${API_URL}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, senderId, senderName }),
  });
  return handleResponse(res);
}

export async function checkHealth() {
  const res = await fetch(`${API_URL}/api/health`);
  return handleResponse(res);
}
