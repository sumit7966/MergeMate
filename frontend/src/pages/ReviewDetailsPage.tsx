import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Terminal,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { Review, ReviewFinding, TestResult } from '@/types';
import { api } from '@/services/api';
import { VerdictBadge } from '@/components/VerdictBadge';
import { FindingCard } from '@/components/FindingCard';

export const ReviewDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [findings, setFindings] = useState<ReviewFinding[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReviewData = async () => {
      setLoading(true);
      try {
        const [rev, fList, tList] = await Promise.all([
          api.getReview(id),
          api.getReviewFindings(id),
          api.getReviewTests(id),
        ]);
        setReview(rev);
        setFindings(fList);
        setTests(tList);
      } catch (err) {
        console.error('Failed to load review details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviewData();
  }, [id]);

  if (loading || !review) {
    return <div className="p-12 text-center text-xs text-text-muted">Loading review details...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/workspace"
            className="p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Review Report</h1>
            <span className="text-xs font-mono text-text-muted">Commit: {review.commit_sha.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <VerdictBadge verdict={review.verdict} />
          {review.github_published && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Published to GitHub
            </span>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-secondary block mb-1">
            Executive Summary
          </span>
          <p className="text-sm text-text-primary leading-relaxed">{review.summary}</p>
        </div>

        {review.explanation && (
          <div className="pt-3 border-t border-border/50">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              Architectural Analysis
            </span>
            <p className="text-xs text-text-secondary leading-relaxed">{review.explanation}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <span className="text-text-muted block mb-1 text-[11px]">Total Findings</span>
            <span className="text-base font-bold text-white">{review.total_findings}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <span className="text-text-muted block mb-1 text-[11px]">Critical / High</span>
            <span className="text-base font-bold text-red-400">
              {review.critical_count + review.high_count}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <span className="text-text-muted block mb-1 text-[11px]">Confidence Score</span>
            <span className="text-base font-bold text-accent-secondary font-mono">
              {Math.round(review.confidence_score * 100)}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border">
            <span className="text-text-muted block mb-1 text-[11px]">Analysis Duration</span>
            <span className="text-base font-bold text-white font-mono">{review.analysis_duration_seconds}s</span>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Detailed Findings & Recommendations ({findings.length})
        </h2>

        <div className="space-y-3">
          {findings.map((f) => (
            <FindingCard key={f.id} finding={f} />
          ))}
        </div>
      </div>

      {/* Isolated Test Suites Output */}
      {tests.length > 0 && (
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent-secondary" /> Isolated Ephemeral Container Test Suite
          </h2>

          {tests.map((t) => (
            <div key={t.id} className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-text-muted">Container: {t.container_id}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    t.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {t.passed ? 'PASSED' : 'FAILED'} ({t.passed_tests}/{t.total_tests} passed in {t.duration_seconds}s)
                </span>
              </div>
              {t.raw_output && (
                <pre className="p-4 rounded-xl bg-[#07090E] border border-border font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {t.raw_output}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

