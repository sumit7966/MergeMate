import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit2,
  Code2,
  ShieldAlert,
  Users,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Repositories', to: '/repositories', icon: FolderGit2 },
    { name: 'Pull Requests', to: '/pull-requests', icon: GitPullRequest },
    { name: 'Review Workspace', to: '/workspace', icon: Code2, highlight: true },
    { name: 'Security Center', to: '/security', icon: ShieldAlert },
    { name: 'Team', to: '/team', icon: Users },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-surface transition-all duration-300 ease-in-out z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-accent-secondary shadow-glow shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-text-primary">
                Merge<span className="text-accent-secondary">Mate</span>
              </span>
              <span className="text-[10px] tracking-wider uppercase text-text-muted font-medium">
                AI Code Review
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent-primary/10 text-accent-secondary border border-accent-primary/20 shadow-glow'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                } ${item.highlight && !collapsed ? 'relative' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
              {!collapsed && item.highlight && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold uppercase bg-accent-primary/20 text-accent-primary rounded-md border border-accent-primary/30">
                  AI
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Docs Footer */}
      <div className="p-3 border-t border-border">
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Documentation</span>}
        </a>
      </div>
    </aside>
  );
};
