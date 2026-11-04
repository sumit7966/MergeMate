import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitPullRequest,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  GitCommit,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';
import { PullRequest, Repository } from '@/types';
import { api } from '@/services/api';
import { VerdictBadge } from '@/components/VerdictBadge';

export const PullRequestsPage: React.FC = () => {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prs, repos] = await Promise.all([
        api.getPullRequests({
          state: selectedState !== 'all' ? selectedState : undefined,
          repository_id: selectedRepo || undefined,
          search: search || undefined,
        }),
        api.getRepositories(),
      ]);
      setPullRequests(prs);
      setRepositories(repos);
    } catch (err) {
      console.error('Failed to load PRs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedState, selectedRepo, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Pull Request Explorer</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Monitor, inspect, and trigger multi-engine automated reviews for repository pull requests.
          </p>
        </div>

        <Link
          to="/workspace"
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch AI Workspace</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-surface border border-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 h-9 pl-9 pr-3 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          {/* Repo selector */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary focus:outline-none focus:border-accent-primary"
          >
            <option value="">All Repositories</option>
            {repositories.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* State filters */}
        <div className="flex items-center gap-1 bg-surface-elevated p-1 rounded-lg border border-border text-xs">
          {['all', 'open', 'closed', 'merged'].map((state) => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`px-3 py-1 rounded capitalize font-medium transition-colors ${
                selectedState === state
                  ? 'bg-accent-primary text-white shadow-glow'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* PR Table List */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-text-muted uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-5">Pull Request</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Branches</th>
                <th className="py-3 px-4">Diff Changes</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {pullRequests.map((pr) => (
                <tr key={pr.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent-primary/10 text-accent-secondary mt-0.5 shrink-0">
                        <GitPullRequest className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          to={`/workspace?prId=${pr.id}`}
                          className="font-semibold text-text-primary hover:text-accent-secondary transition-colors text-sm leading-snug block"
                        >
                          #{pr.pr_number} {pr.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted font-mono">
                          <span className="flex items-center gap-1">
                            <GitCommit className="w-3 h-3 text-accent-primary" />
                            {pr.head_sha.slice(0, 7)}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{pr.state}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center font-semibold text-[10px] text-accent-secondary overflow-hidden">
                        {pr.author_avatar_url ? (
                          <img src={pr.author_avatar_url} alt={pr.author_username} className="w-full h-full object-cover" />
                        ) : (
                          pr.author_username.charAt(0)
                        )}
                      </div>
                      <span className="text-text-secondary font-medium">{pr.author_username}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-mono text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-slate-200">
                        {pr.source_branch}
                      </span>
                      <span className="text-text-muted">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-elevated border border-border text-slate-400">
                        {pr.target_branch}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 px-4 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">+{pr.additions}</span>{' '}
                    <span className="text-red-400 font-bold">-{pr.deletions}</span>
                  </td>

                  <td className="py-4 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {pr.latest_review_status || 'READY'}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    {pr.latest_review_verdict ? (
                      <VerdictBadge verdict={pr.latest_review_verdict} />
                    ) : (
                      <span className="text-text-muted text-[11px]">Pending Review</span>
                    )}
                  </td>

                  <td className="py-4 px-4 text-right">
                    <Link
                      to={`/workspace?prId=${pr.id}`}
                      className="px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-accent-secondary border border-border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </Link>
                  </td>
                </tr>
              ))}

              {pullRequests.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-text-muted text-xs">
                    No pull requests match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
