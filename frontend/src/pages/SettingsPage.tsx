import React, { useState } from 'react';
import { User, Lock, Bell, Github, Shield, Sparkles, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [githubUser, setGithubUser] = useState(user?.github_username || '');
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast('Profile settings saved successfully.');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Account & Global Settings</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Manage your personal profile, authentication, notification preferences, and GitHub App integration.
        </p>
      </div>

      {toast && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* User Profile Card */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <User className="w-4 h-4 text-accent-secondary" /> User Profile
        </h2>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>

            <div>
              <label className="block text-text-secondary font-medium mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full h-9 px-3 rounded-lg bg-surface-elevated border border-border text-text-muted cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary font-medium mb-1.5">GitHub Username</label>
            <input
              type="text"
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value)}
              placeholder="e.g. octocat"
              className="w-full h-9 px-3 rounded-lg bg-surface-elevated border border-border text-text-primary focus:outline-none focus:border-accent-primary font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* GitHub Integration Status */}
      <div className="p-6 rounded-2xl bg-surface border border-border space-y-4">
        <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
          <Github className="w-4 h-4 text-accent-secondary" /> GitHub App Integration Status
        </h2>

        <div className="p-4 rounded-xl bg-surface-elevated border border-border flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-semibold text-white text-xs block">MergeMate Production Bot</span>
            <span className="text-[11px] text-text-muted">
              App Permissions: Pull requests (write), Repository contents (read), Checks (write)
            </span>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Installed & Active
          </span>
        </div>
      </div>
    </div>
  );
};
