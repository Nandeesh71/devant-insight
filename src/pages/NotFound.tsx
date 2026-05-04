import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Activity, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 text-center shadow-lift">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-brand">
          <Activity size={32} />
        </div>
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <h2 className="mb-6 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mb-8 text-sm text-muted-foreground">
          The page you are looking for at <span className="font-mono text-brand">{location.pathname}</span> doesn't exist or has been moved.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border/50 bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-muted hover:shadow-sm"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <Link
            to="/"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-brand/90 hover:shadow-md"
          >
            <Home size={16} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
