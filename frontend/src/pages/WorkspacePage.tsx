import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  GitPullRequest,
  CheckCircle2,
  RefreshCw,
  Send,
  FileCode,
  ShieldAlert,
  ChevronRight,
  Filter,
  Check,
  Terminal,
} from 'lucide-react';
import { PullRequest, Review, ReviewFinding, TestResult } from '@/types';
import { api } from '@/services/api';
import { DiffViewer } from '@/components/DiffViewer';
import { FindingCard } from '@/components/FindingCard';
import { VerdictBadge } from '@/components/VerdictBadge';

export const WorkspacePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const prIdParam = searchParams.get('prId');

  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPr, setSelectedPr] = useState<PullRequest | null>(null);
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [review, setReview] = useState<Review | null>(null);
  const [findings, setFindings] = useState<ReviewFinding[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [activeRightTab, setActiveRightTab] = useState<'findings' | 'summary' | 'tests'>('findings');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load all PRs
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const prs = await api.getPullRequests();
        setPullRequests(prs);

        let targetPr = prs.find((p) => p.id === prIdParam) || prs[0];
        if (targetPr) {
          const detail = await api.getPullRequest(targetPr.id);
          setSelectedPr(detail);
          setSearchParams({ prId: detail.id });

          // Fetch latest review for this PR
          const revs = await api.getReviews(detail.id);
          if (revs && revs.length > 0) {
            const latestRev = revs[0];
            setReview(latestRev);
            const [fList, tList] = await Promise.all([
              api.getReviewFindings(latestRev.id),
              api.getReviewTests(latestRev.id),
            ]);
            setFindings(fList);
            setTestResults(tList);
            if (fList.length > 0) {
              setSelectedFindingId(fList[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error loading workspace:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [prIdParam]);

  const handleSelectPr = async (pr: PullRequest) => {
    setLoading(true);
    try {
      const detail = await api.getPullRequest(pr.id);
      setSelectedPr(detail);
      setSelectedFileIdx(0);
      setSearchParams({ prId: detail.id });

      const revs = await api.getReviews(detail.id);
      if (revs && revs.length > 0) {
        const latestRev = revs[0];
        setReview(latestRev);
        const [fList, tList] = await Promise.all([
          api.getReviewFindings(latestRev.id),
          api.getReviewTests(latestRev.id),
        ]);
        setFindings(fList);
        setTestResults(tList);
        setSelectedFindingId(fList.length > 0 ? fList[0].id : undefined);
      } else {
        setReview(null);
        setFindings([]);
        setTestResults([]);
        setSelectedFindingId(undefined);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRerunReview = async () => {
    if (!selectedPr) return;
    setActionLoading(true);
    try {
      await api.rerunPullRequestReview(selectedPr.id);
      setToastMessage('Review rerun started! Re-analyzing diff...');
      setTimeout(() => setToastMessage(null), 3000);
      // reload
      await handleSelectPr(selectedPr);
    } catch (err: any) {
      alert(`Rerun failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!review) return;
    setActionLoading(true);
    try {
      const res = await api.publishReview(review.id);
      setToastMessage('Review successfully published to GitHub with inline comments!');
      setTimeout(() => setToastMessage(null), 4000);
      setReview({ ...review, github_published: true, github_review_id: res.github_review_id });
    } catch (err: any) {
      alert(`Publish failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity.toLowerCase() === severityFilter.toLowerCase();
  });

  const currentFile = selectedPr?.files?.[selectedFileIdx];

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] -m-6 overflow-hidden bg-background">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-primary/20 border border-accent-primary text-accent-secondary text-xs font-semibold shadow-glow">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Workspace Navigation */}
      <div className="h-14 px-6 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* PR Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedPr?.id || ''}
              onChange={(e) => {
                const target = pullRequests.find((p) => p.id === e.target.value);
                if (target) handleSelectPr(target);
              }}
              className="h-8 px-3 pr-8 rounded-lg bg-surface-elevated border border-border text-xs font-semibold text-text-primary focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
            >
              {pullRequests.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  #{pr.pr_number} {pr.title.slice(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-border" />

          {selectedPr && (
            <div className="flex items-center gap-2 text-xs overflow-hidden">
              <span className="font-semibold text-text-primary truncate">{selectedPr.title}</span>
              <span className="text-text-muted font-mono">
                ({selectedPr.source_branch} → {selectedPr.target_branch})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-border">
                {selectedPr.head_sha.slice(0, 7)}
              </span>
            </div>
          )}
        </div>

        {/* Right Workspace Actions */}
        <div className="flex items-center gap-2.5">
          {review && <VerdictBadge verdict={review.verdict} />}

          <button
            onClick={handleRerunReview}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
            <span>Rerun Review</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={actionLoading || review?.github_published}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              review?.github_published
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-accent-primary hover:bg-accent-hover text-white shadow-glow'
            }`}
          >
            {review?.github_published ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Published to GitHub</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Publish Review</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3-Panel Split Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Changed Files Tree (20% width) */}
        <div className="w-64 border-r border-border bg-surface/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" /> Changed Files ({selectedPr?.files?.length || 0})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {selectedPr?.files?.map((f, idx) => {
              const fileFindingsCount = findings.filter((find) => find.file_path === f.filename).length;
              const isSelected = selectedFileIdx === idx;
              return (
                <button
                  key={f.filename}
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex flex-col gap-1 transition-colors ${
                    isSelected
                      ? 'bg-surface-elevated text-accent-secondary border border-accent-primary/30 font-medium'
                      : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate font-mono text-[11px]">{f.filename.split('/').pop()}</span>
                    {fileFindingsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        {fileFindingsCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span className="text-emerald-400">+{f.additions}</span>
                    <span className="text-red-400">-{f.deletions}</span>
                    <span className="truncate">{f.filename}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Panel: Code Diff Viewer (50% width) */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#090B12]">
          {currentFile ? (
            <DiffViewer
              filename={currentFile.filename}
              patch={currentFile.patch || ''}
              findings={findings}
              selectedFindingId={selectedFindingId}
              onSelectFinding={(id) => {
                setSelectedFindingId(id);
                setActiveRightTab('findings');
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-muted text-xs">
              <p>No changed files found in this pull request.</p>
            </div>
          )}
        </div>

        {/* Right Panel: AI Review Findings & Inspector (30% width) */}
        <div className="w-96 border-l border-border bg-surface flex flex-col shrink-0">
          {/* Tabs */}
          <div className="flex items-center border-b border-border bg-surface-elevated/40 px-2 pt-2 gap-1 text-xs font-semibold">
            <button
              onClick={() => setActiveRightTab('findings')}
              className={`flex-1 py-2 rounded-t-lg transition-colors border-b-2 ${
                activeRightTab === 'findings'
                  ? 'border-accent-primary text-accent-secondary bg-surface'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Findings ({findings.length})
            </button>
            <button
              onClick={() => setActiveRightTab('summary')}
              className={`flex-1 py-2 rounded-t-lg transition-colors border-b-2 ${
                activeRightTab === 'summary'
                  ? 'border-accent-primary text-accent-secondary bg-surface'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveRightTab('tests')}
              className={`flex-1 py-2 rounded-t-lg transition-colors border-b-2 ${
                activeRightTab === 'tests'
                  ? 'border-accent-primary text-accent-secondary bg-surface'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              Tests ({testResults.length})
            </button>
          </div>

          {/* Tab 1: Findings Inspector */}
          {activeRightTab === 'findings' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Severity Filter Pills */}
              <div className="p-3 border-b border-border/60 flex items-center gap-1.5 overflow-x-auto text-xs">
                {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded-full capitalize text-[11px] font-medium transition-colors ${
                      severityFilter === sev
                        ? 'bg-accent-primary text-white shadow-glow'
                        : 'bg-surface-elevated text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              {/* Finding Cards List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {filteredFindings.map((f) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    isSelected={f.id === selectedFindingId}
                    onSelect={() => setSelectedFindingId(f.id)}
                  />
                ))}
                {filteredFindings.length === 0 && (
                  <div className="text-center py-12 text-xs text-text-muted">
                    No findings matching this filter.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Review Summary */}
          {activeRightTab === 'summary' && review && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-secondary block mb-1">
                  Executive Review Summary
                </span>
                <p className="text-text-primary leading-relaxed">{review.summary}</p>
              </div>

              {review.explanation && (
                <div className="p-3.5 rounded-xl bg-surface-elevated border border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                    Architectural Impact
                  </span>
                  <p className="text-text-secondary leading-relaxed">{review.explanation}</p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                  Executed Engines & Static Tools
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {review.tools_executed?.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-background border border-border font-mono text-[10px] text-accent-secondary"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Analysis Duration:</span>
                  <span className="text-text-primary">{review.analysis_duration_seconds}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Confidence Score:</span>
                  <span className="text-text-primary">{Math.round(review.confidence_score * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">GitHub Sync Status:</span>
                  <span className={review.github_published ? 'text-emerald-400' : 'text-amber-400'}>
                    {review.github_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Isolated Tests Log */}
          {activeRightTab === 'tests' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {testResults.map((t) => (
                <div key={t.id} className="space-y-3">
                  <div className="p-3 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-text-primary block">Ephemeral Container Suite</span>
                      <span className="text-[10px] font-mono text-text-muted">ID: {t.container_id}</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        t.passed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-surface-elevated border border-border">
                      <span className="text-xs font-bold text-text-primary block">{t.total_tests}</span>
                      <span className="text-[10px] text-text-muted">Total</span>
                    </div>
                    <div className="p-2 rounded bg-surface-elevated border border-border">
                      <span className="text-xs font-bold text-emerald-400 block">{t.passed_tests}</span>
                      <span className="text-[10px] text-text-muted">Passed</span>
                    </div>
                    <div className="p-2 rounded bg-surface-elevated border border-border">
                      <span className="text-xs font-bold text-red-400 block">{t.failed_tests}</span>
                      <span className="text-[10px] text-text-muted">Failed</span>
                    </div>
                  </div>

                  {t.raw_output && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                        Isolated Sandbox Raw Terminal Output
                      </span>
                      <pre className="p-3 rounded-xl bg-[#07090E] border border-border font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-64">
                        {t.raw_output}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
              {testResults.length === 0 && (
                <div className="text-center py-12 text-xs text-text-muted">
                  No automated test runs recorded for this review.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
