import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { API_BASE } from '../../config';
import {
  Shield,
  Users,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  AlertTriangle,
  Key,
  Download,
  ChevronRight,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';

type Role = 'admin' | 'operator' | 'viewer';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLogin: string | null;
  authProvider: string;
  createdAt: string;
  failedAttempts?: number;
}

const roleColors: Record<Role, string> = {
  admin: 'bg-orange-100 text-orange-700 border-orange-200',
  operator: 'bg-sky-100 text-sky-700 border-sky-200',
  viewer: 'bg-gray-100 text-gray-700 border-gray-200',
};

const UserRoleCommandSurface: React.FC = () => {
  const { token, user: currentUser } = useAuth();
  const { showToast } = useToast();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Action Modals State
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load users');
      setUsers(data.users || []);
      
      // Auto-select first user if none selected
      if (data.users && data.users.length > 0 && !selectedUser) {
        setSelectedUser(data.users[0]);
      } else if (selectedUser) {
        // Update selected user with fresh data
        const updated = data.users.find((u: UserData) => u._id === selectedUser._id);
        if (updated) setSelectedUser(updated);
      }
    } catch (err: any) {
      setError(err.message);
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handlers
  const handleUpdateRole = async (userId: string, targetRole: Role) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${targetRole.toUpperCase()}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ role: targetRole })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update role');
      showToast('success', 'Role updated successfully.');
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'LOCK' : 'UNLOCK';
    if (!window.confirm(`Are you sure you want to ${action} this account?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update status');
      showToast('success', `Account ${!currentStatus ? 'Unloced' : 'Locked'}.`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceReset = async (userId: string) => {
    if (!window.confirm('This will invalidate their current password and sessions. Proceed?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/force-reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to force reset');
      showToast('success', 'Password reset enforced. Sessions invalidated.');
      fetchUsers();
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const locked = total - active;
    const admins = users.filter(u => u.role === 'admin').length;
    return { total, active, locked, admins };
  }, [users]);

  // Filtered Users
  const displayUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lower = searchTerm.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(lower) || 
      u.email.toLowerCase().includes(lower) || 
      u.role.toLowerCase().includes(lower)
    );
  }, [users, searchTerm]);

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-cream-50 via-orange-50/60 to-amber-50 font-sans pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header Strip */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              User Directory & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Access Control</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage roles, monitor security flags, and enforce session invalidations.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={fetchUsers}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-orange-100 text-gray-500 hover:text-orange-600 hover:border-orange-300 transition-colors shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-500' : ''}`} />
             </button>
             <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:border-orange-300 transition">
              <Download className="h-4 w-4 text-gray-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">Total Users</span>
            </div>
            <span className="text-2xl font-black text-gray-900">{stats.total}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">Active</span>
            </div>
            <span className="text-2xl font-black text-emerald-700">{stats.active}</span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-rose-100 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-rose-600 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">Locked</span>
            </div>
            <span className="text-2xl font-black text-rose-700">{stats.locked}</span>
          </div>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 shadow-md border border-slate-700 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-slate-300 mb-2">
              <Shield className="w-4 h-4 text-orange-400" />
              <span className="text-xs uppercase font-bold tracking-wider">Admins</span>
            </div>
            <span className="text-2xl font-black text-white">{stats.admins}</span>
          </div>
        </section>

        {error && (
           <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-700 text-sm font-medium">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             {error}
           </div>
        )}

        {/* Main Content Split */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left: Table Area */}
          <div className="flex-1 bg-white rounded-3xl shadow-lg border border-orange-100/50 overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                   type="text"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search by name, email, or role..."
                   className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition"
                 />
              </div>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto flex-1 custom-scroll max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 border-b border-gray-100 shadow-sm text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Method</th>
                    <th className="px-5 py-3 font-semibold">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayUsers.map((u) => {
                    const isSelected = selectedUser?._id === u._id;
                    return (
                      <tr 
                        key={u._id} 
                        onClick={() => setSelectedUser(u)}
                        className={`cursor-pointer transition hover:bg-orange-50/50 group ${isSelected ? 'bg-orange-50/80 border-l-4 border-orange-500' : 'border-l-4 border-transparent'}`}
                      >
                        <td className="px-5 py-3 whitespace-nowrap">
                           <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center text-orange-800 font-bold text-xs shrink-0">
                               {u.name.substring(0,2).toUpperCase()}
                             </div>
                             <div className="flex flex-col">
                               <span className={`text-sm font-bold ${isSelected ? 'text-orange-900' : 'text-gray-900'}`}>{u.name}</span>
                               <span className="text-xs text-gray-500">{u.email}</span>
                             </div>
                           </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${roleColors[u.role]}`}>
                             {u.role}
                           </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                           {u.isActive ? (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold tracking-wide">
                               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                             </span>
                           ) : (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold tracking-wide">
                               <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Locked
                             </span>
                           )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-500 capitalize">
                           {u.authProvider}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-xs text-gray-500">
                           {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    )
                  })}
                  {loading && displayUsers.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-500">Loading directory...</td></tr>
                  )}
                  {!loading && displayUsers.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-500">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Inspector Sidebar */}
          <div className="w-full lg:w-[350px] shrink-0">
             {selectedUser ? (
               <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-800 text-white sticky top-28 animate-fade-in relative overflow-hidden">
                 {/* Decorative background glow */}
                 <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/20 blur-3xl pointer-events-none rounded-full" />
                 
                 <div className="flex items-center justify-between mb-6 relative z-10">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Identity</span>
                   {selectedUser.isActive ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                   ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="w-3 h-3"/> LOCKED</span>
                   )}
                 </div>
                 
                 <div className="flex items-center gap-4 mb-6 relative z-10">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                     {selectedUser.name.substring(0,2).toUpperCase()}
                   </div>
                   <div className="overflow-hidden">
                     <h3 className="text-lg font-bold text-white truncate">{selectedUser.name}</h3>
                     <p className="text-sm text-slate-400 truncate">{selectedUser.email}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                     <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Current Role</p>
                     <p className="text-sm font-semibold capitalize text-orange-400">{selectedUser.role}</p>
                   </div>
                   <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                     <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Created</p>
                     <p className="text-sm font-medium text-slate-300">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                   </div>
                 </div>

                 {/* Actions */}
                 <div className="space-y-3 relative z-10">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Access Controls</h4>
                   
                   {/* Role Promotion */}
                   <div className="flex flex-col gap-2 bg-slate-800/40 border border-slate-700 p-3 rounded-xl">
                      <p className="text-xs font-medium text-slate-300">Set Role Level</p>
                      <div className="grid grid-cols-3 gap-1 grid-flow-col max-w-[200px]">
                        {['viewer', 'operator', 'admin'].map(r => (
                           <button 
                             key={r}
                             disabled={selectedUser.role === r || actionLoading || (currentUser?.email !== 'sahasahu092@gmail.com' && r==='admin')}
                             onClick={() => handleUpdateRole(selectedUser._id, r as Role)}
                             className={`text-[10px] py-1.5 font-bold uppercase rounded-lg border transition ${
                               selectedUser.role === r 
                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 cursor-default'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                             } disabled:opacity-50`}
                           >
                             {r}
                           </button>
                        ))}
                      </div>
                   </div>

                   {/* Lock / Unlock */}
                   <button 
                     onClick={() => handleToggleStatus(selectedUser._id, selectedUser.isActive)}
                     disabled={actionLoading}
                     className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition ${
                       selectedUser.isActive 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                     } disabled:opacity-50`}
                   >
                     <span className="text-sm font-bold flex items-center gap-2">
                       {selectedUser.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                       {selectedUser.isActive ? 'Suspend Account' : 'Restore Access'}
                     </span>
                     <ChevronRight className="w-4 h-4 opacity-50" />
                   </button>

                   {/* Force Reset */}
                   {selectedUser.authProvider === 'email' && (
                     <button 
                       onClick={() => handleForceReset(selectedUser._id)}
                       disabled={actionLoading}
                       className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition disabled:opacity-50"
                     >
                       <span className="text-sm font-bold flex items-center gap-2">
                         <Key className="w-4 h-4" />
                         Force Password Reset
                       </span>
                       <ChevronRight className="w-4 h-4 opacity-50" />
                     </button>
                   )}
                 </div>
               </div>
             ) : (
               <div className="bg-white rounded-3xl p-8 border border-orange-100 flex flex-col items-center justify-center text-center h-64 sticky top-28 shadow-sm">
                 <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                   <Shield className="w-8 h-8 text-orange-300" />
                 </div>
                 <h3 className="text-gray-900 font-bold mb-1">No User Selected</h3>
                 <p className="text-sm text-gray-500">Click on any user row inside the directory table to view details and execute commands.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleCommandSurface;
