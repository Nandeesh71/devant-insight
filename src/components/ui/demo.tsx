"use client";

import { SessionNavBar } from "@/components/ui/session-navbar";

export function SidebarDemo() {
  return (
    <div className="flex h-screen w-screen flex-row">
      <SessionNavBar />
      <main className="ml-[3.05rem] flex h-screen grow flex-col overflow-auto" />
    </div>
  );
}
