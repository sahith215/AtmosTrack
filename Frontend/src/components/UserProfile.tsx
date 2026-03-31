import React, { useState, useEffect } from 'react';
import {
  User, Mail, Shield, Calendar, Activity, Lock, Eye, EyeOff,
  Save, Pencil, X, ChevronLeft, Database, Link2, AlertTriangle,
  CheckCircle, Clock, Zap, Star, Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_BASE as API } from '../config';

interface ProfileStats {
  totalReadings: number;
  anchoredReadings: number;
  memberSince: string;
}

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  bio: string;
}

interface UserProfileProps {
  onBack: () => void;
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-orange-400 to-rose-500',
  'from-emerald-400 to-teal-500',
  'from-blue-500 to-indigo-600',
  'from-amber-400 to-orange-500',
];

function getAvatarGradient(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const { user, token, setUser, logout } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password state
  const [showPwPanel, setShowPwPanel] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Delete account state
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setProfile(data.user);
        setStats(data.stats);
        setEditName(data.user.name);
        setEditBio(data.user.bio ?? '');
      }
    } catch {
      showToast('Could not load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      showToast('Name must be at least 2 characters', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, bio: editBio }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfile(prev => prev ? { ...prev, name: data.user.name, bio: data.user.bio } : prev);
        setUser(prev => prev ? { ...prev, name: data.user.name } : prev);
        localStorage.setItem('atmos_user', JSON.stringify({ ...user, name: data.user.name }));
        localStorage.setItem('atmos_token', data.token);
        setEditMode(false);
        showToast('Profile updated!', 'success');
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { showToast('All fields required', 'error'); return; }
    if (newPw !== confirmPw) { showToast('New passwords do not match', 'error'); return; }
    if (newPw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    setSavingPw(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Password changed successfully!', 'success');
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
        setShowPwPanel(false);
      } else {
        showToast(data.error || 'Password change failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePw) { showToast('Enter your password to confirm', 'error'); return; }
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/auth/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePw }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Account deleted. Goodbye.', 'success');
        logout();
      } else {
        showToast(data.error || 'Deletion failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    admin: { label: 'Admin', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
    operator: { label: 'Operator', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
    viewer: { label: 'Viewer', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300' },
  };
  const role = roleConfig[profile?.role ?? 'viewer'] ?? roleConfig.viewer;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-400/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  const avatarGradient = getAvatarGradient(profile?.name ?? 'A');
  const initials = getInitials(profile?.name ?? 'AT');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-16">
      {/* Back button */}
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-20 space-y-6">

        {/* ── Hero Card ──────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
          {/* Decorative glow */}
          <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${avatarGradient} opacity-10 blur-3xl`} />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            {/* Avatar */}
            <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-xl flex-shrink-0`}>
              <span className="text-3xl font-black text-white">{initials}</span>
              {profile?.emailVerified && (
                <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900">
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1 block">Display Name</label>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full max-w-xs bg-slate-700/60 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1 block">Bio <span className="text-slate-500 normal-case">(optional, max 200 chars)</span></label>
                    <textarea
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      maxLength={200}
                      rows={2}
                      className="w-full max-w-sm bg-slate-700/60 border border-slate-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none"
                      placeholder="A short bio about yourself…"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingProfile ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                      Save changes
                    </button>
                    <button onClick={() => { setEditMode(false); setEditName(profile?.name ?? ''); setEditBio(profile?.bio ?? ''); }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-300 text-sm rounded-xl hover:bg-slate-600 transition">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-bold text-white">{profile?.name}</h1>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${role.bg} ${role.color}`}>
                      {role.label}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{profile?.email}</p>
                  {profile?.bio && <p className="text-slate-300 text-sm mt-2 italic">"{profile.bio}"</p>}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {profile?.emailVerified && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> Email verified
                      </span>
                    )}
                    {profile?.lastLogin && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-700/60 border border-slate-600 px-2.5 py-1 rounded-full">
                        <Clock className="w-3.5 h-3.5" /> Last login: {new Date(profile.lastLogin).toLocaleString()}
                      </span>
                    )}
                    {profile?.createdAt && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-700/60 border border-slate-600 px-2.5 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5" /> Member since {new Date(profile.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Edit button */}
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700/60 border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-600 hover:text-white transition-all duration-200"
              >
                <Pencil className="w-4 h-4" /> Edit profile
              </button>
            )}
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Database, label: 'Total Readings', value: stats?.totalReadings?.toLocaleString() ?? '—', color: 'from-blue-500 to-indigo-500', glow: 'shadow-blue-500/20' },
            { icon: Link2, label: 'On-chain Anchored', value: stats?.anchoredReadings?.toLocaleString() ?? '—', color: 'from-emerald-400 to-teal-500', glow: 'shadow-emerald-500/20' },
            { icon: Star, label: 'Role', value: profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '—', color: 'from-violet-500 to-fuchsia-500', glow: 'shadow-violet-500/20' },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={`relative overflow-hidden rounded-2xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-xl p-6 shadow-lg ${stat.glow}`}>
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 blur-xl`} />
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* ── Security ──────────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-xl overflow-hidden">
          <div
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-700/20 transition-colors"
            onClick={() => setShowPwPanel(v => !v)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Security</h2>
                <p className="text-xs text-slate-400 mt-0.5">Change your password</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center transition-transform duration-200 ${showPwPanel ? 'rotate-45' : ''}`}>
              <span className="text-slate-300 text-lg leading-none">+</span>
            </div>
          </div>

          {showPwPanel && (
            <div className="border-t border-slate-700/50 p-6 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Current Password', value: currentPw, setter: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                  { label: 'New Password', value: newPw, setter: setNewPw, show: showNew, toggle: () => setShowNew(v => !v) },
                  { label: 'Confirm New Password', value: confirmPw, setter: setConfirmPw, show: showNew, toggle: () => {} },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1.5 block">{field.label}</label>
                    <div className="relative">
                      <input
                        type={field.show ? 'text' : 'password'}
                        value={field.value}
                        onChange={e => field.setter(e.target.value)}
                        className="w-full bg-slate-700/60 border border-slate-600 text-white rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                        placeholder="••••••••"
                      />
                      <button onClick={field.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition">
                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Password strength indicator */}
              {newPw && (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {[8, 12, 16].map((len, i) => (
                      <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${newPw.length >= len ? ['bg-red-500', 'bg-amber-400', 'bg-emerald-500'][i] : 'bg-slate-600'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    {newPw.length < 8 ? '⚠️ Too short' : newPw.length < 12 ? '🔶 Fair' : newPw.length < 16 ? '✅ Good' : '💪 Strong'}
                  </p>
                </div>
              )}

              <button
                onClick={handleChangePassword}
                disabled={savingPw}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-400 to-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPw ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          )}
        </div>

        {/* ── Account Info ──────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-xl p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Account Information</h2>
              <p className="text-xs text-slate-400 mt-0.5">Read-only account details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: User, label: 'User ID', value: profile?.id, mono: true },
              { icon: Mail, label: 'Email Address', value: profile?.email, mono: false },
              { icon: Shield, label: 'Role', value: profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '', mono: false },
              { icon: Zap, label: 'Email Status', value: profile?.emailVerified ? 'Verified ✅' : 'Not verified ⚠️', mono: false },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-2xl border border-slate-600/30">
                  <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">{item.label}</p>
                    <p className={`text-sm text-white mt-0.5 ${item.mono ? 'font-mono text-[11px] text-slate-300 break-all' : 'font-medium'}`}>
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <div className="rounded-3xl bg-red-950/20 border border-red-800/40 backdrop-blur-xl overflow-hidden">
          <div
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-red-900/10 transition-colors"
            onClick={() => setShowDeletePanel(v => !v)}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-red-400">Danger Zone</h2>
                <p className="text-xs text-red-400/60 mt-0.5">Permanently delete your account</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-xl bg-red-900/40 flex items-center justify-center transition-transform duration-200 ${showDeletePanel ? 'rotate-45' : ''}`}>
              <span className="text-red-400 text-lg leading-none">+</span>
            </div>
          </div>

          {showDeletePanel && (
            <div className="border-t border-red-800/40 p-6 space-y-4">
              <div className="p-4 bg-red-900/20 rounded-2xl border border-red-700/30">
                <p className="text-red-300 text-sm font-medium">⚠️ This action is irreversible.</p>
                <p className="text-red-400/70 text-xs mt-1">All your data, settings, and account history will be permanently deleted. Your sensor readings will remain in the database but will no longer be associated with your account.</p>
              </div>

              <div className="max-w-xs">
                <label className="text-xs text-red-400 font-semibold uppercase tracking-widest mb-1.5 block">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePw}
                  onChange={e => setDeletePw(e.target.value)}
                  className="w-full bg-slate-800 border border-red-700/40 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePw}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete my account permanently
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
