import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/* ─── Icon: DevANT Activity / Pulse ───────────────────────────── */
function ActivityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 22, height: 22 }}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

/* ─── Icon: Google ─────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, flexShrink: 0 }}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/* ─── Icon: GitHub ─────────────────────────────────────────────── */
function GithubIcon({ color = "currentColor" }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={color}
      style={{ width: 18, height: 18, flexShrink: 0 }}
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

/* ─── Spinner ──────────────────────────────────────────────────── */
function Spinner({ color = "currentColor" }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "devant-spin 0.6s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

/* ─── Shield / Lock icon (security) ──────────────────────────── */
function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 13, height: 13 }}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function Login() {
  const { user, signInGoogle, signInGithub, loading } = useAuth();
  const navigate = useNavigate();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const hasSignedIn = useRef(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [loading, user, navigate]);

  const handleGoogle = () => {
    if (hasSignedIn.current || loadingGoogle || loadingGithub) return;
    hasSignedIn.current = true;
    setLoadingGoogle(true);
    signInGoogle();
  };

  const handleGithub = () => {
    if (hasSignedIn.current || loadingGoogle || loadingGithub) return;
    hasSignedIn.current = true;
    setLoadingGithub(true);
    signInGithub();
  };

  // SILENT blank screen — matches app background, zero flash
  if (loading || user) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0d0d1a",
          zIndex: 9999,
        }}
      />
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes devant-spin { to { transform: rotate(360deg); } }

        @keyframes devant-fade-up {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes devant-pulse-ring {
          0%   { transform: scale(0.92); opacity: 0.5; }
          50%  { transform: scale(1.05); opacity: 0.12; }
          100% { transform: scale(0.92); opacity: 0.5; }
        }

        .devant-login-root {
          min-height: 100vh;
          background: #0d0d1a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .devant-card {
          display: flex;
          width: 100%;
          max-width: 860px;
          min-height: 540px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04);
          animation: devant-fade-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── LEFT PANEL ── */
        .devant-left {
          width: 44%;
          background: linear-gradient(148deg, #1a1535 0%, #0f0d24 60%, #12102a 100%);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .devant-left-ring-1 {
          position: absolute;
          top: -110px;
          right: -110px;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.14);
          pointer-events: none;
          animation: devant-pulse-ring 6s ease-in-out infinite;
        }

        .devant-left-ring-2 {
          position: absolute;
          bottom: -90px;
          left: -70px;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.07);
          pointer-events: none;
          animation: devant-pulse-ring 8s ease-in-out infinite 2s;
        }

        .devant-brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 1;
        }

        .devant-brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(124, 58, 237, 0.4);
        }

        .devant-brand-name {
          font-size: 19px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }

        .devant-brand-sub {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-top: 3px;
        }

        .devant-hero {
          position: relative;
          z-index: 1;
        }

        .devant-hero h2 {
          font-size: 29px;
          font-weight: 700;
          color: #fff;
          line-height: 1.25;
          margin-bottom: 14px;
          letter-spacing: -0.6px;
        }

        .devant-hero-accent {
          color: #a78bfa;
        }

        .devant-hero p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.7;
          max-width: 230px;
        }

        .devant-dots {
          display: flex;
          gap: 6px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .devant-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.16);
        }

        .devant-dot-active {
          width: 22px;
          border-radius: 3px;
          background: #7c3aed;
        }

        /* ── RIGHT PANEL ── */
        .devant-right {
          flex: 1;
          background: #ffffff;
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .devant-right-title {
          font-size: 26px;
          font-weight: 700;
          color: #0f0d1e;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .devant-right-sub {
          font-size: 13.5px;
          color: #6b7280;
          margin-bottom: 34px;
          line-height: 1.5;
        }

        .devant-oauth-row {
          display: flex;
          gap: 10px;
          margin-bottom: 28px;
        }

        .devant-oauth-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          height: 46px;
          border-radius: 11px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1.5px solid #e5e7eb;
          background: #ffffff;
          color: #111827;
          font-family: inherit;
          position: relative;
          overflow: hidden;
          text-decoration: none;
          -webkit-appearance: none;
          appearance: none;
        }

        .devant-oauth-btn:hover:not(:disabled) {
          border-color: #7c3aed;
          background: #faf5ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.12);
        }

        .devant-oauth-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }

        .devant-oauth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .devant-oauth-btn-github {
          background: #0f0d1e;
          border-color: #0f0d1e;
          color: #ffffff;
        }

        .devant-oauth-btn-github:hover:not(:disabled) {
          background: #1e1b3a;
          border-color: #7c3aed;
          box-shadow: 0 4px 18px rgba(124, 58, 237, 0.22);
        }

        .devant-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 0;
        }

        .devant-divider-line {
          flex: 1;
          border: none;
          border-top: 1px solid #f3f4f6;
        }

        .devant-divider-text {
          font-size: 11px;
          color: #d1d5db;
          white-space: nowrap;
          letter-spacing: 0.3px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .devant-footer {
          text-align: center;
        }

        .devant-powered {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11.5px;
          color: #9ca3af;
          margin-bottom: 10px;
        }

        .devant-tos {
          font-size: 11.5px;
          color: #9ca3af;
        }

        .devant-tos a {
          color: #7c3aed;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .devant-tos a:hover {
          color: #6d28d9;
          text-decoration: underline;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .devant-card {
            flex-direction: column;
            max-width: 420px;
            min-height: unset;
          }
          .devant-left {
            width: 100%;
            padding: 32px 28px;
            min-height: 200px;
          }
          .devant-hero h2 { font-size: 22px; }
          .devant-dots { display: none; }
          .devant-right { padding: 32px 28px; }
          .devant-oauth-row { flex-direction: column; }
        }
      `}</style>

      <div className="devant-login-root">
        <div className="devant-card">

          {/* ── LEFT PANEL ── */}
          <div className="devant-left">
            <div className="devant-left-ring-1" aria-hidden="true" />
            <div className="devant-left-ring-2" aria-hidden="true" />

            <div className="devant-brand-row">
              <div className="devant-brand-icon">
                <ActivityIcon />
              </div>
              <div>
                <div className="devant-brand-name">DevANT</div>
                <div className="devant-brand-sub">Developer Activity Narrative Tracker</div>
              </div>
            </div>

            <div className="devant-hero">
              <h2>
                Track your real<br />
                <span className="devant-hero-accent">GitHub activity</span><br />
                in one place.
              </h2>
              <p>
                Connect your repositories and get meaningful insights on every commit, PR, and contributor.
              </p>
            </div>

            <div className="devant-dots" aria-hidden="true">
              <div className="devant-dot devant-dot-active" />
              <div className="devant-dot" />
              <div className="devant-dot" />
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="devant-right">
            <div>
              <h1 className="devant-right-title">Welcome back</h1>
              <p className="devant-right-sub">Sign in to track your real GitHub activity.</p>

              <div className="devant-oauth-row">
                {/* Google */}
                <button
                  className="devant-oauth-btn"
                  onClick={handleGoogle}
                  disabled={loadingGoogle || loadingGithub}
                  aria-label="Continue with Google"
                >
                  {loadingGoogle ? (
                    <Spinner color="#6b7280" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                {/* GitHub */}
                <button
                  className="devant-oauth-btn devant-oauth-btn-github"
                  onClick={handleGithub}
                  disabled={loadingGoogle || loadingGithub}
                  aria-label="Continue with GitHub"
                >
                  {loadingGithub ? (
                    <Spinner color="rgba(255,255,255,0.7)" />
                  ) : (
                    <GithubIcon color="#ffffff" />
                  )}
                  Continue with GitHub
                </button>
              </div>

              <div className="devant-divider">
                <hr className="devant-divider-line" />
                <span className="devant-divider-text">
                  <ShieldIcon />
                  secured by OAuth 2.0
                </span>
                <hr className="devant-divider-line" />
              </div>
            </div>

            <div className="devant-footer">
              <div className="devant-powered">
                <ActivityIcon />
                Powered by Perceptronix
              </div>
              <div className="devant-tos">
                <a href="/Terms-of-Service">Terms</a>
                &nbsp;{"\u00b7"}&nbsp;
                <a href="/Privacy-Policy">Privacy</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
