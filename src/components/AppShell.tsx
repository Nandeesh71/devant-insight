import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SessionNavBar } from "@/components/ui/session-navbar";
import { cn } from "@/lib/utils";

export default function AppShell() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      <SessionNavBar onExpandChange={setExpanded} />
      <div
        className={cn(
          "min-h-screen transition-[margin-left] duration-200 ease-out lg:ml-14",
          expanded && "lg:ml-[19.5rem]",
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}
