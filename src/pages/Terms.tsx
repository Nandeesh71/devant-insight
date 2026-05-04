import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Link to="/login" className="font-semibold text-brand hover:underline">Back to Login</Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/" className="font-semibold text-brand hover:underline">Go to Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 4, 2026</p>

        <section className="mt-6 space-y-4 text-sm leading-6 text-foreground">
          <p>
            By using DevANT, you agree to these Terms of Service. These terms govern your access to and use of the
            platform, including repository linking, analytics, dashboards, and integrations.
          </p>
          <p>
            You are responsible for all activity under your account and for ensuring you have permission to connect any
            GitHub repositories, data sources, or third-party services.
          </p>
          <p>
            DevANT is provided on an "as is" basis. We may update, suspend, or discontinue features at any time.
            Continued use after updates constitutes acceptance of the revised terms.
          </p>
          <p>
            You must not use the platform for unlawful activity, abuse, scraping in violation of provider terms, or any
            behavior that disrupts service for others.
          </p>
          <p>
            If you do not agree with these terms, you should stop using the platform and disconnect your integrations.
          </p>
        </section>

        <div className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">
          Questions? Review our <Link to="/Privacy-Policy" className="font-semibold text-brand hover:underline">Privacy Policy</Link>.
        </div>
      </div>
    </main>
  );
}
