import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { LoadingSpinner } from "@/components/StatusBanners";

export default function CommitDetail() {
  const { owner, repo, sha } = useParams<{ owner: string; repo: string; sha: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commit, setCommit] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!owner || !repo || !sha) throw new Error('Missing params');
        // first get project id from summary endpoint
        const summary = await apiClient.get<any>(`/api/projects/${owner}/${repo}/summary`);
        const projectId = summary?.project?.id;
        if (!projectId) throw new Error('Project not found');
        const data = await apiClient.get<any>(`/api/commits/${projectId}/${sha}`);
        if (!cancelled) setCommit(data);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [owner, repo, sha]);

  if (loading) return <div className="min-h-screen"><LoadingSpinner visible={true} /></div>;
  if (error) return (
    <div className="p-6">
      <button className="mb-4" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Back</button>
      <div className="text-sm text-red-600">{error}</div>
    </div>
  );

  if (!commit) return (
    <div className="p-6">
      <button className="mb-4" onClick={() => navigate(-1)}><ArrowLeft size={14} /> Back</button>
      <div>No commit found.</div>
    </div>
  );

  const files = commit.files_changed || commit.files || [];


  return (
    <div className="min-h-screen bg-background p-6 ml-[3.05rem]">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm"> <ArrowLeft size={14} /> Back</button>
        <h2 className="text-lg font-semibold">Commit {String(commit.sha).slice(0,7)}</h2>
        {commit.url && (
          <a href={String(commit.url)} target="_blank" rel="noreferrer" className="ml-3 inline-flex items-center gap-1 text-sm text-brand"><ExternalLink size={14} /> Open on GitHub</a>
        )}
      </div>

      <div className="rounded-lg border border-border/50 bg-card p-4">
        <h3 className="font-semibold text-foreground">{commit.message || 'Untitled commit'}</h3>
        <div className="mt-2 text-sm text-muted-foreground">Author: {commit.author || commit.author_github_username || 'Unknown'} • {commit.timestamp || commit.date || '—'}</div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">Lines added</div>
            <div className="text-2xl font-bold text-foreground">{commit.lines_added ?? 0}</div>
          </div>
          <div className="rounded-lg border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">Lines removed</div>
            <div className="text-2xl font-bold text-foreground">{commit.lines_removed ?? 0}</div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold text-sm">Files changed</h4>
          {Array.isArray(files) && files.length > 0 ? (
            <div className="mt-2 space-y-4 text-sm">
              {files.map((f: any, i: number) => (
                <div key={i} className="rounded-md border border-border/50 p-3 bg-muted/20">
                  <div className="mb-2 font-medium">{typeof f === 'string' ? f : (f.filename || f.path || JSON.stringify(f))}</div>
                  {f.patch ? (
                    <pre className="max-h-[360px] overflow-auto rounded bg-black/5 p-3 text-xs font-mono whitespace-pre-wrap">{f.patch}</pre>
                  ) : (
                    <div className="text-xs text-muted-foreground">No patch available for this file</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">No file list available</div>
          )}
        </div>

        {commit.ai_summary && (
          <div className="mt-4">
            <h4 className="font-semibold text-sm">AI Summary</h4>
            <div className="mt-2 text-sm text-muted-foreground">{commit.ai_summary}</div>
          </div>
        )}
      </div>
    </div>
  );
}
