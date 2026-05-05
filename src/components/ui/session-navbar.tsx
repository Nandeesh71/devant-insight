import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Folder, GitFork, LayoutDashboard, LogOut, Search, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProject } from "@/context/ProjectContext";
import { useDevantData, type Project } from "@/hooks/useDevantData";
import { cn } from "@/lib/utils";

type SessionNavBarProps = {
  onExpandChange?: (expanded: boolean) => void;
};

const EXPANDED_WIDTH = 312;
const COLLAPSED_WIDTH = 56;
const RAIL_WIDTH = 56;

function getRepoName(project: Project | null) {
  if (!project) return "—";
  return String(project.github_repo || project.repository || project.name || project.repo_full_name || "Untitled project");
}

function getRepoFullName(project: Project | null) {
  if (!project) return "—";
  return String(project.repo_full_name || project.github_repo_full_name || project.repository || project.name || "Untitled project");
}

function getOwnerRepo(project: Project | null): { owner: string; repo: string } {
  const full = getRepoFullName(project);
  if (full.includes("/")) {
    const [owner, ...rest] = full.split("/");
    return { owner, repo: rest.join("/") };
  }
  const owner = String(project?.owner || project?.github_owner || "owner");
  const repo = getRepoName(project);
  return { owner, repo };
}

export function SessionNavBar({ onExpandChange }: SessionNavBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { projectId, setProjectId } = useProject();
  const { projects } = useDevantData();
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    onExpandChange?.(isExpanded);
  }, [isExpanded, onExpandChange]);

  const filteredProjects = useMemo(
    () => projects.filter((p) => getRepoFullName(p).toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  const iconItems = [
    { id: "portfolio", icon: LayoutDashboard, label: "Portfolio" },
    { id: "commits", icon: GitFork, label: "Commits" },
    { id: "team", icon: User, label: "Team" },
  ];

  const activeIconId = useMemo(() => {
    if (location.pathname === "/") return "portfolio";
    if (location.pathname === "/settings") return "team";
    if (location.pathname.startsWith("/profile")) return "team";
    if (location.pathname.split("/").length >= 3) return "commits";
    return "portfolio";
  }, [location.pathname]);

  const handleProjectSelect = (project: Project) => {
    setProjectId(project.id);
    const { owner, repo } = getOwnerRepo(project);
    navigate(`/${owner}/${repo}`);
  };

  const isRepoActive = (repoFullName: string) => {
    const [owner, ...repoParts] = repoFullName.split("/");
    const repo = repoParts.join("/");
    return owner && repo && location.pathname === `/${owner}/${repo}`;
  };

  return (
    <motion.aside
      initial={{ width: COLLAPSED_WIDTH }}
      animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className="fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-sidebar-bg lg:flex"
    >
      <div className="flex h-full w-full overflow-hidden">
        <div className="flex h-full w-14 shrink-0 flex-col items-center gap-2 bg-rail py-4">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
            <img src="/devant-logo.svg" alt="DevANT" className="h-full w-full text-[#1e293b]" />
          </div>
          {iconItems.map((item) => {
            const active = activeIconId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={() => navigate("/")}
                className={cn(
                  "relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out",
                  active ? "bg-brand/10 text-white ring-1 ring-brand/30 shadow-sm" : "hover:bg-primary/10 hover:text-white hover:shadow-sm",
                )}
              >
                <item.icon size={18} strokeWidth={1.5} />
              </button>
            );
          })}
          <button
            type="button"
            aria-label="Alerts"
            onClick={() => navigate("/")}
            className="relative flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out hover:bg-primary/10 hover:text-white"
          >
            <Bell size={18} strokeWidth={1.5} />
          </button>
          <div className="mt-auto flex flex-col gap-1">
            <button
              type="button"
              aria-label="Settings"
              onClick={() => navigate("/settings")}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out hover:bg-primary/10 hover:text-white"
            >
              <Settings size={18} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Logout"
              onClick={signOut}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-[hsl(var(--sidebar-icon))] transition-all duration-150 ease-out hover:bg-primary/10 hover:text-white"
            >
              <LogOut size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <motion.div
          animate={{ width: isExpanded ? EXPANDED_WIDTH - RAIL_WIDTH : 0, opacity: isExpanded ? 1 : 0 }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
          className="flex h-full min-w-0 flex-col overflow-hidden bg-sidebar-bg text-primary-foreground"
        >
          <div className="flex items-center gap-2 px-4 pb-3 pt-4">
            <h2 className="flex-1 text-[15px] font-semibold">Projects</h2>
          </div>
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-search px-3 py-2">
              <Search size={14} strokeWidth={1.5} className="text-sidebar-text" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search linked repos..."
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-sidebar-label"
              />
            </div>
          </div>
          <div className="px-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ease-out",
                location.pathname === "/"
                  ? "bg-brand text-primary-foreground shadow-brand hover:bg-brand/90 hover:shadow-lg"
                  : "text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground",
              )}
            >
              <LayoutDashboard size={14} strokeWidth={1.5} />
              <span className="flex-1 text-left">Overview</span>
            </button>
          </div>
          <div className="mb-1 mt-5 flex items-center justify-between px-5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-label">Linked repositories</span>
          </div>
          <div className="scrollbar-hide flex-1 overflow-y-auto px-3">
            {filteredProjects.length === 0 && (
              <div className="rounded-lg border border-sidebar-tree p-3 text-xs text-sidebar-text">No linked repositories yet.</div>
            )}
            {filteredProjects.map((project) => {
              const active = projectId === project.id || isRepoActive(getRepoFullName(project));
              const repo = getRepoFullName(project);
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleProjectSelect(project)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] transition-all duration-150 ease-out",
                    active ? "bg-primary/15 text-primary-foreground" : "text-sidebar-text hover:bg-primary/10 hover:text-primary-foreground",
                  )}
                >
                  <Folder size={14} strokeWidth={1.5} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-left">{repo}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto border-t border-white/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3 text-[11px] text-sidebar-label">
              <RouterLink to="/Terms-of-Service" className="transition-colors hover:text-primary-foreground hover:underline">
                Terms of Service
              </RouterLink>
              <span>•</span>
              <RouterLink to="/Privacy-Policy" className="transition-colors hover:text-primary-foreground hover:underline">
                Privacy Policy
              </RouterLink>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  );
}
