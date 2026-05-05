"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Blocks,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FileClock,
  GraduationCap,
  Layout,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  MessagesSquare,
  Moon,
  Plus,
  Settings,
  Sun,
  UserCircle,
  UserCog,
  UserSearch,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const { user, signOut } = useAuth();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const handleThemeToggle = () => {
    document.documentElement.classList.toggle("dark");
    setIsDark((prev) => !prev);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Reusable nav item — handles both expanded and collapsed layouts
  const NavItem = ({
    to,
    icon: Icon,
    label,
    badge,
    isActive,
  }: {
    to: string;
    icon: React.ElementType;
    label: string;
    badge?: React.ReactNode;
    isActive: boolean;
  }) => (
    <RouterLink
      to={to}
      className={cn(
        "flex w-full rounded-lg cursor-pointer transition-colors duration-150",
        isCollapsed
          ? "items-center justify-center py-2.5 px-0"
          : "items-center gap-3 px-3 py-2.5",
        isActive
          ? "bg-[#7c3aed] text-white"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!isCollapsed && (
        <span className="text-sm font-medium flex items-center gap-2 truncate">
          {label}
          {badge}
        </span>
      )}
    </RouterLink>
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-full flex flex-col",
        "bg-[#1a1a2e] border-r border-[#302b59]",
        "transition-all duration-300 ease-in-out overflow-hidden",
        isCollapsed ? "w-[72px]" : "w-56"
      )}
    >
      {/* Toggle button — floats on the sidebar edge */}
      <button
        onClick={() => setIsCollapsed((prev) => !prev)}
        className={cn(
          "absolute -right-3 top-6 w-6 h-6 rounded-full z-50 shadow-md",
          "bg-[#1e1e3a] border border-white/20",
          "flex items-center justify-center",
          "hover:bg-[#7c3aed] transition-colors duration-150",
          "overflow-visible"
        )}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-white" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white" />
        )}
      </button>

      {/* ── Organization Header ── */}
      <div className="flex h-[54px] w-full shrink-0 border-b border-[#302b59] items-center px-2">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex items-center gap-2 px-2 w-full",
                isCollapsed ? "justify-center" : "justify-start"
              )}
            >
              <Avatar className="rounded size-5 shrink-0">
                <AvatarFallback className="text-[10px]">O</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium truncate">Organization</span>
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem asChild className="flex items-center gap-2">
              <RouterLink to="/settings/members">
                <UserCog className="h-4 w-4" /> Manage members
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="flex items-center gap-2">
              <RouterLink to="/settings/integrations">
                <Blocks className="h-4 w-4" /> Integrations
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <RouterLink to="/select-org" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create or join an org
              </RouterLink>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Nav Links ── */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-0.5 p-2">
          <NavItem
            to="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            isActive={pathname === "/dashboard"}
          />
          <NavItem
            to="/reports"
            icon={FileClock}
            label="Reports"
            isActive={pathname.startsWith("/reports")}
          />
          <NavItem
            to="/chat"
            icon={MessagesSquare}
            label="Chat"
            badge={
              <Badge
                className="h-fit px-1.5 text-[10px] rounded border-none bg-blue-50 text-blue-600"
                variant="outline"
              >
                BETA
              </Badge>
            }
            isActive={pathname.startsWith("/chat")}
          />

          <div className="border-t border-white/10 my-1.5" />

          <NavItem
            to="/deals"
            icon={Layout}
            label="Deals"
            isActive={pathname.startsWith("/deals")}
          />
          <NavItem
            to="/accounts"
            icon={UserCircle}
            label="Accounts"
            isActive={pathname.startsWith("/accounts")}
          />
          <NavItem
            to="/competitors"
            icon={UserSearch}
            label="Competitors"
            isActive={pathname.startsWith("/competitors")}
          />

          <div className="border-t border-white/10 my-1.5" />

          <NavItem
            to="/knowledge-base"
            icon={GraduationCap}
            label="Knowledge Base"
            isActive={pathname.startsWith("/knowledge-base")}
          />
          <NavItem
            to="/feedback"
            icon={MessageSquareText}
            label="Feedback"
            isActive={pathname.startsWith("/feedback")}
          />
          <NavItem
            to="/document-review"
            icon={FileClock}
            label="Document Review"
            isActive={pathname.startsWith("/document-review")}
          />
        </nav>
      </ScrollArea>

      {/* ── Bottom Controls ── */}
      <div className="flex flex-col gap-0.5 p-2 border-t border-[#302b59]">
        {/* Theme toggle */}
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleThemeToggle}
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                className={cn(
                  "flex w-full rounded-lg cursor-pointer transition-colors duration-150",
                  "text-slate-300 hover:bg-white/10 hover:text-white",
                  isCollapsed
                    ? "items-center justify-center py-2.5 px-0"
                    : "items-center gap-3 px-3 py-2.5"
                )}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 shrink-0" />
                )}
                {!isCollapsed && (
                  <span className="text-sm font-medium">
                    {isDark ? "Light" : "Dark"}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                {isDark ? "Light theme" : "Dark theme"}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {/* Settings */}
        <RouterLink
          to="/settings"
          className={cn(
            "flex w-full rounded-lg cursor-pointer transition-colors duration-150",
            isCollapsed
              ? "items-center justify-center py-2.5 px-0"
              : "items-center gap-3 px-3 py-2.5",
            pathname.startsWith("/settings")
              ? "bg-[#7c3aed] text-white"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Settings</span>}
        </RouterLink>

        {/* User profile */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex w-full rounded-lg cursor-pointer transition-colors duration-150",
                "text-slate-300 hover:bg-white/10 hover:text-white",
                isCollapsed
                  ? "items-center justify-center py-2.5 px-0"
                  : "items-center gap-2 px-3 py-2.5"
              )}
            >
              <Avatar className="size-5 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {user?.name?.slice(0, 1).toUpperCase() ||
                    user?.email?.slice(0, 1).toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium truncate flex-1 text-left">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={6} align="end" className="w-52">
            <div className="flex flex-row items-center gap-2 p-2">
              <Avatar className="size-7">
                <AvatarFallback>
                  {user?.name?.slice(0, 2).toUpperCase() ||
                    user?.email?.slice(0, 2).toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-sm font-medium truncate">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email || "No email"}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="flex items-center gap-2">
              <RouterLink to="/profile">
                <UserCircle className="h-4 w-4" /> Profile
              </RouterLink>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
