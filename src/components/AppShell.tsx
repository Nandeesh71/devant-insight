import { SessionNavBar } from "@/components/ui/session-navbar";
import { Outlet } from "react-router-dom";

export default function AppShell() {
  return (
    <div className="min-h-screen w-full bg-background">
      <SessionNavBar />
      <div className="min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
