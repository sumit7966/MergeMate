import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Terminal,
  GitPullRequest,
  CheckCircle2,
  Lock,
  ArrowRight,
  Code2,
  Layers,
  Cpu,
  Github,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-accent-primary selection:text-white">
      {/* Navbar */}
      <header className="border-b border-border/80 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Merge<span className="text-accent-secondary">Mate</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">How it works</a>
            <a href="#capabilities" className="hover:text-text-primary transition-colors">Capabilities</a>
            <a href="#security" className="hover:text-text-primary transition-colors">Security</a>
            <a href="#comparison" className="hover:text-text-primary transition-colors">Comparison</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-accent-primary hover:bg-accent-hover text-white shadow-glow transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent-primary/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-accent-secondary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-accent-secondary text-xs font-medium mb-8 shadow-glow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing MergeMate 1.0 — Next-Gen AI Code Review Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Your AI Code Reviewer.{' '}
            <span className="bg-gradient-to-r from-accent-primary via-accent-secondary to-white bg-clip-text text-transparent">
              Always On.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Catch bugs, uncover security risks, and improve every pull request before it reaches production. Automated first-level inspection with surgical precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 text-white font-semibold text-sm shadow-glow flex items-center justify-center gap-2 transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-border text-text-primary font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Explore Features</span>
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#171B26] hover:bg-[#1E2433] border border-border text-text-secondary hover:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Github className="w-4 h-4" />
              <span>Connect GitHub</span>
            </a>
          </div>
        </div>

        {/* Product Interface Preview Mockup */}
        <div className="max-w-5xl mx-auto mt-16 rounded-2xl border border-border/80 bg-surface/70 backdrop-blur-xl shadow-2xl overflow-hidden p-2">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[#0B0F19]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-text-muted">mergemate-review-workspace.tsx</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              PR #42 • Review Complete
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border bg-[#0D121F] text-left p-6 font-mono text-xs">
            <div className="p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block font-sans">
                Changed Files
              </span>
              <div className="p-2.5 rounded-lg bg-surface-elevated border border-accent-primary/40 text-accent-secondary">
                payment_processor.py <span className="text-emerald-400 font-bold ml-1">+18</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface border border-border text-text-secondary">
                auth_validator.py <span className="text-emerald-400 font-bold ml-1">+6</span>
              </div>
            </div>
            <div className="p-4 space-y-2 col-span-2">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block font-sans">
                Code Diff & Inline Inspection
              </span>
              <div className="p-3 rounded-lg bg-[#07090E] border border-border text-text-primary leading-relaxed">
                <span className="text-text-muted select-none">20 </span> query = f"SELECT * FROM transactions WHERE id = '{'{transaction_id}'}'"<br />
                <span className="inline-block mt-2 px-2.5 py-1 rounded bg-red-500/15 border border-red-500/30 text-red-300 font-sans text-xs">
                  🔴 [CRITICAL] SQL Injection via raw string formatting detected.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 border-t border-border bg-surface/40">
        <div className="max-w-6xl mx-auto text-center">
          <span className="text-xs font-bold text-accent-secondary uppercase tracking-widest block mb-3">
            Workflow Architecture
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-16">
            Intelligent Review in 5 Seamless Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
            {[
              { step: '01', title: 'PR Opened', desc: 'Developer creates or synchronizes a pull request on GitHub.' },
              { step: '02', title: 'Webhook Verification', desc: 'MergeMate verifies HMAC SHA-256 and queues async review.' },
              { step: '03', title: 'Static & Security Scans', desc: 'Ruff, Bandit, Gitleaks, and OSV analyze changed code chunks.' },
              { step: '04', title: 'AI Code Analysis', desc: 'Multi-category LLM analyzes logic, race conditions, and edge cases.' },
              { step: '05', title: 'GitHub Publishing', desc: 'Actionable inline comments and review summary posted back to GitHub.' },
            ].map((s) => (
              <div key={s.step} className="p-5 rounded-xl bg-surface-elevated border border-border hover:border-accent-primary/40 transition-colors">
                <span className="text-accent-secondary font-mono font-bold text-sm block mb-2">{s.step}</span>
                <h3 className="text-sm font-semibold text-text-primary mb-2 font-sans">{s.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-accent-secondary uppercase tracking-widest block mb-3">
              Comprehensive Analysis
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Every Dimension of Code Quality Covered
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Security & Secret Defense',
                desc: 'Identifies SQL injections, RCE vectors, unsafe deserialization, and leaked API tokens with automatic credential masking.',
              },
              {
                icon: Cpu,
                title: 'Concurrency & Performance',
                desc: 'Uncovers race conditions, missing HTTP timeouts, connection pool exhaustion, and unindexed database queries.',
              },
              {
                icon: Terminal,
                title: 'Isolated Container Tests',
                desc: 'Executes test suites inside ephemeral non-root sandbox containers with CPU, memory, and execution quotas.',
              },
              {
                icon: GitPullRequest,
                title: 'Surgical Inline Comments',
                desc: 'Places review suggestions exactly on modified diff lines, guaranteeing developers can apply fixes in one click.',
              },
              {
                icon: Layers,
                title: 'Multi-Engine Consensus',
                desc: 'Combines deterministic AST linters (Ruff, Bandit) with state-of-the-art LLMs, deduplicating findings for high confidence.',
              },
              {
                icon: Lock,
                title: 'Prompt Injection Hardened',
                desc: 'Treats user PR code as untrusted input. Strict schema validation protects review pipelines against jailbreak attempts.',
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-surface border border-border hover:border-accent-primary/50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-secondary mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section id="comparison" className="py-24 px-6 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-accent-secondary uppercase tracking-widest block mb-3">
              Market Advantage
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Why Engineering Teams Choose MergeMate
            </h2>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden bg-surface-elevated">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-[#0B0F19] text-text-muted uppercase text-[11px] tracking-wider border-b border-border">
                <tr>
                  <th className="py-4 px-6 font-semibold">Capability</th>
                  <th className="py-4 px-6 font-bold text-accent-secondary">MergeMate</th>
                  <th className="py-4 px-6 font-medium">Standard Linters</th>
                  <th className="py-4 px-6 font-medium">Generic LLM Chatbots</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feat: 'Diff-Aware Inline PR Comments', mm: true, linter: false, chat: false },
                  { feat: 'Real-time Secret & Credential Masking', mm: true, linter: true, chat: false },
                  { feat: 'Isolated Ephemeral Container Testing', mm: true, linter: false, chat: false },
                  { feat: 'Multi-Engine AST + AI Consensus', mm: true, linter: false, chat: false },
                  { feat: 'Deterministic HMAC Webhook Security', mm: true, linter: false, chat: false },
                  { feat: 'Interactive Reviewer Feedback Loop', mm: true, linter: false, chat: false },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-text-primary">{row.feat}</td>
                    <td className="py-3.5 px-6 text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Yes</span>
                    </td>
                    <td className="py-3.5 px-6 text-text-muted">{row.linter ? 'Partial' : 'No'}</td>
                    <td className="py-3.5 px-6 text-text-muted">{row.chat ? 'Partial' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-border text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent-primary/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Ship Better Code. Merge With Confidence.
          </h2>
          <p className="text-text-secondary text-base mb-8 max-w-xl mx-auto">
            Automate code reviews across all your repositories in minutes with MergeMate.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 text-white font-semibold text-base shadow-glow transition-all"
          >
            <span>Launch MergeMate</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-text-muted">
        <p>© 2026 MergeMate AI Inc. All rights reserved. Built for engineering teams that move fast.</p>
      </footer>
    </div>
  );
};

