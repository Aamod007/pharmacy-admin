import { useAuthStore } from "../store/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "An error occurred while communicating with the server");
  }

  return json;
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
