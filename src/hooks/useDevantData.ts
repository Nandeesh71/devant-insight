import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { useProject } from "@/context/ProjectContext";

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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const ps = await apiClient.get<Project[]>("/api/projects");
        if (cancelled) return;
        setProjects(ps);
        const activeId = projectId || ps[0]?.id;
        if (!activeId) {
          setLoading(false);
          return;
        }
        if (!projectId && ps[0]?.id) setProjectId(ps[0].id);

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
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, tick, setProjectId]);

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
