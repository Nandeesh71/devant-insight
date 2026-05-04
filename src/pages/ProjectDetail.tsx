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

function getRepoName(project: Project | undefined) {
  if (!project) return "—";
  return project.name || project.github_repo || project.repository_name || "Unknown";
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

export default function ProjectDetail() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();
  const data = useDevantData();
  const { loading, error, refetch, projects, health, finance, dora } = data;
  const [tab, setTab] = useState("commits");
  const [search, setSearch] = useState("");
  const [disconnectTarget, setDisconnectTarget] = useState<Project | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<Record<string, unknown> | null>(null);

  // Find the current project by repo name
  const currentProject = useMemo(
    () => projects.find((p) => {
      const name = getRepoName(p);
      return name === repo || p.github_repo === repo;
    }) || null,
    [projects, repo]
  );

  useEffect(() => {
    if (!owner || !repo) {
      navigate("/");
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
  }, [owner, repo]);

  const handleDisconnect = async () => {
    if (!currentProject) return;

    try {
      await apiClient.delete(`/api/projects/${currentProject.id}`);
      setDisconnectTarget(null);
      toast({ title: "Repository disconnected", description: getRepoName(currentProject) });
      navigate("/");
    } catch (error) {
      toast({ title: "Disconnect failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (loading || summaryLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold text-foreground">Project not found</div>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TooltipProvider delayDuration={150}>
        <LoadingSpinner visible={loading} />

        {/* Header */}
        <div className="border-b border-border/50 bg-card">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Back to projects"
              >
                <ArrowLeft size={18} strokeWidth={1.5} />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>Projects</span>
                  <ChevronRight size={14} />
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <GitFork size={16} strokeWidth={1.5} />
                  <span>{owner}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-brand">{repo}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={refetch}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Refresh"
                  >
                    <RefreshCw size={16} strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh</TooltipContent>
              </Tooltip>
              <button className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-brand/90 transition-colors">
                <LinkIcon size={14} strokeWidth={1.5} />
                <span>Link Repository</span>
              </button>
            </div>
          </div>
        </div>

        <main className="pb-24">
          <ErrorBanner error={error || summaryError} onRetry={refetch} />

          {/* Metrics Row */}
          <section className="grid grid-cols-1 gap-3 px-6 py-6 md:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-lift">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity size={12} strokeWidth={1.5} /> Project Health
              </div>
              <div className="mt-2 flex items-end gap-1.5">
                <div className="text-3xl font-bold text-foreground">{health?.score ?? "—"}</div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">/ 100</div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${Math.max(0, Math.min(health?.score ?? 0, 100))}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] font-medium text-muted-foreground">
                {health?.score !== null && (health.score >= 71 ? "Good" : health.score >= 41 ? "Needs Attention" : "Critical")}
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-lift">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertCircle size={12} strokeWidth={1.5} /> Budget · Burn · Runway
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">
                {finance?.spent ? `₹${finance.spent.toLocaleString()}` : "No budget set"}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${Math.max(0, Math.min(finance?.burn_percent ?? 0, 100))}%` }}
                />
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                {finance?.burn_percent ?? "—"}% spent · {finance?.runway_months ?? "—"}mo runway
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card transition-all duration-200 hover:shadow-lift">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info size={12} strokeWidth={1.5} /> DORA Metrics
              </div>
              <div className="mt-3 grid grid-cols-2 gap-0">
                <div className="border-b border-r border-border/60 bg-card p-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Zap size={12} strokeWidth={1.5} /> Deploy Freq
                  </div>
                  <div className="mt-1 font-semibold text-foreground">{dora?.deployment_frequency?.value ?? "—"}</div>
                </div>
                <div className="border-b border-border/60 bg-card p-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={12} strokeWidth={1.5} /> Lead Time
                  </div>
                  <div className="mt-1 font-semibold text-foreground">{dora?.change_lead_time?.value ?? "—"}</div>
                </div>
                <div className="border-r border-border/60 bg-card p-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertTriangle size={12} strokeWidth={1.5} /> Failure Rate
                  </div>
                  <div className="mt-1 font-semibold text-foreground">{dora?.change_failure_rate?.value ?? "—"}</div>
                </div>
                <div className="bg-card p-2.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star size={12} strokeWidth={1.5} /> Rating
                  </div>
                  <div className="mt-1 font-semibold text-foreground">{dora?.deployment_frequency?.rating ?? "—"}</div>
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
                  <ExternalLink size={14} className="text-muted-foreground shrink-0" />
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
                  <span>Created {currentProject.created_at || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={14} className="shrink-0" />
                  <span>Updated {currentProject.updated_at || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GitBranch size={14} className="shrink-0" />
                  <span>{currentProject.default_branch || "main"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card p-4 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Quick Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Commits</span>
                  <span className="font-semibold text-foreground">{String(((summaryData?.commits as Record<string, unknown> | undefined)?.total as number | string | undefined) ?? "—")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contributors</span>
                  <span className="font-semibold text-foreground">{String(((summaryData?.team as Record<string, unknown> | undefined)?.count as number | string | undefined) ?? "—")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open PRs</span>
                  <span className="font-semibold text-foreground">{String(((summaryData?.pull_requests as Record<string, unknown> | undefined)?.open as number | string | undefined) ?? "—")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Issues</span>
                  <span className="font-semibold text-foreground">{String((summaryData?.open_issues as number | string | undefined) ?? "—")}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Tabs Section */}
          <section className="px-6 py-6">
            <div className="flex items-center gap-1.5 border-b border-border/70">
              {[
                { id: "commits", label: "Recent Commits", icon: GitCommit },
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
                      onClick={() => setDisconnectTarget(currentProject)}
                      className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                    >
                      <Unplug size={14} strokeWidth={1.5} />
                      Disconnect Repository
                    </button>
                  </div>
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
          projectName={disconnectTarget ? getRepoName(disconnectTarget) : ""}
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
