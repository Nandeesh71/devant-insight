import { Link } from "react-router-dom";
import { ArrowLeft, Badge as BadgeIcon } from "lucide-react";

type SectionPageProps = {
  title: string;
  description: string;
  badge?: string;
};

export default function SectionPage({ title, description, badge }: SectionPageProps) {
  return (
    <div className="min-h-screen bg-background ml-[3.05rem] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link
          to="/dashboard"
          className="inline-flex w-fit items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <BadgeIcon size={13} /> {badge || "Section"}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </section>
      </div>
    </div>
  );
}