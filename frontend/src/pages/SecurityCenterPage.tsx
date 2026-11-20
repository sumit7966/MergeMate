import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Key,
  PackageCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ReviewFinding } from '@/types';
import { api } from '@/services/api';
import { SeverityBadge } from '@/components/SeverityBadge';

export const SecurityCenterPage: React.FC = () => {
  const [securityFindings, setSecurityFindings] = useState<ReviewFinding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSecurity = async () => {
      setLoading(true);
      try {
        const ov = await api.getDashboardOverview();
        setSecurityFindings(ov.recent_security_findings || []);
      } catch (err) {
        console.error('Failed to load security center:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSecurity();
  }, []);

  const secretLeaks = securityFindings.filter((f) => f.category === 'secret_leak');
  const dependencyVulns = securityFindings.filter((f) => f.category === 'dependency_vulnerability');
  const codeSecVulns = securityFindings.filter(
    (f) => f.category === 'security' || (f.category !== 'secret_leak' && f.category !== 'dependency_vulnerability')
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-red-500/10 via-surface-elevated to-background border border-red-500/20">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">Security & Vulnerability Center</h1>
        </div>
        <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
          Real-time threat detection across pull requests. Identifies high-entropy secrets, unsafe cryptography, known CVE dependencies, and injection flaws before merging.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted">Secret Leaks Prevented</span>
            <Key className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{secretLeaks.length}</div>
          <span className="text-[11px] text-text-muted mt-1 block">API tokens, private keys, AWS IDs</span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted">Vulnerable Dependencies</span>
            <PackageCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{dependencyVulns.length}</div>
          <span className="text-[11px] text-text-muted mt-1 block">OSV / CVE database match</span>
        </div>

        <div className="p-5 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-muted">Code Vulnerabilities</span>
            <AlertTriangle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white">{codeSecVulns.length}</div>
          <span className="text-[11px] text-text-muted mt-1 block">SQLi, command injection, auth flaws</span>
        </div>
      </div>

      {/* Vulnerabilities Feed */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white tracking-tight">Detected Security Findings</h2>

        <div className="space-y-3">
          {securityFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-5 rounded-xl bg-surface border border-border hover:border-red-500/30 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={finding.severity} size="sm" />
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-surface-elevated text-text-muted border border-border">
                    {finding.category.replace('_', ' ')}
                  </span>
                  <span className="font-mono text-xs text-text-muted">
                    {finding.file_path}
                    {finding.line_start && <span className="text-accent-secondary">:L{finding.line_start}</span>}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{finding.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{finding.description}</p>

                {/* Evidence snippet */}
                {finding.code_evidence && (
                  <div className="p-2.5 rounded-lg bg-[#07090E] border border-border font-mono text-[11px] text-red-300">
                    <span className="text-text-muted text-[10px] uppercase font-bold block mb-1">Evidence:</span>
                    {finding.code_evidence}
                  </div>
                )}

                {/* Remediation */}
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <span className="text-emerald-400 font-bold uppercase text-[10px] block mb-1">
                    Remediation Guidance
                  </span>
                  <p className="text-emerald-200/90 leading-relaxed">{finding.suggested_fix}</p>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2 text-right">
                <span className="px-2 py-1 rounded bg-surface-elevated border border-border font-mono text-[11px] text-text-muted">
                  Rule: {finding.rule_id || 'SEC-01'}
                </span>
                <span className="text-[11px] text-accent-secondary font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {Math.round(finding.confidence * 100)}% Confidence
                </span>
              </div>
            </div>
          ))}

          {securityFindings.length === 0 && !loading && (
            <div className="p-12 text-center rounded-2xl bg-surface border border-border">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-text-primary mb-1">No security violations detected</h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                All reviewed repositories pass the security baseline. No active secret leaks or known critical CVEs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

