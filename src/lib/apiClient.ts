import { API_BASE } from "@/config/api";

type Json = Record<string, unknown> | unknown[] | null;

async function request<T>(method: string, path: string, body?: Json): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const init: RequestInit = { method };
  if (body !== undefined && (method === "POST" || method === "PUT")) {
    init.headers = { "Content-Type": "application/json" };
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
