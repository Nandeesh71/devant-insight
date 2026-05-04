import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <Link to="/login" className="font-semibold text-brand hover:underline">Back to Login</Link>
          <span className="text-muted-foreground">•</span>
          <Link to="/" className="font-semibold text-brand hover:underline">Go to Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 4, 2026</p>

        <section className="mt-6 space-y-4 text-sm leading-6 text-foreground">
          <p>
            DevANT collects account profile details and authorized repository metadata required to provide analytics and
            platform features.
          </p>
          <p>
            We process OAuth tokens and API responses strictly for authentication, sync, and rendering dashboard data.
            We do not sell personal data.
          </p>
          <p>
            You can disconnect repositories and revoke provider access at any time. If you close your account, we will
            delete or anonymize data according to operational and legal requirements.
          </p>
          <p>
            We apply reasonable security controls, but no online system can be guaranteed 100% secure.
          </p>
          <p>
            By using DevANT, you acknowledge this privacy policy and consent to data processing necessary to operate the
            product.
          </p>
        </section>

        <div className="mt-8 border-t border-border pt-4 text-sm text-muted-foreground">
          Read our <Link to="/terms" className="font-semibold text-brand hover:underline">Terms of Service</Link> for usage rules.
        </div>
      </div>
    </main>
  );
}
