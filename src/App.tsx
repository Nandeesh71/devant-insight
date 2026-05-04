import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import ProjectDetail from "./pages/ProjectDetail.tsx";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound.tsx";
import { ProjectProvider } from "./context/ProjectContext";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ConnectGithub from "./pages/ConnectGithub";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

const queryClient = new QueryClient();

const LegacyOwnerRouteRedirect = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  if (!owner || !repo) return <Navigate to="/" replace />;
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
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/Terms-of-Service" element={<Terms />} />
            <Route path="/Privacy-Policy" element={<Privacy />} />
            <Route path="/terms" element={<Navigate to="/Terms-of-Service" replace />} />
            <Route path="/privacy" element={<Navigate to="/Privacy-Policy" replace />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/connect-github" element={<ProtectedRoute><ConnectGithub /></ProtectedRoute>} />
            <Route path="/owner/:owner/:repo" element={<LegacyOwnerRouteRedirect />} />
            <Route path="/:owner/:repo" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ProjectProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
