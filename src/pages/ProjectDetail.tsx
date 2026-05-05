import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Code,
  Clock,
  ExternalLink,
  GitBranch,
  GitCommit,
  GitFork,
  Github,
  Grid3x3,
  Link as LinkIcon,
  List,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  Star,
  Unplug,
  Users,
  Zap,
  X,
  Activity,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DisconnectModal } from "@/components/ui/disconnect-modal";
import { LoadingSpinner, ErrorBanner } from "@/components/StatusBanners";
import { useAuth } from "@/context/AuthContext";
import { useDevantData, type Project } from "@/hooks/useDevantData";
import { apiClient } from "@/lib/apiClient";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type UiCommit = {
  id: string;
  sha: string;
  message: string;
  author: string;
  date: string;
  tag: string;
  risk: string;
  size: string;
  summary: string;
  filesChanged?: number | string;
  linesAdded?: number | string;
  linesRemoved?: number | string;
  url?: string;
};

function getRepoName(project: Project | undefined): string {
  if (!project) return "—";
  return String(project.name || project.github_repo || project.repository_name || "Unknown");
}

function getProjectRepoUrl(p: Project | undefined) {
  if (!p) return null;
  const owner = p.owner || p.github_owner || "owner";
  const repo = p.github_repo || p.name || p.repository_name || "";
  return repo ? `https://github.com/${owner}/${repo}` : null;
}

function getProjectCommitsUrl(p: Project | undefined) {
  if (!p) return null;
  const owner = p.owner || p.github_owner || "owner";
  const repo = p.github_repo || p.name || p.repository_name || "";
  return repo ? `https://github.com/${owner}/${repo}/commits` : null;
}

function getRepoFullName(p: Project | undefined) {
  if (!p) return "";
  const raw = p as Record<string, unknown>;
  return String(raw.repo_full_name || raw.github_repo_full_name || p.github_repo || p.name || p.repository_name || "");
}

export default function ProjectDetail() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const data = useDevantData();
  const { loading, error, refetch, projects, health, finance, dora } = data;
  const [tab, setTab] = useState("commits");
  const [deploymentsList, setDeploymentsList] = useState<Record<string, unknown>[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [commitsList, setCommitsList] = useState<Record<string, unknown>[]>([]);
  const [commitsLoadingLocal, setCommitsLoadingLocal] = useState(false);
  const [search, setSearch] = useState("");
  const [disconnectTarget, setDisconnectTarget] = useState<Project | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<Record<string, unknown> | null>(null);
  const [teamData, setTeamData] = useState<Record<string, unknown> | null>(null);
  const [contributorsData, setContributorsData] = useState<Record<string, unknown>[]>([]);
  const [detailTick, setDetailTick] = useState(0);
  const [hydrationAttempted, setHydrationAttempted] = useState(false);

  // Find the current project by repo name
  const currentProject = useMemo(
    () => projects.find((p) => {
      const fullName = getRepoFullName(p);
      const name = getRepoName(p);
      return (
        fullName === `${owner}/${repo}` ||
        fullName.endsWith(`/${repo}`) ||
        name === repo ||
        p.github_repo === repo ||
        p.repository_name === repo
      );
    }) || null,
    [projects, owner, repo]
  );

  function formatDateISO(d: string | null | undefined) {
    if (!d) return '—';
    try {
      const dt = new Date(String(d));
      return dt.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch { return String(d); }
  }

  const summaryProject = (summaryData?.project as Project | undefined) || null;
  const resolvedProject = currentProject || summaryProject;
  const resolvedProjectId = resolvedProject?.id || null;

  useEffect(() => {
    if (!owner || !repo) {
      navigate("/dashboard");
    }
  }, [owner, repo, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProjectDetail(repoOwner: string, repoName: string) {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const summary = await apiClient.get<Record<string, unknown>>(`/api/projects/${repoOwner}/${repoName}/summary`);
        if (!cancelled) setSummaryData(summary);
      } catch (e) {
        if (!cancelled) setSummaryError((e as Error).message);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }

    if (owner && repo) {
      fetchProjectDetail(owner, repo);
    }

    return () => {
      cancelled = true;
    };
  }, [owner, repo, detailTick]);

  useEffect(() => {
    if (!resolvedProjectId) return;

    let cancelled = false;
    async function fetchPeople() {
      try {
        const [team, contributors] = await Promise.all([
          apiClient.get<Record<string, unknown>>(`/api/team/${resolvedProjectId}`),
          apiClient.get<Record<string, unknown>[]>(`/api/commits/${resolvedProjectId}/contributors`),
        ]);

        if (cancelled) return;
        setTeamData(team);
        setContributorsData(Array.isArray(contributors) ? contributors : []);
      } catch {
        if (!cancelled) {
          setTeamData(null);
          setContributorsData([]);
        }
      }
    }

    void fetchPeople();

    return () => {
      cancelled = true;
    };
  }, [resolvedProjectId, detailTick]);

  useEffect(() => {
    if (!resolvedProjectId || summaryLoading || hydrationAttempted) return;

    const commitTotal = Number(((summaryData?.commits as Record<string, unknown> | undefined)?.total as number | string | undefined) ?? 0);
    if (commitTotal > 0) return;

    let cancelled = false;
    setHydrationAttempted(true);
    void apiClient.post(`/api/github/sync/${resolvedProjectId}`).then(() => {
      if (cancelled) return;
      setDetailTick((current) => current + 1);
    }).catch(() => {
      if (!cancelled) setDetailTick((current) => current + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [resolvedProjectId, summaryData, summaryLoading, hydrationAttempted]);

  // Fetch deployments when user opens Deployments tab
  useEffect(() => {
    let cancelled = false;
    async function loadDeployments() {
      if (!resolvedProjectId) return;
      setDeploymentsLoading(true);
      try {
        const rows = await apiClient.get<Record<string, unknown>[]>(`/api/deployments/${resolvedProjectId}`);
        if (!cancelled) setDeploymentsList(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setDeploymentsList([]);
      } finally {
        if (!cancelled) setDeploymentsLoading(false);
      }
    }

    if (tab === 'deployments') loadDeployments();
    return () => { cancelled = true; };
  }, [tab, resolvedProjectId, detailTick]);

  // If summary has no recent commits, fetch raw commits as a fallback
  useEffect(() => {
    let cancelled = false;
    async function loadCommitsFallback() {
      if (!resolvedProjectId) return;
      setCommitsLoadingLocal(true);
      try {
        const rows = await apiClient.get<Record<string, unknown>[]>(`/api/commits/${resolvedProjectId}?limit=5`);
        if (!cancelled) setCommitsList(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setCommitsList([]);
      } finally {
        if (!cancelled) setCommitsLoadingLocal(false);
      }
    }

    const commitTotal = Number(((summaryData?.commits as Record<string, unknown> | undefined)?.total as number | string | undefined) ?? 0);
    if (tab === 'commits' && commitTotal === 0) {
      void loadCommitsFallback();
    }

    return () => { cancelled = true; };
  }, [tab, resolvedProjectId, summaryData, detailTick]);

  const handleDisconnect = async () => {
    if (!resolvedProject) return;

    try {
      await apiClient.delete(`/api/projects/${resolvedProject.id}`);
      setDisconnectTarget(null);
      toast({ title: "Repository disconnected", description: String(getRepoName(resolvedProject)) });
      navigate("/dashboard");
    } catch (error) {
      toast({ title: "Disconnect failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (loading || (summaryLoading && !summaryData)) {
    return <ProjectDetailSkeleton />;
  }

  if (!resolvedProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold text-foreground">Project not found</div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const recentCommits = ((summaryData?.commits as Record<string, unknown> | undefined)?.recent as Record<string, unknown>[] | undefined) || [];
  const teamMembers = (teamData?.members as Record<string, unknown>[] | undefined) || ((summaryData?.team as Record<string, unknown> | undefined)?.members as Record<string, unknown>[] | undefined) || [];
  const repoMeta = teamData?.repo as Record<string, unknown> | undefined;
  const repoOwner = repoMeta?.owner as Record<string, unknown> | undefined;
  const repoCollaborators = (repoMeta?.collaborators as Record<string, unknown>[] | undefined) || [];
  const repoContributors = (repoMeta?.contributors as Record<string, unknown>[] | undefined) || [];
  const commitContributors = repoContributors.length > 0 ? repoContributors : contributorsData;

  return (
    <div className="min-h-screen bg-background ml-[3.05rem]">
      <TooltipProvider delayDuration={150}>
        <LoadingSpinner visible={loading} />

        {/* Header */}
        <div className="border-b border-border/50 bg-card">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium"
                  style={{ color: '#7c3aed', fontWeight: 500 }}
                  aria-label="Back to projects"
                >
                  <ArrowLeft size={16} strokeWidth={1.5} />
                  <span>Projects</span>
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span style={{ color: '#8b80a8' }}>{owner}</span>
                    <ChevronRight size={14} />
                    <GitFork size={16} strokeWidth={1.5} />
                    <span style={{ color: '#7c3aed', fontWeight: 600 }}>{repo}</span>
                  </div>
                </div>
              </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={refetch}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
                    style={{ width: 32, height: 32 }}
                    aria-label="Refresh"
                  >
                    <RefreshCw size={16} strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        <main className="pb-24">
          <ErrorBanner error={error || summaryError} onRetry={refetch} />

          {/* Metrics Row */}
          <section className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <Activity size={16} strokeWidth={1.5} className="text-purple-500 dark:text-purple-400" />
                Project Health
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <div className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{health?.score ?? "—"}</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">/ 100</div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(0, Math.min(health?.score ?? 0, 100))}%` }}
                />
              </div>
              <div className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                {health?.score !== null && (health.score >= 71 ? "Status: Good" : health.score >= 41 ? "Status: Needs Attention" : "Status: Critical")}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                <AlertCircle size={16} strokeWidth={1.5} className="text-blue-500 dark:text-blue-400" />
                Budget & Runway
              </div>
              <div className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {finance?.spent ? `₹${finance.spent.toLocaleString()}` : "No budget set"}
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800/60">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(0, Math.min(finance?.burn_percent ?? 0, 100))}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>{finance?.burn_percent ?? "0"}% burned</span>
                <span>{finance?.runway_months ?? "—"} months runway</span>
              </div>
              <div className="mt-4">
                <button onClick={() => setTab('settings')} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Set Budget</button>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                <Info size={16} strokeWidth={1.5} className="text-emerald-500 dark:text-emerald-400" />
                DORA Metrics
              </div>
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="flex flex-col justify-center rounded-lg bg-gray-50 dark:bg-gray-800/30 p-3 border border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    <Zap size={12} strokeWidth={1.5} /> Deploy Freq
                  </div>
                  <div className="mt-1 text-base font-bold text-gray-900 dark:text-white">{dora?.deployment_frequency?.value ?? "—"}</div>
                </div>
                <div className="flex flex-col justify-center rounded-lg bg-gray-50 dark:bg-gray-800/30 p-3 border border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    <Clock size={12} strokeWidth={1.5} /> Lead Time
                  </div>
                  <div className="mt-1 text-base font-bold text-gray-900 dark:text-white">
                    {(typeof dora?.change_lead_time?.value === 'number' && dora.change_lead_time.value >= 0) ? dora.change_lead_time.value : '—'}
                  </div>
                </div>
                <div className="flex flex-col justify-center rounded-lg bg-gray-50 dark:bg-gray-800/30 p-3 border border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    <AlertTriangle size={12} strokeWidth={1.5} /> Failure Rate
                  </div>
                  <div className="mt-1 text-base font-bold text-gray-900 dark:text-white">{dora?.change_failure_rate?.value ?? "—"}</div>
                </div>
                <div className="flex flex-col justify-center rounded-lg bg-gray-50 dark:bg-gray-800/30 p-3 border border-gray-100 dark:border-gray-800/50">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    <Star size={12} strokeWidth={1.5} /> Rating
                  </div>
                  <div className="mt-1">
                    {(() => {
                      const rating = dora?.deployment_frequency?.rating || null;
                      if (!rating) return <span className="text-base font-bold text-gray-900 dark:text-white">—</span>;
                      const map: Record<string, {bg:string,color:string,border:string,darkBg:string,darkColor:string,darkBorder:string}> = {
                        Elite: { bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0', darkBg: 'rgba(22,163,74,0.1)', darkColor: '#4ade80', darkBorder: 'rgba(74,222,128,0.2)' },
                        High: { bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe', darkBg: 'rgba(29,78,216,0.1)', darkColor: '#60a5fa', darkBorder: 'rgba(96,165,250,0.2)' },
                        Medium: { bg: '#fef9c3', color: '#854d0e', border: '#fef3c7', darkBg: 'rgba(161,98,7,0.1)', darkColor: '#facc15', darkBorder: 'rgba(250,204,21,0.2)' },
                        Low: { bg: '#fee2e2', color: '#dc2626', border: '#fecaca', darkBg: 'rgba(220,38,38,0.1)', darkColor: '#f87171', darkBorder: 'rgba(248,113,113,0.2)' },
                      };
                      const s = map[rating] || map['Low'];
                      return <span className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold shadow-sm dark:bg-[var(--darkBg)] dark:text-[var(--darkColor)] dark:border-[var(--darkBorder)] border" style={{ background: s.bg, color: s.color, borderColor: s.border, '--darkBg': s.darkBg, '--darkColor': s.darkColor, '--darkBorder': s.darkBorder } as React.CSSProperties}>{rating}</span>;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Project Info Section */}
          <section className="grid grid-cols-1 gap-4 px-6 py-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Repository Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Github size={14} className="text-muted-foreground shrink-0" />
                  <a
                    href={`https://github.com/${owner}/${repo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    github.com/{owner}/{repo}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={14} className="shrink-0" />
                  <span>Created {formatDateISO((resolvedProject as Record<string, unknown>).created_at as string || null)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={14} className="shrink-0" />
                  <span>Updated {((resolvedProject as Record<string, unknown>).updated_at as string) ? formatDateISO((resolvedProject as Record<string, unknown>).updated_at as string) : 'just now'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch size={14} className="shrink-0" />
                  <span className="rounded-full border border-border/50 px-2 py-0.5 text-xs font-semibold text-foreground">{(resolvedProject as Record<string, unknown>).default_branch as string || "main"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                {[
                  { key: 'commits', icon: GitCommit, label: 'Total Commits', value: String(((summaryData?.commits as Record<string, unknown> | undefined)?.total as number | string | undefined) ?? '—') },
                  { key: 'contributors', icon: Users, label: 'Contributors', value: String(((summaryData?.team as Record<string, unknown> | undefined)?.count as number | string | undefined) ?? '—') },
                  { key: 'prs', icon: GitFork, label: 'Open PRs', value: String(((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open as number | string | undefined) ?? '—') },
                  { key: 'issues', icon: AlertCircle, label: 'Issues', value: String((summaryData?.open_issues as number | string | undefined) ?? '—') },
                  { key: 'deployments', icon: Zap, label: 'Deployments', value: String(((summaryData?.deployments as Record<string, unknown> | undefined)?.total as number | string | undefined) ?? '—') },
                ].map((s) => {
                  const Icon = s.icon as any;
                  return (
                    <div key={s.key} className="flex items-center justify-between rounded-sm hover:bg-[#faf9ff] px-2 py-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon size={14} strokeWidth={1.5} />
                        <span>{s.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-foreground">{s.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Tabs Section */}
          <section className="px-6 py-6">
            <div className="flex items-center gap-1.5 border-b border-border/70">
              {[
                { id: "commits", label: "Recent Commits", icon: GitCommit },
                { id: "deployments", label: "Deployments", icon: Zap },
                { id: "team", label: "Team", icon: Users },
                { id: "alerts", label: "Alerts", icon: Bell },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-colors duration-150 ease-out",
                      active ? "text-foreground after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-brand" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={16} strokeWidth={1.5} /> {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              {tab === "settings" ? (
                <div className="space-y-6">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <h3 className="mb-3 font-semibold text-destructive">Danger Zone</h3>
                    <p className="mb-4 text-sm text-muted-foreground">Permanently disconnect this repository from DevANT.</p>
                    <button
                      onClick={() => setDisconnectTarget(resolvedProject)}
                      className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      <Unplug size={14} strokeWidth={1.5} />
                      Disconnect Repository
                    </button>
                  </div>
                </div>
              ) : tab === "commits" ? (
                <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Recent Commits</h3>
                      <p className="text-xs text-muted-foreground">Latest commits pulled from the project summary.</p>
                    </div>
                    <a
                      href={getProjectCommitsUrl(resolvedProject) || `https://github.com/${owner}/${repo}/commits`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold text-brand hover:bg-brand/5"
                    >
                      Open on GitHub <ExternalLink size={12} />
                    </a>
                  </div>

                  {((recentCommits.length === 0) && (commitsList.length === 0)) ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-t border-gray-100 dark:border-gray-800/50">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
                        <GitCommit size={28} strokeWidth={1.5} />
                      </div>
                      <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">No commits found</h3>
                      <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                        We couldn't find any recent commits for this project. Ensure your repository is active and correctly linked.
                      </p>
                      <button onClick={refetch} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                        <RefreshCw size={14} /> Refresh Data
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-hidden flex flex-col">
                      <style>{`
                        .scrollable-commits-list::-webkit-scrollbar {
                          width: 8px;
                        }
                        .scrollable-commits-list::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        .scrollable-commits-list::-webkit-scrollbar-thumb {
                          background: rgba(168, 85, 247, 0.4);
                          border-radius: 4px;
                          transition: background 0.2s;
                        }
                        .scrollable-commits-list::-webkit-scrollbar-thumb:hover {
                          background: rgba(168, 85, 247, 0.7);
                        }
                      `}</style>
                      <div className="scrollable-commits-list space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
                        {(recentCommits.length > 0 ? recentCommits : commitsList).map((commit) => {
                          const key = String((commit as any).sha || (commit as any).id || (commit as any).message);
                          const msg = String((commit as any).message || 'Untitled commit');
                          const sha = String((commit as any).sha || (commit as any).id || '').slice(0, 7);
                          const author = String((commit as any).author_github_username || (commit as any).author || 'Unknown');
                          const linesAdded = String((commit as any).lines_added || 0);
                          const linesRemoved = String((commit as any).lines_removed || 0);
                          const aiTag = String((commit as any).ai_type_tag || '') || null;
                          const time = String((commit as any).timestamp || (commit as any).date || '—');
                          return (
                            <div key={key} className="flex items-start justify-between rounded-lg border border-border/60 p-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start gap-3 min-w-0">
                                <GitCommit size={18} className="text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="font-medium text-foreground truncate" style={{ maxWidth: 680, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg}</div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top"><div style={{ maxWidth: 420 }}>{msg}</div></TooltipContent>
                                  </Tooltip>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 overflow-hidden rounded-full bg-muted flex items-center justify-center text-xs font-semibold">{author.slice(0,1).toUpperCase()}</div>
                                      <span>{author}</span>
                                    </div>
                                    <code className="font-mono text-xs px-2 py-0.5 rounded-md border border-border/50">{sha}</code>
                                    {aiTag ? <span className="rounded-full bg-purple-50 text-purple-600 px-2 py-0.5 text-xs font-semibold">{aiTag}</span> : null}
                                    <span className="text-xs"><span style={{ color: '#16a34a' }}>+{linesAdded}</span> / <span style={{ color: '#dc2626' }}>-{linesRemoved}</span></span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">{time}</span>
                                <a href={String((commit as any).url || getProjectCommitsUrl(resolvedProject) || `https://github.com/${owner}/${repo}/commit/${(commit as any).sha}`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
                                  <ExternalLink size={14} />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : tab === "deployments" ? (
                <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Deployments</h3>
                      <p className="text-xs text-muted-foreground">Recent deployments for this project.</p>
                    </div>
                  </div>

                  {deploymentsLoading ? (
                    <div className="py-12 text-center text-muted-foreground">Loading deployments...</div>
                  ) : deploymentsList.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No deployments recorded for this project yet.</div>
                  ) : (
                    <div className="overflow-hidden flex flex-col">
                      <style>{`
                        .scrollable-deployments-list::-webkit-scrollbar {
                          width: 8px;
                        }
                        .scrollable-deployments-list::-webkit-scrollbar-track {
                          background: transparent;
                        }
                        .scrollable-deployments-list::-webkit-scrollbar-thumb {
                          background: rgba(168, 85, 247, 0.4);
                          border-radius: 4px;
                          transition: background 0.2s;
                        }
                        .scrollable-deployments-list::-webkit-scrollbar-thumb:hover {
                          background: rgba(168, 85, 247, 0.7);
                        }
                      `}</style>
                      <div className="scrollable-deployments-list space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
                        {deploymentsList.map((d) => (
                          <div key={String((d as any).id || (d as any).deployed_at)} className="rounded-lg border border-border/60 p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${(d as any).status === 'success' || (d as any).status === 'deployed' ? 'bg-emerald-100/50 text-emerald-700' : (d as any).status === 'failed' ? 'bg-red-100/50 text-red-700' : 'bg-amber-100/50 text-amber-700'}`}>
                                    {String((d as any).status || 'pending').charAt(0).toUpperCase() + String((d as any).status || 'pending').slice(1)}
                                  </div>
                                  <span className="font-medium text-foreground">{String((d as any).environment || 'Production').toUpperCase()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{String((d as any).deployed_at || '—')}</p>
                                {(d as any).description && <p className="text-xs text-muted-foreground mt-1">{String((d as any).description)}</p>}
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                {(d as any).log_url && (
                                  <a href={String((d as any).log_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand hover:bg-brand/5 transition-colors">
                                    <ExternalLink size={12} />
                                    Logs
                                  </a>
                                )}
                                {(d as any).commit_sha && (
                                  <code className="font-mono text-xs px-2 py-0.5 rounded-md border border-border/50 text-muted-foreground">{String((d as any).commit_sha).slice(0, 7)}</code>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : tab === "team" ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Repository Owner</h3>
                          {repoOwner ? (
                            <div className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                              <Avatar>
                                {repoOwner.avatar_url ? <AvatarImage src={String(repoOwner.avatar_url)} alt={String(repoOwner.login || owner)} /> : <AvatarFallback>{String((repoOwner.login || owner || 'O')).slice(0,1).toUpperCase()}</AvatarFallback>}
                              </Avatar>
                              <div>
                                <div className="font-medium text-foreground">{String(repoOwner.name || repoOwner.login || owner)}</div>
                                <div className="text-xs text-muted-foreground">@{String(repoOwner.login || owner)}</div>
                              </div>
                              <a href={String(repoOwner.html_url || `https://github.com/${owner}`)} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>
                                <button className="inline-flex items-center gap-2 rounded-md border border-border/50 px-3 py-1 text-sm">View Profile</button>
                              </a>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Owner data not available yet.</div>
                          )}
                  </div>

                  <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Collaborators</h3>
                          {repoCollaborators.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No collaborators returned from GitHub.</div>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                              {repoCollaborators.map((person) => (
                                <div key={String((person as Record<string, unknown>).login)} className="rounded-lg border border-border/60 p-3 flex items-center gap-3">
                                  <Avatar>
                                    {(person as any).avatar_url ? <AvatarImage src={String((person as any).avatar_url)} /> : <AvatarFallback>{String(((person as any).login || 'U')).slice(0,1).toUpperCase()}</AvatarFallback>}
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground truncate">{String((person as any).login)}</div>
                                    <div className="text-xs text-muted-foreground mt-1">collaborator</div>
                                  </div>
                                  <a href={String((person as any).html_url || `https://github.com/${(person as any).login}`)} target="_blank" rel="noreferrer">
                                    <ExternalLink size={14} color="#8b80a8" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                  </div>

                  <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Contributors</h3>
                    {commitContributors.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No contributors returned from GitHub.</div>
                    ) : (
                      (() => {
                        const sorted = [...commitContributors].sort((a: any, b: any) => (b.contributions || b.commit_count || 0) - (a.contributions || a.commit_count || 0));
                        const max = Math.max(1, ...(sorted.map((s: any) => Number(s.contributions || s.commit_count || 0))));
                        return (
                          <div className="grid gap-3 sm:grid-cols-3">
                            {sorted.map((person: any, i: number) => (
                              <div key={String(person.login || i)} className="rounded-lg border border-border/60 p-3 flex flex-col items-center gap-3 relative">
                                {i === 0 && <div style={{ position: 'absolute', top: 8, right: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.9 7.82 20 9 12.91 4 9.27l5.91-.99L12 2z" fill="#f59e0b"/></svg></div>}
                                <div style={{ position: 'relative' }}>
                                  <Avatar>
                                    {person.avatar_url ? <AvatarImage src={String(person.avatar_url)} /> : <AvatarFallback>{String((person.login || 'U')).slice(0,1).toUpperCase()}</AvatarFallback>}
                                  </Avatar>
                                  {person.type === 'Bot' && <span style={{ position: 'absolute', bottom: -6, right: -6, background: '#6b7280', color: '#fff', fontSize: 10, borderRadius: 4, padding: '2px 4px' }}>BOT</span>}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div className="font-medium text-foreground">{String(person.login)}</div>
                                  <div className="text-xs text-muted-foreground">{String(person.contributions || person.commit_count || 0)} commits</div>
                                </div>
                                <div className="w-full h-2 bg-[#f4f2f9] rounded-full">
                                  <div style={{ width: `${Math.round(((Number(person.contributions || person.commit_count || 0) / max) * 100) || 0)}%`, height: '100%', background: '#7c3aed', borderRadius: 2 }} />
                                </div>
                                <a href={String(person.html_url || `https://github.com/${person.login}`)} target="_blank" rel="noreferrer">
                                  <button className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm">GitHub</button>
                                </a>
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </div>

                  <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Team Members</h3>
                    {teamMembers.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No database team members saved yet.</div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Member</th><th>Role</th><th className="text-right">Commits</th><th className="text-right">Profile</th></tr>
                          </thead>
                          <tbody>
                            {teamMembers.map((member: any) => (
                              <tr key={member.id || member.github_username} className="border-b border-border/50 hover:bg-[#faf9ff] last:border-0">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      {member.avatar_url ? <AvatarImage src={member.avatar_url} /> : <AvatarFallback>{String((member.github_username || 'U')).slice(0,1).toUpperCase()}</AvatarFallback>}
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-foreground">{member.display_name || member.github_username}</div>
                                      <div className="text-xs text-muted-foreground">@{member.github_username}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3"><span className="rounded-md px-2 py-1 text-xs border border-border/50">{member.role}</span></td>
                                <td className="px-4 py-3 text-right font-semibold">{member.commit_count || '—'}</td>
                                <td className="px-4 py-3 text-right"><a href={`https://github.com/${member.github_username}`} target="_blank" rel="noreferrer"><ExternalLink size={14} color="#8b80a8" /></a></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : tab === "alerts" ? (
                <div className="space-y-3 rounded-lg border border-border/50 bg-card p-4 shadow-card">
                  {[
                    !(recentCommits.length > 0) && {
                      title: "No recent commits",
                      message: "GitHub commit history is still empty or sync has not completed yet.",
                    },
                    (health?.score ?? 0) < 60 && {
                      title: "Health score needs attention",
                      message: `Current health score is ${health?.score ?? 0}/100.`,
                    },
                    teamMembers.length === 0 && {
                      title: "No team members stored",
                      message: "Repository owner, collaborators, and contributors were not saved in the team table yet.",
                    },
                    ((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open as number | string | undefined) && Number((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open ?? 0) > 0 && {
                      title: "Open pull requests",
                      message: `${String(((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open as number | string | undefined) ?? 0)} PRs are still open.`,
                    },
                    (finance?.burn_percent ?? 0) > 70 && {
                      title: "Budget burn rising",
                      message: `Burn is at ${finance?.burn_percent ?? 0}% with ${finance?.runway_months ?? "—"} months runway.`,
                    },
                  ].filter(Boolean).length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No active alerts for this project.</div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        !(recentCommits.length > 0) && {
                          title: "No recent commits",
                          message: "GitHub commit history is still empty or sync has not completed yet.",
                        },
                        (health?.score ?? 0) < 60 && {
                          title: "Health score needs attention",
                          message: `Current health score is ${health?.score ?? 0}/100.`,
                        },
                        teamMembers.length === 0 && {
                          title: "No team members stored",
                          message: "Repository owner, collaborators, and contributors were not saved in the team table yet.",
                        },
                        ((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open as number | string | undefined) && Number((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open ?? 0) > 0 && {
                          title: "Open pull requests",
                          message: `${String(((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open as number | string | undefined) ?? 0)} PRs are still open.`,
                        },
                        (finance?.burn_percent ?? 0) > 70 && {
                          title: "Budget burn rising",
                          message: `Burn is at ${finance?.burn_percent ?? 0}% with ${finance?.runway_months ?? "—"} months runway.`,
                        },
                      ].filter(Boolean).map((alert) => (
                        <div key={(alert as { title: string }).title} className="rounded-lg border border-border/60 p-3">
                          <div className="font-medium text-foreground">{(alert as { title: string }).title}</div>
                          <div className="text-sm text-muted-foreground">{(alert as { message: string }).message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="py-12">Tab content for {tab}</div>
                </div>
              )}
            </div>
          </section>
        </main>

        <DisconnectModal
          isOpen={Boolean(disconnectTarget)}
          onClose={() => setDisconnectTarget(null)}
          onConfirm={handleDisconnect}
          repoFullName={disconnectTarget ? String(getRepoFullName(disconnectTarget)) : ""}
        />
      </TooltipProvider>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 px-6 py-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </section>
    </div>
  );
}
