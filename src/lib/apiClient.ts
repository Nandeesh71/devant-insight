import { API_BASE } from "@/config/api";
import { getDemoResponse, isDemoToken } from "@/lib/demoData";

type Json = Record<string, unknown> | unknown[] | null;

async function request<T>(method: string, path: string, body?: Json): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("devant.token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (isDemoToken(token)) {
    return getDemoResponse(method, path) as T;
  }

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
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in (data as object) && (data as { message?: string }).message) ||
      `Request failed: ${res.status} ${res.statusText}`;
    throw new Error(String(msg));
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
