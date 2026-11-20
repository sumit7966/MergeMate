import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Play, User as UserIcon, LogOut, Check, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isSimulating, setIsSimulating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const getBreadcrumbs = () => {
    const path = location.pathname.split('/').filter(Boolean);
    if (path.length === 0) return 'Dashboard';
    return path
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' '))
      .join(' / ');
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    try {
      const review = await api.simulateWebhookReview();
      setToast(`Simulated PR webhook processed! Created review with ${review.total_findings} findings.`);
      setTimeout(() => setToast(null), 4000);
      navigate(`/workspace?prId=${review.pull_request_id}`);
    } catch (e: any) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <header className="h-16 px-6 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Platform
        </span>
        <span className="text-text-muted">/</span>
        <h1 className="text-sm font-medium text-text-primary">
          {getBreadcrumbs()}
        </h1>
      </div>

      {/* Center Toast */}
      {toast && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-primary/20 border border-accent-primary/40 text-accent-secondary text-xs font-medium shadow-glow">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Simulate Live Review Button */}
        <button
          onClick={handleSimulateWebhook}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-accent-primary to-accent-secondary hover:opacity-90 text-white shadow-glow transition-all disabled:opacity-50"
          title="Simulates an incoming GitHub PR webhook and executes the full review pipeline in real-time"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Analyzing PR...' : 'Simulate PR Review'}</span>
        </button>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search repositories, PRs..."
            className="w-56 h-9 pl-9 pr-3 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-colors"
          />
        </div>

        {/* Notifications */}
        <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated border border-transparent hover:border-border transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-accent-secondary absolute top-1.5 right-1.5" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-accent-primary font-semibold text-xs overflow-hidden">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
              user?.full_name?.charAt(0) || 'U'
            )}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-medium text-text-primary">{user?.full_name || 'Developer'}</span>
            <span className="text-[10px] text-text-muted">{user?.current_role || 'Owner'}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 ml-1 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

