const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export async function request(path, payload, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

export function analyzeCode(code, options = {}) {
  return request("/analyze", {
    code,
    useAi: options.useAi === true
  });
}

export function replaceCode(code, token) {
  return request(
    "/replace",
    {
      code
    },
    token ? { token } : {}
  );
}

export function getReplaceCooldown(token) {
  return request("/replace/cooldown", undefined, { method: "GET", token });
}

export function askCodeQuestion(payload) {
  return request("/chat", payload);
}

export function registerAccount(payload) {
  return request("/auth/register", payload);
}

export function loginAccount(payload) {
  return request("/auth/login", payload);
}

export function getCurrentUser(token) {
  return request("/auth/me", undefined, { method: "GET", token });
}

export function subscribeToPro(token) {
  return request("/users/me/subscription", undefined, { method: "PUT", token });
}
