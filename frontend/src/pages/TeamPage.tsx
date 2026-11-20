import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, Trash2, Mail, Check } from 'lucide-react';
import { OrganizationMember } from '@/types';
import { api } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export const TeamPage: React.FC = () => {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [toast, setToast] = useState<string | null>(null);

  const orgId = user?.current_organization_id;

  const loadMembers = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await api.getOrganizationMembers(orgId);
      setMembers(data);
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [orgId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await api.addOrganizationMember(orgId, inviteEmail, inviteRole);
      setToast(`Invited ${inviteEmail} as ${inviteRole}`);
      setTimeout(() => setToast(null), 3000);
      setShowInviteModal(false);
      setInviteEmail('');
      loadMembers();
    } catch (err: any) {
      alert(`Failed to add member: ${err.message}`);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!orgId) return;
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await api.removeOrganizationMember(orgId, memberId);
      loadMembers();
    } catch (err: any) {
      alert(`Remove failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Team Management</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage organization members, role-based access control, and review permissions.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-xs font-semibold shadow-glow transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Member</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-elevated text-text-muted uppercase text-[10px] tracking-wider border-b border-border">
            <tr>
              <th className="py-3 px-5">Member</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-surface-elevated/40 transition-colors">
                <td className="py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center font-bold text-xs text-accent-secondary">
                      {m.user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span className="font-semibold text-white block">{m.user?.full_name}</span>
                      <span className="text-text-muted text-[11px]">{m.user?.email}</span>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize bg-surface-elevated border border-border text-slate-300">
                    {m.role}
                  </span>
                </td>

                <td className="py-4 px-4 text-text-muted">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>

                <td className="py-4 px-4 text-right">
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(m.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Invite Organization Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full h-9 px-3 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-surface-elevated border border-border text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-accent-primary hover:bg-accent-hover text-white text-xs font-semibold shadow-glow"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

