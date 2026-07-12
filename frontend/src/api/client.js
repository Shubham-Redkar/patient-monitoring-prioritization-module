import { API_URL } from "../config/app";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function errorMessage(detail, fallback) {
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  return fallback;
}

export async function apiRequest(path, { token, headers, body, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(body instanceof FormData ? {} : body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(errorMessage(data.detail, `Request failed (${response.status})`), response.status);
  }
  return data;
}

export const patientApi = {
  list: (token) => apiRequest("/patients", { token }),
  history: (token, id, toHour) => apiRequest(`/patients/${id}/history?from_hour=0&to_hour=${toHour}`, { token }),
  prediction: (token, id, hour) => apiRequest(`/patients/${id}/predict?hour=${hour}`, { token }),
  meta: (token, id) => apiRequest(`/patients/${id}/meta`, { token }),
  acknowledge: (token, id) => apiRequest(`/patients/${id}/acknowledge`, { token, method: "POST" }),
  override: (token, id, body) => apiRequest(`/patients/${id}/override_priority`, { token, method: "POST", body }),
  clearOverride: (token, id) => apiRequest(`/patients/${id}/override_priority`, { token, method: "DELETE" }),
  remove: (token, id) => apiRequest(`/patients/${id}`, { token, method: "DELETE" }),
};

export const userApi = {
  list: (token) => apiRequest("/auth/users", { token }),
  create: (token, body) => apiRequest("/auth/users", { token, method: "POST", body }),
  remove: (token, username) => apiRequest(`/auth/users/${username}`, { token, method: "DELETE" }),
};

export const authApi = {
  changePassword: (token, body) => apiRequest("/auth/change-password", { token, method: "POST", body }),
  forgotPassword: (email) => apiRequest("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, newPassword) => apiRequest("/auth/reset-password", { method: "POST", body: { token, new_password: newPassword } }),
};
