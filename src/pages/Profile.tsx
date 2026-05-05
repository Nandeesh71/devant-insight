import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 ml-[3.05rem]">
      <div className="mx-auto w-full max-w-3xl">
        <button
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Signed in account and profile details.</p>

        <section className="mt-6 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="h-16 w-16 border border-border/60">
              <AvatarImage src={user?.avatar_url || ""} alt="User avatar" />
              <AvatarFallback className="bg-accent text-base font-bold text-brand">
                {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold text-foreground">{user?.name || "Unknown user"}</div>
              <div className="text-sm text-muted-foreground">{user?.email || "No email"}</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={13} /> Email
              </div>
              <div className="text-sm font-medium text-foreground">{user?.email || "—"}</div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Shield size={13} /> Sign-in Provider
              </div>
              <div className="text-sm font-medium capitalize text-foreground">{user?.provider || "—"}</div>
            </div>
            <div className="rounded-md border border-border p-3 sm:col-span-2">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <User size={13} /> GitHub Profile
              </div>
              <div className="text-sm font-medium text-foreground">
                {user?.github_connected ? user.github_login || "Connected" : "Not connected"}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/settings")}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
          >
            Go to Settings
          </button>
        </section>
      </div>
    </div>
  );
}
