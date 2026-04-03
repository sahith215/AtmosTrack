import React, { useState, useEffect } from 'react';
import {
  User, Mail, Shield, Calendar, Activity, Lock, Eye, EyeOff,
  Save, Pencil, X, ChevronLeft, Database, Link2, AlertTriangle,
  CheckCircle, Clock, Zap, Star, Trash2, ShieldCheck, Cpu
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
  'from-orange-500 to-amber-500',
  'from-emerald-500 to-teal-500',
  'from-sky-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-indigo-600',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        
        // Update local storage to persist changes across refreshes
        const storedUser = localStorage.getItem('atmos_user');
        if (storedUser) {
           const parsed = JSON.parse(storedUser);
           localStorage.setItem('atmos_user', JSON.stringify({ ...parsed, name: data.user.name }));
        }

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
    admin: { label: 'Admin', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
    operator: { label: 'Operator', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
    viewer: { label: 'Viewer', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200' },
  };
  const role = roleConfig[profile?.role ?? 'viewer'] ?? roleConfig.viewer;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 via-orange-50/40 to-amber-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-orange-800 font-bold animate-pulse">Synchronizing Profile...</p>
        </div>
      </div>
    );
  }

  const avatarGradient = getAvatarGradient(profile?.name ?? 'A');
  const initials = getInitials(profile?.name ?? 'AT');

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/40 to-amber-50 pt-16">
      
      {/* ── NAVIGATION ────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-all font-bold text-sm"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-cream-200 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <ChevronLeft className="w-4 h-4" />
          </div>
          Back to Terminal
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-6 animate-fade-in">

        {/* ── PROFILE HERO CARD ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white/80 backdrop-blur-md border border-cream-200 shadow-xl p-8 md:p-12">
          {/* Subtle decorative glow */}
          <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${avatarGradient} opacity-[0.03] rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none`} />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* Massive Avatar */}
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-2xl relative`}>
                <span className="text-4xl sm:text-5xl font-black text-white">{initials}</span>
                {profile?.emailVerified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Identity & Meta */}
              <div className="text-center sm:text-left">
                {editMode ? (
                  <div className="space-y-4 max-w-sm">
                    <div>
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="text-2xl font-black text-gray-900 bg-orange-50/50 border-b-2 border-orange-500 px-2 py-1 focus:outline-none w-full"
                        placeholder="System Name"
                      />
                    </div>
                    <textarea
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      maxLength={200}
                      rows={2}
                      className="text-sm text-gray-500 bg-white border border-cream-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full resize-none"
                      placeholder="Operational bio (optional)..."
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black uppercase rounded-xl shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                      >
                        {savingProfile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Commit Changes
                      </button>
                      <button 
                        onClick={() => { setEditMode(false); setEditName(profile?.name ?? ''); setEditBio(profile?.bio ?? ''); }}
                        className="px-4 py-2.5 bg-gray-100 text-gray-500 text-xs font-bold uppercase rounded-xl hover:bg-gray-200 transition"
                      >
                        Abort
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 justify-center sm:justify-start">
                      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">{profile?.name}</h1>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${role.bg} ${role.color}`}>
                        {role.label}
                      </span>
                    </div>
                    <p className="text-gray-500 font-medium flex items-center gap-2 justify-center sm:justify-start">
                      <Mail className="w-4 h-4 text-orange-400" />
                      {profile?.email}
                    </p>
                    {profile?.bio && <p className="text-gray-400 text-sm font-medium italic mt-2">"{profile.bio}"</p>}
                    <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                      {profile?.lastLogin && (
                        <div className="px-3 py-1 bg-white border border-cream-200 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                          <Clock className="w-3 h-3 text-orange-400" />
                          Last Seen: {new Date(profile.lastLogin).toLocaleDateString()}
                        </div>
                      )}
                      <div className="px-3 py-1 bg-white border border-cream-200 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Calendar className="w-3 h-3 text-orange-400" />
                        Joined: {new Date(profile?.createdAt ?? Date.now()).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white border border-cream-200 text-gray-700 text-sm font-black hover:border-orange-500 hover:text-orange-600 transition-all shadow-sm hover:shadow-md"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── STATS COMMAND CENTER ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Ingested Data', value: stats?.totalReadings?.toLocaleString() ?? '—', unit: 'READINGS', icon: Database, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Blockchain Pulse', value: stats?.anchoredReadings?.toLocaleString() ?? '—', unit: 'ANCHORS', icon: Link2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Access Level', value: role.label, unit: 'PERMISSION', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/80 backdrop-blur-md rounded-[2rem] border border-cream-200 p-8 shadow-lg hover:scale-[1.02] transition-transform duration-300">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <p className={`text-4xl font-black ${stat.color} tracking-tighter mb-1`}>{stat.value}</p>
              <p className="text-[10px] font-bold text-gray-300">{stat.unit}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── SECURITY CONFIG ─────────────────────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-cream-200 overflow-hidden flex flex-col shadow-lg">
            <div 
              className="p-8 cursor-pointer hover:bg-orange-50/50 transition-colors flex items-center justify-between"
              onClick={() => setShowPwPanel(!showPwPanel)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Security</h3>
                  <p className="text-xs text-gray-400 font-medium">Access protocols & authentication</p>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full border border-cream-200 flex items-center justify-center transition-transform ${showPwPanel ? 'rotate-180' : ''}`}>
                <ChevronLeft className="-rotate-90 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {showPwPanel && (
              <div className="p-8 border-t border-cream-100 space-y-6 animate-slide-down">
                {[
                  { label: 'Current Key', value: currentPw, setter: setCurrentPw, show: showCurrent, setterShow: setShowCurrent },
                  { label: 'New Key', value: newPw, setter: setNewPw, show: showNew, setterShow: setShowNew },
                  { label: 'Confirm New Key', value: confirmPw, setter: setConfirmPw, show: showNew, setterShow: setShowNew },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">{field.label}</label>
                    <div className="relative">
                      <input 
                        type={field.show ? 'text' : 'password'}
                        value={field.value}
                        onChange={e => field.setter(e.target.value)}
                        className="w-full bg-orange-50/30 border border-cream-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        placeholder="••••••••••••"
                      />
                      <button onClick={() => field.setterShow(!field.show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition">
                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                
                {newPw && (
                  <div className="space-y-1.5 px-1">
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full ${newPw.length > (i * 4) ? 'bg-orange-500' : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">{newPw.length < 8 ? 'Weak Strength' : 'Secure Level'}</p>
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={savingPw}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white text-sm font-black uppercase rounded-2xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {savingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                  Update Access Credentials
                </button>
              </div>
            )}
          </div>

          {/* ── ACCOUNT DETAILS ─────────────────────────────────────────── */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] border border-cream-200 p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">System Identity</h3>
                <p className="text-xs text-gray-400 font-medium">Read-only account identifiers</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: 'System UUID', value: profile?.id, icon: Cpu },
                { label: 'Authorized Role', value: role.label, icon: Star },
                { label: 'Trust Status', value: profile?.emailVerified ? 'Certified Verified' : 'Standard Account', icon: ShieldCheck },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-orange-50/40 rounded-2xl border border-cream-100">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700 font-mono">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DANGER ZONE ───────────────────────────────────────────────── */}
        <div className="bg-rose-50/50 backdrop-blur-sm rounded-[2.5rem] border border-rose-100 p-8 shadow-sm">
          <div 
            className="flex flex-col sm:flex-row items-center justify-between gap-6 cursor-pointer"
            onClick={() => setShowDeletePanel(!showDeletePanel)}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-rose-800 tracking-tight">Danger Zone</h3>
                <p className="text-xs text-rose-700/60 font-medium">Permanently disconnect and delete account</p>
              </div>
            </div>
            <button className="px-6 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-black uppercase hover:bg-rose-100 transition-colors">
              {showDeletePanel ? 'Retract' : 'Initiate Deletion'}
            </button>
          </div>

          {showDeletePanel && (
            <div className="mt-8 pt-8 border-t border-rose-200 space-y-6 animate-slide-up">
              <div className="p-5 bg-white rounded-2xl border border-rose-100 text-rose-700">
                <p className="text-sm font-black mb-1">Irreversible System Action</p>
                <p className="text-xs font-medium opacity-80 leading-relaxed">
                  Deleting your account will purge all personal identifiers, settings, and verification links. 
                  All historically ingested sensor data will remain for network integrity but will be anonymized.
                </p>
              </div>

              <div className="max-w-md">
                <label className="text-[10px] font-black text-rose-800 uppercase tracking-wider mb-2 block">Confirm with Password</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="password"
                    value={deletePw}
                    onChange={e => setDeletePw(e.target.value)}
                    className="flex-1 bg-white border border-rose-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    placeholder="Enter password..."
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting || !deletePw}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-rose-600 text-white text-xs font-black uppercase rounded-xl shadow-lg hover:bg-rose-700 transition-all disabled:opacity-50"
                  >
                    {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Confirm Purge
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
