import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { DashboardOverview, RecentReviewItem } from '@/types';
import { api } from '@/services/api';
import { SeverityBadge } from '@/components/SeverityBadge';
import { VerdictBadge } from '@/components/VerdictBadge';

export const DashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, rr] = await Promise.all([
        api.getDashboardOverview(),
        api.getRecentReviews(),
      ]);
      setOverview(ov);
      setRecentReviews(rr);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm">
        <RefreshCw className="w-5 h-5 animate-spin mr-2 text-accent-primary" />
        <span>Loading MergeMate dashboard analytics...</span>
      </div>
    );
  }

  // Severity Pie Data
  const severityData = [
    { name: 'Critical', value: overview?.findings_by_severity.critical || 0, color: '#EF4444' },
    { name: 'High', value: overview?.findings_by_severity.high || 0, color: '#F97316' },
    { name: 'Medium', value: overview?.findings_by_severity.medium || 0, color: '#F59E0B' },
    { name: 'Low', value: overview?.findings_by_severity.low || 0, color: '#38BDF8' },
  ].filter((d) => d.value > 0);

  // Category Bar Data
  const categoryData = Object.entries(overview?.findings_by_category || {}).map(([key, val]) => ({
    category: key.replace('_', ' '),
    count: val,
  }));

  const totalFindings =
    (overview?.findings_by_severity.critical || 0) +
    (overview?.findings_by_severity.high || 0) +
    (overview?.findings_by_severity.medium || 0) +
    (overview?.findings_by_severity.low || 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-elevated via-surface to-background border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-tight">MergeMate Intelligence Center</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active Monitoring
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            Continuous AI code reviews, vulnerability scanning, and isolated test validation for your pull requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/workspace"
            className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-xs font-semibold shadow-glow flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Review Workspace</span>
          </Link>
          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-text-secondary hover:text-text-primary transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-surface border border-border hover:border-border/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-muted">Connected Repositories</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {overview?.connected_repositories_count || 0}
          </div>
          <span className="text-[11px] text-text-muted mt-1 block">Active GitHub App installations</span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border hover:border-border/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-muted">Pull Requests Reviewed</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <GitPullRequest className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {overview?.total_pull_requests_reviewed || 0}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> 100% automated coverage
          </span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border hover:border-border/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-muted">Active Review Jobs</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {overview?.open_review_jobs_count || 0}
          </div>
          <span className="text-[11px] text-text-muted mt-1 block">Queued in background queue</span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border hover:border-border/80 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-text-muted">Total Findings Identified</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {totalFindings}
          </div>
          <span className="text-[11px] text-red-400 font-medium mt-1 block">
            {overview?.findings_by_severity.critical || 0} Critical vulnerabilities
          </span>
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Donut */}
        <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight mb-1">Findings by Severity</h2>
            <p className="text-xs text-text-muted">Breakdown of defects by risk severity level.</p>
          </div>

          <div className="h-48 my-2">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151C2B', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No active findings recorded.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-text-secondary">Critical: {overview?.findings_by_severity.critical || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-text-secondary">High: {overview?.findings_by_severity.high || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-text-secondary">Medium: {overview?.findings_by_severity.medium || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-text-secondary">Low: {overview?.findings_by_severity.low || 0}</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown Bar Chart */}
        <div className="p-5 rounded-2xl bg-surface border border-border lg:col-span-2 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight mb-1">Issue Distribution by Category</h2>
            <p className="text-xs text-text-muted">Identified risks classified by engineering domain.</p>
          </div>

          <div className="h-56 mt-4">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748B" fontSize={11} />
                  <YAxis dataKey="category" type="category" stroke="#94A3B8" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151C2B', borderColor: '#1E293B', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-muted">
                No categories to display.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reviews Table */}
      <div className="p-6 rounded-2xl bg-surface border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Recent Automated Reviews</h2>
            <p className="text-xs text-text-muted">Pull requests processed through the multi-engine analysis pipeline.</p>
          </div>
          <Link
            to="/pull-requests"
            className="text-xs font-medium text-accent-secondary hover:underline flex items-center gap-1"
          >
            <span>View all PRs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated text-text-muted uppercase text-[10px] tracking-wider border-y border-border">
              <tr>
                <th className="py-3 px-4">Pull Request</th>
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Verdict</th>
                <th className="py-3 px-4">Findings</th>
                <th className="py-3 px-4">GitHub Sync</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {recentReviews.map((r) => (
                <tr key={r.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3 px-4">
                    <Link
                      to={`/workspace?prId=${r.pull_request_id}`}
                      className="font-semibold text-text-primary hover:text-accent-secondary transition-colors block"
                    >
                      #{r.pr_number} {r.pr_title}
                    </Link>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{r.repository_name}</td>
                  <td className="py-3 px-4 text-text-secondary">{r.author}</td>
                  <td className="py-3 px-4">
                    <VerdictBadge verdict={r.verdict} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-text-primary">{r.total_findings}</span>
                    {r.critical_count > 0 && (
                      <span className="ml-1.5 text-[10px] font-bold text-red-400">({r.critical_count} critical)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {r.github_published ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="text-[11px] text-text-muted">Draft</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/workspace?prId=${r.pull_request_id}`}
                      className="px-2.5 py-1 rounded bg-surface-elevated hover:bg-surface-hover text-accent-secondary border border-border text-[11px] font-medium transition-colors"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
              {recentReviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted text-xs">
                    No pull request reviews found. Click 'Simulate PR Review' above to generate one immediately.
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

