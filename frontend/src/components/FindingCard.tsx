import React, { useState } from 'react';
import { ReviewFinding } from '@/types';
import { SeverityBadge } from './SeverityBadge';
import { ThumbsUp, ThumbsDown, EyeOff, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/services/api';

interface FindingCardProps {
  finding: ReviewFinding;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding, isSelected, onSelect }) => {
  const [expanded, setExpanded] = useState(isSelected);
  const [feedback, setFeedback] = useState<string | null>(
    finding.user_feedbacks && finding.user_feedbacks.length > 0
      ? finding.user_feedbacks[0].action
      : null
  );
  const [submitting, setSubmitting] = useState(false);

  const handleFeedback = async (action: 'useful' | 'incorrect' | 'ignored', e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmitting(true);
    try {
      await api.submitFindingFeedback(finding.id, action);
      setFeedback(action);
    } catch (err: any) {
      alert(`Feedback submission failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? 'bg-surface-elevated border-accent-primary shadow-glow'
          : 'bg-surface border-border hover:border-slate-700 hover:bg-surface-elevated/60'
      }`}
    >
      {/* Header */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={finding.severity} size="sm" />
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-text-muted border border-border">
              {finding.category.replace('_', ' ')}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-accent-secondary bg-accent-primary/10 border border-accent-primary/20 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {Math.round(finding.confidence * 100)}% Est. Confidence
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 rounded text-text-muted hover:text-text-primary transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-text-primary leading-snug tracking-tight">
          {finding.title}
        </h3>

        {/* File & Line Location */}
        <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <span className="text-slate-300">{finding.file_path}</span>
          {finding.line_start && (
            <span className="text-accent-secondary">:L{finding.line_start}</span>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400">via {finding.source_engine.toUpperCase()}</span>
        </div>
      </div>

      {/* Expanded Details Body */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 flex flex-col gap-3.5 text-xs">
          {/* Description */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
              Explanation
            </span>
            <p className="text-text-secondary leading-relaxed">{finding.description}</p>
          </div>

          {/* Why It Matters */}
          <div className="p-3 rounded-lg bg-surface-elevated/70 border border-border/70">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Why It Matters
            </span>
            <p className="text-text-secondary leading-relaxed">{finding.why_it_matters}</p>
          </div>

          {/* Code Evidence if present */}
          {finding.code_evidence && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1">
                Supporting Evidence
              </span>
              <pre className="p-2.5 rounded-lg bg-[#0B0F19] border border-border font-mono text-[11px] text-red-300 overflow-x-auto whitespace-pre-wrap">
                {finding.code_evidence}
              </pre>
            </div>
          )}

          {/* Suggested Fix */}
          {finding.suggested_fix && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Suggested Fix
              </span>
              <pre className="p-2.5 rounded-lg bg-[#0B0F19] border border-border font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                {finding.suggested_fix}
              </pre>
            </div>
          )}

          {/* Interactive Triage Buttons */}
          <div className="pt-2 flex items-center justify-between border-t border-border/40">
            <span className="text-[11px] text-text-muted">Reviewer Feedback:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => handleFeedback('useful', e)}
                disabled={submitting}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  feedback === 'useful'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary border-border'
                }`}
                title="Mark this finding as accurate and helpful"
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Useful</span>
              </button>

              <button
                onClick={(e) => handleFeedback('incorrect', e)}
                disabled={submitting}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  feedback === 'incorrect'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : 'bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary border-border'
                }`}
                title="Flag as false positive or incorrect"
              >
                <ThumbsDown className="w-3 h-3" />
                <span>False Positive</span>
              </button>

              <button
                onClick={(e) => handleFeedback('ignored', e)}
                disabled={submitting}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  feedback === 'ignored'
                    ? 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                    : 'bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary border-border'
                }`}
                title="Ignore this finding"
              >
                <EyeOff className="w-3 h-3" />
                <span>Ignore</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
