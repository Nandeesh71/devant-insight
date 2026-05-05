import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import NotFound from "./pages/NotFound.tsx";
import { ProjectProvider } from "./context/ProjectContext";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ConnectGithub from "./pages/ConnectGithub";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import SectionPage from "./pages/SectionPage";

const queryClient = new QueryClient();

const LegacyOwnerRouteRedirect = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  if (!owner || !repo) return <Navigate to="/dashboard" replace />;
  return <Navigate to={`/${owner}/${repo}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ProjectProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/Terms-of-Service" element={<Terms />} />
            <Route path="/Privacy-Policy" element={<Privacy />} />
            <Route path="/terms" element={<Navigate to="/Terms-of-Service" replace />} />
            <Route path="/privacy" element={<Navigate to="/Privacy-Policy" replace />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/reports" element={<SectionPage title="Reports" description="Reports and delivery summaries live here." />} />
              <Route path="/chat" element={<SectionPage title="Chat" description="Chat workspace is coming soon." badge="BETA" />} />
              <Route path="/deals" element={<SectionPage title="Deals" description="Deal tracking and pipeline insights live here." />} />
              <Route path="/accounts" element={<SectionPage title="Accounts" description="Account management and relationship views live here." />} />
              <Route path="/competitors" element={<SectionPage title="Competitors" description="Competitor tracking and comparisons live here." />} />
              <Route path="/knowledge-base" element={<SectionPage title="Knowledge Base" description="Docs, notes, and internal knowledge live here." />} />
              <Route path="/feedback" element={<SectionPage title="Feedback" description="Feedback intake and review live here." />} />
              <Route path="/document-review" element={<SectionPage title="Document Review" description="Review documents and generated summaries here." />} />
              <Route path="/connect-github" element={<ConnectGithub />} />
              <Route path="/settings/*" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/owner/:owner/:repo" element={<LegacyOwnerRouteRedirect />} />
              <Route path="/:owner/:repo" element={<ProjectDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ProjectProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
