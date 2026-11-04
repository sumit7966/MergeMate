import React from 'react';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = severity.toLowerCase();

  const styles: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    info: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  const dots: Record<string, string> = {
    critical: 'bg-red-400',
    high: 'bg-orange-400',
    medium: 'bg-amber-400',
    low: 'bg-blue-400',
    info: 'bg-slate-400',
  };

  const style = styles[sev] || styles.info;
  const dot = dots[sev] || dots.info;

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style} ${sizeClass} tracking-wide uppercase`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`} />
      {severity}
    </span>
  );
};
