// Backend URL. For local development this uses localhost.
// After deploying the backend, replace this value with your HTTPS backend URL.
window.ELITE_API_URL = window.ELITE_API_URL || "http://localhost:4000";

window.apiRequest = async function(endpoint, method = "GET", data = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (data) options.body = JSON.stringify(data);
  const response = await fetch(`${window.ELITE_API_URL}${endpoint}`, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
};
