import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { useProject } from "@/context/ProjectContext";
import { getRealtimeUrl, parseRealtimeMessage } from "@/lib/realtime";

export type Project = { id: string; name: string; [k: string]: unknown };
export type Commit = {
  id: string;
  sha?: string;
  message?: string;
  author?: string;
  date?: string;
  ai_type_tag?: string;
  ai_summary?: string;
  ai_risk_flag?: string;
  diff_size?: string;
  [k: string]: unknown;
};
export type TeamMember = { id: string; name: string; role: string; status: string; last_commit?: string };
export type Finance = { budget: number; spent: number; burn_percent: number; runway_months: number };
export type Dora = {
  deployment_frequency: { value: string; rating: string };
  change_lead_time: { value: string; rating: string };
  change_failure_rate: { value: string; rating: string };
};
export type Health = { score: number; color: string; breakdown?: Record<string, number> };
export type Summary = Record<string, unknown>;

export type DevantData = {
  loading: boolean;
  error: string | null;
  projects: Project[];
  summary: Summary | null;
  commits: Commit[];
  team: TeamMember[];
  finance: Finance | null;
  dora: Dora | null;
  health: Health | null;
  refetch: () => void;
};

export function useDevantData(): DevantData {
  const { projectId, setProjectId } = useProject();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [finance, setFinance] = useState<Finance | null>(null);
  const [dora, setDora] = useState<Dora | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [tick, setTick] = useState(0);
  const [hydratedProjects, setHydratedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("devant.token");
    if (!token) return;

    const socket = new WebSocket(getRealtimeUrl());

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: "subscribe",
        projectIds: projects.map((p) => p.id),
      }));
    };

    socket.onmessage = (event) => {
      const msg = parseRealtimeMessage(String(event.data));
      if (!msg || msg.type !== "project.update") return;

      const updatedProjectId = String(msg.projectId || "");
      if (!updatedProjectId) return;

      const relevant = updatedProjectId === projectId || !projectId;
      if (!relevant) return;

      setTick((current) => current + 1);
    };

    return () => {
      socket.close();
    };
  }, [projectId, projects]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function load() {
      if (typeof window !== "undefined" && !localStorage.getItem("devant.token")) {
        setProjects([]);
        setSummary(null);
        setCommits([]);
        setTeam([]);
        setFinance(null);
        setDora(null);
        setHealth(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      // Set a 10-second timeout to prevent indefinite loading
      timeoutId = setTimeout(() => {
        if (!cancelled) {
          setLoading(false);
          setError("Request timeout - try refreshing");
        }
      }, 10000);

      try {
        const ps = await apiClient.get<Project[]>("/api/projects");
        if (cancelled) return;
        clearTimeout(timeoutId);
        
        setProjects(Array.isArray(ps) ? ps : []);
        const storedProjectExists = projectId ? ps.some((p) => p.id === projectId) : false;
        const activeId = storedProjectExists ? projectId : ps[0]?.id;
        if (!activeId) {
          setProjectId(null);
          setSummary(null);
          setCommits([]);
          setTeam([]);
          setFinance(null);
          setDora(null);
          setHealth(null);
          setLoading(false);
          return;
        }
        if (!storedProjectExists) setProjectId(activeId);

        const [s, c, t, f, d, h] = await Promise.all([
          apiClient.get<Summary>(`/api/projects/${activeId}/summary`).catch(() => null),
          apiClient.get<Commit[]>(`/api/commits/${activeId}`).catch(() => []),
          apiClient.get<TeamMember[]>(`/api/team/${activeId}`).catch(() => []),
          apiClient.get<Finance>(`/api/team/${activeId}/finance`).catch(() => null),
          apiClient.get<Dora>(`/api/metrics/${activeId}/dora`).catch(() => null),
          apiClient.get<Health>(`/api/metrics/${activeId}/health`).catch(() => null),
        ]);
        if (cancelled) return;
        setSummary(s);
        setCommits(Array.isArray(c) ? c : []);
        setTeam(Array.isArray(t) ? t : []);
        setFinance(f);
        setDora(d);
        setHealth(h);

        const commitTotal = Number((s as Record<string, unknown> | null)?.commits && typeof (s as Record<string, unknown>).commits === "object" ? ((s as Record<string, unknown>).commits as Record<string, unknown>).total : 0) || 0;
        const needsHydration = commitTotal === 0 && !hydratedProjects[activeId];
        const activeProject = ps.find((p) => p.id === activeId) as Record<string, unknown> | undefined;
        const repoFullName = String(activeProject?.github_repo_full_name || activeProject?.repo_full_name || "");
        if (needsHydration && repoFullName) {
          try {
            await apiClient.post(`/api/github/sync/${activeId}`);
            if (cancelled) return;
            setHydratedProjects((current) => ({ ...current, [activeId]: true }));
            setTick((current) => current + 1);
            return;
          } catch {
            setHydratedProjects((current) => ({ ...current, [activeId]: true }));
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message);
          setProjects([]);
          setLoading(false);
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [projectId, tick, setProjectId]);

  // Phase 11: poll backend every 15s for fresh data.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = setInterval(() => {
      if (!localStorage.getItem("devant.token")) return;
      if (document.visibilityState === "hidden") return;
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  return {
    loading,
    error,
    projects,
    summary,
    commits,
    team,
    finance,
    dora,
    health,
    refetch: () => setTick((t) => t + 1),
  };
}
