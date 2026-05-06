import { API_BASE } from "@/config/api";
import { getMockApiResponse } from "@/lib/testSession";

type Json = Record<string, unknown> | unknown[] | null;

async function request<T>(method: string, path: string, body?: Json): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("devant.token") : null;
  const mockData = getMockApiResponse(method, path, token);
  if (mockData !== undefined) {
    return mockData as T;
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const init: RequestInit = { method, headers };
  if (body !== undefined && (method === "POST" || method === "PUT")) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new Error(`Network error: ${(e as Error).message}`);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const msg =
      (obj && typeof obj.error === "string" && obj.error) ||
      (obj && typeof obj.message === "string" && obj.message) ||
      `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(String(msg));
  }

  // Tolerantly unwrap { success, data, error } envelope (Phase 9 standardization).
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if ("success" in obj && ("data" in obj || "error" in obj)) {
      if (obj.success === false) {
        throw new Error(typeof obj.error === "string" ? obj.error : "Request failed");
      }
      return obj.data as T;
    }
  }
  return data as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Json) => request<T>("POST", path, body),
  put: <T>(path: string, body?: Json) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export type ApiClient = typeof apiClient;
