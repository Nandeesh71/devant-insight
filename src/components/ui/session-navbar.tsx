"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"
import {
  Blocks,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

const sidebarVariants = {
  open: {
    width: "20rem",
  },
  closed: {
    width: "3.05rem",
  },
};

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};


export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;
  const { user, signOut } = useAuth();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const handleThemeToggle = () => {
    const root = document.documentElement;
    root.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 z-40 h-full shrink-0 border-r border-[#302b59] overflow-hidden",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className={`relative z-40 flex h-full shrink-0 flex-col bg-[#1a1a2e] text-slate-200 transition-all overflow-hidden`}
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0  border-b p-2">
              <div className=" mt-[1.5px] flex w-full">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full" asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex w-fit items-center gap-2  px-2" 
                    >
                      <Avatar className='rounded size-4'>
                        <AvatarFallback>O</AvatarFallback>
                      </Avatar>
                      <motion.li
                        variants={variants}
                        className="flex w-fit items-center gap-2"
                      >
                        {!isCollapsed && (
                          <>
                            <p className="text-sm font-medium  ">
                              {"Organization"}
                            </p>
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
                          </>
                        )}
                      </motion.li>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      asChild
                      className="flex items-center gap-2"
                    >
                      <RouterLink to="/settings/members">
                        <UserCog className="h-4 w-4" /> Manage members
                      </RouterLink>
                    </DropdownMenuItem>{" "}
                    <DropdownMenuItem
                      asChild
                      className="flex items-center gap-2"
                    >
                      <RouterLink to="/settings/integrations">
                        <Blocks className="h-4 w-4" /> Integrations
                      </RouterLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <RouterLink
                        to="/select-org"
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create or join an organization
                      </RouterLink>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className=" flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    <RouterLink
                      to="/dashboard"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname === "/dashboard" ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Dashboard</p>
                        )}
                      </motion.li>
                    </RouterLink>
                    <RouterLink
                      to="/reports"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/reports") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <FileClock className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Reports</p>
                        )}
                      </motion.li>
                    </RouterLink>
                    <RouterLink
                      to="/chat"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/chat") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <MessagesSquare className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <div className="flex items-center gap-3">
                            <p className="text-[15px] font-medium">Chat</p>
                            <Badge className="flex h-fit w-fit items-center gap-1.5 rounded border-none bg-blue-50 px-1.5 text-blue-600" variant="outline">BETA</Badge>
                          </div>
                        )}
                      </motion.li>
                    </RouterLink>
                    <Separator className="w-full" />
                    <RouterLink
                      to="/deals"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/deals") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Layout className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Deals</p>
                        )}
                      </motion.li>
                    </RouterLink>
                    <RouterLink
                      to="/accounts"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/accounts") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <UserCircle className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Accounts</p>
                        )}
                      </motion.li>
                    </RouterLink>
                    <RouterLink
                      to="/competitors"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/competitors") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <UserSearch className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Competitors</p>
                        )}
                      </motion.li>
                    </RouterLink>
                    <Separator className="w-full" />
                    <RouterLink
                      to="/knowledge-base"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/knowledge-base") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <GraduationCap className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Knowledge Base</p>
                        )}
                      </motion.li>
                    </RouterLink>
                    <RouterLink
                      to="/feedback"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/feedback") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <MessageSquareText className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Feedback</p>
                        )}
                      </motion.li>
                    </RouterLink>
                    <RouterLink
                      to="/document-review"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                        pathname?.startsWith("/document-review") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <FileClock className="h-5 w-5" />
                      <motion.li variants={variants}>
                        {!isCollapsed && (
                          <p className="text-[15px] font-medium">Document Review</p>
                        )}
                      </motion.li>
                    </RouterLink>
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col gap-2 p-2">
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleThemeToggle}
                        className="flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                      >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </button>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{isDark ? 'Light theme' : 'Dark theme'}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
                <RouterLink
                  to="/settings"
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150",
                    pathname?.startsWith("/settings") ? "bg-[#7c3aed] text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Settings className="h-5 w-5 shrink-0" />
                  <motion.li variants={variants}>
                    {!isCollapsed && (
                      <p className="text-[15px] font-medium">Settings</p>
                    )}
                  </motion.li>
                </RouterLink>
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full">
                      <div className="flex h-8 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/10 hover:text-white">
                        <Avatar className="size-4">
                          <AvatarFallback>
                            {user?.name?.slice(0, 1).toUpperCase() || user?.email?.slice(0, 1).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <motion.li
                          variants={variants}
                          className="flex w-full items-center gap-2"
                        >
                          {!isCollapsed && (
                            <>
                              <p className="text-sm font-medium truncate">{user?.name || user?.email?.split('@')[0] || 'User'}</p>
                              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50" />
                            </>
                          )}
                        </motion.li>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent sideOffset={5}>
                      <div className="flex flex-row items-center gap-2 p-2">
                        <Avatar className="size-6">
                          <AvatarFallback>
                            {user?.name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium">
                            {user?.name || 'User'}
                          </span>
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {user?.email || 'No email'}
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem
                        asChild
                        className="flex items-center gap-2"
                      >
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
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}
