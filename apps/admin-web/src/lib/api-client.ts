import { useAuthStore } from "../store/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// In-flight deduplication and 3-second micro-cache to eliminate redundant remote network calls
const inFlightRequests = new Map<string, Promise<any>>();
const clientCache = new Map<string, { data: any; expiresAt: number }>();
const CLIENT_CACHE_TTL_MS = 3000;

export function invalidateClientApiCache() {
  clientCache.clear();
  inFlightRequests.clear();
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  // Cache busting on mutations
  if (method !== "GET") {
    invalidateClientApiCache();
  } else {
    // Check client-side micro-cache for rapid tab switching / re-renders
    const cached = clientCache.get(endpoint);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }

    // In-flight promise deduplication for simultaneous component calls
    const inFlight = inFlightRequests.get(endpoint);
    if (inFlight) {
      return inFlight as Promise<T>;
    }
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "An error occurred while communicating with the server");
      }

      if (method === "GET") {
        clientCache.set(endpoint, { data: json, expiresAt: Date.now() + CLIENT_CACHE_TTL_MS });
      }

      return json;
    } finally {
      if (method === "GET") {
        inFlightRequests.delete(endpoint);
      }
    }
  })();

  if (method === "GET") {
    inFlightRequests.set(endpoint, fetchPromise);
  }

  return fetchPromise;
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

