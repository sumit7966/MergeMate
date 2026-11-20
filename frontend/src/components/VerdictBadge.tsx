import React from 'react';
import { CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: string;
}

export const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict }) => {
  switch (verdict) {
    case 'APPROVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    case 'REQUEST_CHANGES':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          Changes Requested
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <MessageSquare className="w-3.5 h-3.5" />
          Review Comment
        </span>
      );
  }
};

