import React from 'react';
import { ReviewFinding } from '@/types';
import { AlertCircle, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface DiffViewerProps {
  patch: string;
  filename: string;
  findings: ReviewFinding[];
  selectedFindingId?: string;
  onSelectFinding?: (findingId: string) => void;
}

interface ParsedLine {
  type: 'hunk' | 'add' | 'delete' | 'context';
  content: string;
  oldNum?: number;
  newNum?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  patch,
  filename,
  findings,
  selectedFindingId,
  onSelectFinding,
}) => {
  if (!patch) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-text-muted">
        <p className="text-sm">No unified diff available for this file.</p>
      </div>
    );
  }

  // Parse unified diff into lines
  const lines: ParsedLine[] = [];
  let oldNum = 0;
  let newNum = 0;

  patch.split('\n').forEach((line) => {
    if (line.startsWith('@@')) {
      const match = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldNum = parseInt(match[1], 10);
        newNum = parseInt(match[2], 10);
      }
      lines.push({ type: 'hunk', content: line });
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      lines.push({ type: 'add', content: line.slice(1), newNum: newNum++ });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      lines.push({ type: 'delete', content: line.slice(1), oldNum: oldNum++ });
    } else {
      const content = line.startsWith(' ') ? line.slice(1) : line;
      lines.push({ type: 'context', content, oldNum: oldNum++, newNum: newNum++ });
    }
  });

  // Map findings by line_start for this file
  const findingsByLine = new Map<number, ReviewFinding[]>();
  findings
    .filter((f) => f.file_path === filename && f.line_start != null)
    .forEach((f) => {
      const list = findingsByLine.get(f.line_start!) || [];
      list.push(f);
      findingsByLine.set(f.line_start!, list);
    });

  const getSeverityIcon = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
      case 'high':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
      case 'medium':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="w-full bg-[#0B0F19] border border-border rounded-xl overflow-hidden font-mono text-xs">
      {/* File Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-elevated/70 border-b border-border">
        <span className="font-semibold text-text-primary tracking-wide">{filename}</span>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span className="text-emerald-400">+{lines.filter((l) => l.type === 'add').length}</span>
          <span className="text-red-400">-{lines.filter((l) => l.type === 'delete').length}</span>
        </div>
      </div>

      {/* Code Table */}
      <div className="overflow-x-auto divide-y divide-border/20">
        {lines.map((l, idx) => {
          const lineFindings = l.newNum ? findingsByLine.get(l.newNum) : undefined;
          const hasSelected = lineFindings?.some((f) => f.id === selectedFindingId);

          let rowBg = 'hover:bg-surface-elevated/50';
          let sign = ' ';
          let signColor = 'text-transparent';

          if (l.type === 'hunk') {
            rowBg = 'bg-accent-primary/10 text-accent-secondary border-y border-accent-primary/20 font-bold';
          } else if (l.type === 'add') {
            rowBg = hasSelected ? 'bg-amber-500/15' : 'bg-emerald-500/10 text-emerald-100';
            sign = '+';
            signColor = 'text-emerald-400 font-bold';
          } else if (l.type === 'delete') {
            rowBg = 'bg-red-500/10 text-red-200/70';
            sign = '-';
            signColor = 'text-red-400 font-bold';
          }

          return (
            <React.Fragment key={idx}>
              <div className={`flex items-start transition-colors ${rowBg}`}>
                {/* Line numbers */}
                <div className="w-12 py-1 px-2 text-right select-none text-text-muted/60 text-[11px] shrink-0 border-r border-border/30">
                  {l.oldNum ?? ''}
                </div>
                <div className="w-12 py-1 px-2 text-right select-none text-text-muted/60 text-[11px] shrink-0 border-r border-border/30">
                  {l.newNum ?? ''}
                </div>

                {/* Sign (+ / -) */}
                <div className={`w-6 py-1 text-center select-none shrink-0 ${signColor}`}>
                  {sign}
                </div>

                {/* Code Content */}
                <div className="flex-1 py-1 px-3 whitespace-pre overflow-x-visible text-text-primary">
                  {l.content || ' '}
                </div>

                {/* Inline finding trigger badge if attached to this line */}
                {lineFindings && lineFindings.length > 0 && (
                  <div className="px-2 py-1 shrink-0 flex items-center gap-1.5">
                    {lineFindings.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onSelectFinding?.(f.id)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold border transition-all ${
                          f.id === selectedFindingId
                            ? 'bg-accent-primary text-white border-accent-primary shadow-glow scale-105'
                            : 'bg-surface-elevated hover:bg-surface-hover text-text-primary border-border'
                        }`}
                        title={f.title}
                      >
                        {getSeverityIcon(f.severity)}
                        <span className="capitalize">{f.severity}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded Inline Finding Box if selected */}
              {lineFindings &&
                lineFindings
                  .filter((f) => f.id === selectedFindingId)
                  .map((f) => (
                    <div
                      key={`inline-${f.id}`}
                      className="px-6 py-3 bg-surface-elevated border-y border-accent-primary/40 text-text-primary font-sans text-xs flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(f.severity)}
                        <span className="font-semibold text-text-primary text-sm">{f.title}</span>
                        <span className="text-text-muted font-mono text-[10px]">({f.rule_id || f.source_engine})</span>
                      </div>
                      <p className="text-text-secondary leading-relaxed">{f.description}</p>
                      {f.suggested_fix && (
                        <div className="mt-1 p-2.5 rounded bg-background border border-border">
                          <span className="text-[10px] uppercase font-bold text-accent-secondary tracking-wider block mb-1">
                            Suggested Fix:
                          </span>
                          <pre className="text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                            {f.suggested_fix}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

