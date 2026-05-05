import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info("Page not found — redirecting to dashboard.", {
      style: {
        background: '#1e1b3a',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        color: '#c4b5fd',
      },
    });
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  return null;
};

export default NotFound;
