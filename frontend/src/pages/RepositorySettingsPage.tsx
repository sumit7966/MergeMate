import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  Save,
  Check,
  Shield,
  Bot,
  Terminal,
  Send,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { Repository, RepositorySettings } from '@/types';
import { api } from '@/services/api';

export const RepositorySettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [repo, setRepo] = useState<Repository | null>(null);
  const [settings, setSettings] = useState<RepositorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchRepo = async () => {
      setLoading(true);
      try {
        const r = await api.getRepository(id);
        setRepo(r);
        setSettings(r.settings || null);
      } catch (err) {
        console.error('Failed to load repo settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRepo();
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !settings) return;
    setSaving(true);
    try {
      const updated = await api.updateRepositorySettings(id, settings);
      setSettings(updated);
      setToast('Repository configuration saved successfully!');
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-xs text-text-muted">Loading repository settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/repositories')}
            className="p-2 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{repo?.name} Settings</h1>
            <span className="text-xs font-mono text-text-muted">{repo?.full_name}</span>
          </div>
        </div>

        {toast && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{toast}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Review Engines & Toggles */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-5">
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-accent-secondary" /> Automated Review Engines
          </h2>

          <div className="space-y-4 divide-y divide-border/40 text-xs">
            {/* Auto Review */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Automatic Review Trigger</span>
                <span className="text-text-muted">
                  Automatically start analysis when a PR is opened or synchronized.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_review_enabled}
                onChange={(e) => setSettings({ ...settings, auto_review_enabled: e.target.checked })}
                className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
              />
            </div>

            {/* AI Review */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">AI Code Intelligence (LLM)</span>
                <span className="text-text-muted">
                  Review logical bugs, performance problems, and error handling via LLM.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.ai_review_enabled}
                onChange={(e) => setSettings({ ...settings, ai_review_enabled: e.target.checked })}
                className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
              />
            </div>

            {/* Static Analysis */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Static AST Analysis (Ruff & Bandit)</span>
                <span className="text-text-muted">
                  Enforce syntax rules, code quality, and security linting on changed files.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.static_analysis_enabled}
                onChange={(e) => setSettings({ ...settings, static_analysis_enabled: e.target.checked })}
                className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
              />
            </div>

            {/* Security Scanning */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Secret & Dependency Scanning</span>
                <span className="text-text-muted">
                  Scan diffs for credentials (Gitleaks) and vulnerable CVE packages (OSV).
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.security_scanning_enabled}
                onChange={(e) => setSettings({ ...settings, security_scanning_enabled: e.target.checked })}
                className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
              />
            </div>

            {/* Test Execution */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">Isolated Container Testing</span>
                <span className="text-text-muted">
                  Run test suites inside ephemeral sandbox containers with CPU & memory limits.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.test_execution_enabled}
                onChange={(e) => setSettings({ ...settings, test_execution_enabled: e.target.checked })}
                className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
              />
            </div>

            {/* GitHub Publishing */}
            <div className="pt-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">GitHub Inline Comments Publishing</span>
                <span className="text-text-muted">
                  Publish findings as inline review comments and summary on the GitHub PR.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.github_publishing_enabled}
                onChange={(e) => setSettings({ ...settings, github_publishing_enabled: e.target.checked })}
                className="w-4 h-4 accent-accent-primary rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Model & Rule Configurations */}
        <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent-secondary" /> AI Model & Severity Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-text-secondary font-medium mb-1.5">AI Review Model</label>
              <select
                value={settings.ai_model}
                onChange={(e) => setSettings({ ...settings, ai_model: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-accent-primary font-mono text-xs"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                <option value="gpt-4o">gpt-4o (Deep Reasoning)</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
              </select>
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1.5">Minimum Severity Threshold</label>
              <select
                value={settings.severity_threshold}
                onChange={(e) => setSettings({ ...settings, severity_threshold: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-accent-primary capitalize text-xs"
              >
                <option value="low">Low (Report all potential defects)</option>
                <option value="medium">Medium (Exclude stylistic issues)</option>
                <option value="high">High (Report bugs & vulnerabilities only)</option>
                <option value="critical">Critical (Critical security defects only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Custom Review Instructions & Domain Guidelines
            </label>
            <textarea
              rows={4}
              value={settings.custom_instructions || ''}
              onChange={(e) => setSettings({ ...settings, custom_instructions: e.target.value })}
              placeholder="e.g. Ensure all database calls use async session. Verify all payment endpoints check idempotency key."
              className="w-full p-3 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary focus:outline-none focus:border-accent-primary font-mono placeholder:text-text-muted leading-relaxed"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-primary hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

