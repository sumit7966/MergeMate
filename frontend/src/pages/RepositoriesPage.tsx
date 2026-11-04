import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  GitBranch,
  Shield,
  Settings,
  ExternalLink,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Repository } from '@/types';
import { api } from '@/services/api';

export const RepositoriesPage: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchRepos = async () => {
      setLoading(true);
      try {
        const data = await api.getRepositories();
        setRepositories(data);
      } catch (err) {
        console.error('Failed to load repositories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  const filtered = repositories.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Connected Repositories</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage GitHub App installations, automated review policies, and security guardrails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter repositories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 h-9 pl-9 pr-3 rounded-lg bg-surface border border-border text-xs text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          <a
            href="https://github.com/apps/mergemate-ai/installations/new"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </a>
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((repo) => (
          <div
            key={repo.id}
            className="p-5 rounded-2xl bg-surface border border-border hover:border-slate-700 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-surface-elevated border border-border text-accent-secondary">
                    <FolderGit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-text-primary group-hover:text-accent-secondary transition-colors">
                      {repo.name}
                    </h2>
                    <span className="text-[10px] font-mono text-text-muted">{repo.full_name}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    repo.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}
                >
                  {repo.is_active ? 'Active' : 'Paused'}
                </span>
              </div>

              <p className="text-xs text-text-secondary line-clamp-2 mt-2 leading-relaxed">
                {repo.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-border/50 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <GitBranch className="w-3.5 h-3.5 text-accent-primary" />
                  <span>{repo.default_branch}</span>
                </div>
                {repo.language && (
                  <span className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-[10px] font-medium text-slate-300">
                    {repo.language}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  to={`/workspace?repoId=${repo.id}`}
                  className="flex-1 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-center text-xs font-medium text-accent-secondary border border-border transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Reviews</span>
                </Link>
                <Link
                  to={`/repositories/${repo.id}/settings`}
                  className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border transition-colors"
                  title="Repository Settings"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="p-12 text-center rounded-2xl bg-surface border border-border">
          <FolderGit2 className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-text-primary mb-1">No repositories connected</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
            Install the MergeMate GitHub App on your GitHub account or organization to begin automated reviews.
          </p>
        </div>
      )}
    </div>
  );
};
