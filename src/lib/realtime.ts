import { API_BASE } from "@/config/api";

export type RealtimeProjectMessage = {
  type: string;
  event?: string;
  projectId?: string;
  payload?: Record<string, unknown>;
  at?: string;
};

export function getRealtimeUrl(): string {
  const base = new URL(API_BASE);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws";
  return base.toString();
}

export function parseRealtimeMessage(raw: string): RealtimeProjectMessage | null {
  try {
    const parsed = JSON.parse(raw) as RealtimeProjectMessage;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
