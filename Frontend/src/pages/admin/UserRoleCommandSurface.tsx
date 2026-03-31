// src/pages/admin/UserRoleCommandSurface.tsx
import React, { useState } from "react";
import { FiDownload, FiSearch, FiMoreVertical } from "react-icons/fi";

type Role = "Admin" | "Operator" | "Viewer";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "Active" | "Locked" | "Under review";
  lastLogin: string;
  sessions: number;
  ip: string;
  failedAttempts: number;
  risk: "Low" | "Medium" | "High";
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Jane Doe",
    email: "jane@campus-alpha.io",
    role: "Admin",
    status: "Active",
    lastLogin: "10:02 • Chrome on Windows",
    sessions: 3,
    ip: "192.0.2.14",
    failedAttempts: 5,
    risk: "High",
  },
  {
    id: "2",
    name: "Rahul Verma",
    email: "rahul@campus-alpha.io",
    role: "Operator",
    status: "Under review",
    lastLogin: "09:10 • Safari on macOS",
    sessions: 2,
    ip: "198.51.100.21",
    failedAttempts: 1,
    risk: "Medium",
  },
  // add more mock rows...
];

const roleColors: Record<Role, string> = {
  Admin: "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900",
  Operator: "bg-sky-500/90 text-slate-900",
  Viewer: "bg-emerald-400/90 text-slate-900",
};

const statusColors: Record<User["status"], string> = {
  Active: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
  Locked: "bg-red-500/15 text-red-300 border border-red-400/40",
  "Under review": "bg-amber-500/20 text-amber-300 border border-amber-400/40",
};

const riskDotColors: Record<User["risk"], string> = {
  Low: "bg-emerald-400",
  Medium: "bg-amber-400",
  High: "bg-red-400",
};

const UserRoleCommandSurface: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(mockUsers[0]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);

  const allSelected = selectedIds.size === mockUsers.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mockUsers.map((u) => u.id)));
    }
  };

  const toggleRowSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleViewAsToggle = () => {
    if (!selectedUser) return;
    setViewAsUserId((prev) => (prev === selectedUser.id ? null : selectedUser.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050B16] via-[#061221] to-[#071822] text-slate-50 font-sans">
      {/* View-as global banner */}
      {viewAsUserId && selectedUser && (
        <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 text-slate-900 px-6 py-2 shadow-xl">
          <p className="text-sm font-mono">
            Viewing as: <span className="font-semibold">{selectedUser.email}</span> • All actions
            logged • Be careful.
          </p>
          <button
            className="px-4 py-1.5 rounded-full bg-slate-900/80 text-amber-200 text-sm font-semibold hover:bg-slate-900 transition"
            onClick={() => setViewAsUserId(null)}
          >
            Exit view-as
          </button>
        </div>
      )}

      <div className={`mx-auto max-w-7xl px-6 pt-${viewAsUserId ? "16" : "8"} pb-10`}>
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">
              User &amp; role command surface
            </h1>
            <div className="mt-2 inline-flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-500/40 bg-slate-900/40 px-3 py-1 text-xs text-slate-200/90 shadow-sm">
                <span className="mr-2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                Scope: Campus Alpha • 234 users
              </span>
              <span className="text-[11px] font-mono uppercase tracking-wide text-slate-400/80">
                All actions fully audited
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-500/50 bg-slate-900/40 px-3 py-1.5 text-sm text-slate-100/90 hover:border-slate-300/70 hover:bg-slate-900/70 transition">
              <FiDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500 px-4 py-1.5 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/40 hover:brightness-110 transition">
              New user
            </button>
          </div>
        </header>

        {/* Hero charts row */}
        <section className="grid gap-4 md:grid-cols-5 mb-6">
          {/* Logins chart */}
          <div className="md:col-span-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)] hover:border-teal-400/50 hover:shadow-[0_20px_60px_rgba(34,211,238,0.25)] transition cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">Logins, last 24 hours</h2>
                <p className="text-xs text-slate-400">Hourly login volume across Campus Alpha</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300 border border-emerald-400/40">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
                Live
              </span>
            </div>
            {/* Fake line chart skeleton */}
            <div className="relative mt-3 h-32 rounded-xl bg-gradient-to-b from-teal-500/30 via-teal-500/10 to-transparent overflow-hidden">
              <div className="absolute inset-2 rounded-lg border border-teal-300/20" />
              <div className="absolute inset-x-3 bottom-4 flex items-end justify-between gap-1">
                {[8, 20, 40, 25, 60, 32, 50, 63].map((v, i) => (
                  <div key={i} className="flex-1 flex items-end justify-center">
                    <div className="w-[2px] bg-teal-400/40 h-16 relative">
                      <div
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.9)]"
                        style={{ bottom: `${(v / 70) * 64}px` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
              <span>Peak: 63 logins at 10:00</span>
              <button className="text-amber-300 hover:text-amber-200 underline-offset-2 hover:underline">
                Failed: 12 (tap to filter failed attempts)
              </button>
            </div>
          </div>

          {/* Roles donut */}
          <div className="md:col-span-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)] hover:border-sky-400/50 hover:shadow-[0_20px_60px_rgba(56,189,248,0.3)] transition cursor-pointer flex flex-col">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">Roles breakdown</h2>
            <p className="text-xs text-slate-400 mb-3">Distribution across user base</p>
            <div className="flex flex-1 items-center justify-center">
              <div className="relative h-24 w-24">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-sky-400 to-emerald-400 opacity-70" />
                <div className="absolute inset-[18%] rounded-full bg-slate-950/90 flex flex-col items-center justify-center text-[11px]">
                  <span className="font-semibold">234 users</span>
                  <span className="text-amber-300 mt-0.5">12% admin</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
              <button className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/40">
                Admin
              </button>
              <button className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-200 border border-sky-400/40">
                Operator
              </button>
              <button className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/40">
                Viewer
              </button>
            </div>
          </div>

          {/* Risk gauge */}
          <div className="md:col-span-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-[0_18px_45px_rgba(15,23,42,0.7)] hover:border-rose-400/50 hover:shadow-[0_20px_60px_rgba(248,113,113,0.35)] transition cursor-pointer flex flex-col">
            <h2 className="text-sm font-semibold text-slate-100 mb-1">Security posture</h2>
            <p className="text-xs text-slate-400 mb-2">Live risk across users</p>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 rounded-full bg-conic-to-br from-emerald-400 via-amber-400 to-red-500" />
                <div className="absolute inset-[18%] rounded-full bg-slate-950/90 flex flex-col items-center justify-center text-[11px]">
                  <span className="font-semibold text-amber-200">Risk: 72</span>
                  <span className="text-[10px] text-amber-300/90">Elevated</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 text-red-200 border border-red-400/40 px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Locked: 8
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/40 px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  Under review: 5
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Insight cards row */}
        <section className="grid gap-4 md:grid-cols-2 mb-6">
          {/* Sessions */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-md hover:border-teal-400/50 hover:shadow-[0_16px_40px_rgba(45,212,191,0.25)] transition cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100">Active sessions</h3>
              <span className="text-xs text-slate-400">Last 30 minutes</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-50">41</span>
              <span className="text-xs text-emerald-300">+6 vs prev hour</span>
            </div>
            {/* Sparkline skeleton */}
            <div className="mt-3 h-10 rounded-lg bg-teal-500/10 relative overflow-hidden">
              <div className="absolute inset-1 flex items-end gap-1">
                {[10, 40, 20, 50, 35, 45, 30, 55].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-full bg-teal-400/60"
                    style={{ height: `${20 + (v / 60) * 40}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                3 suspected risky devices
              </span>
              <button className="text-slate-200/90 border border-slate-500/60 rounded-full px-3 py-1 text-[11px] bg-slate-900/40 hover:bg-slate-900/70 transition">
                Terminate risky sessions
              </button>
            </div>
          </div>

          {/* Failed logins */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-md hover:border-rose-400/60 hover:shadow-[0_16px_40px_rgba(248,113,113,0.3)] transition cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100">Failed logins</h3>
              <span className="text-xs text-slate-400">24 hours</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-50">39</span>
              <span className="text-xs text-red-300">+12 vs baseline</span>
            </div>
            {/* Bar chart skeleton */}
            <div className="mt-3 h-10 rounded-lg bg-red-500/10 relative overflow-hidden">
              <div className="absolute inset-1 flex items-end gap-1">
                {[5, 10, 2, 15, 12, 7, 18, 10].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[6px] bg-red-400/70"
                    style={{ height: `${15 + (v / 20) * 45}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-600/80 font-mono text-[10px]">
                Top source: 192.0.2.14
              </span>
            </div>
          </div>

          {/* Exports & dangerous actions */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-md hover:border-sky-400/60 hover:shadow-[0_16px_40px_rgba(56,189,248,0.35)] transition cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100">
                Exports &amp; dangerous actions
              </h3>
              <span className="flex -space-x-1">
                <span className="h-5 w-5 rounded-full bg-sky-400/30 border border-sky-300/60 text-[10px] flex items-center justify-center">
                  ↓
                </span>
                <span className="h-5 w-5 rounded-full bg-amber-400/40 border border-amber-300/70 text-[10px] flex items-center justify-center">
                  !
                </span>
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <p className="text-xs text-slate-400">CSV exports</p>
                <p className="text-xl font-semibold text-slate-50">12 today</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Dangerous clicks</p>
                <p className="text-sm font-semibold text-amber-300">3</p>
              </div>
            </div>
            <button className="mt-3 text-xs text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline">
              Review audit log →
            </button>
          </div>

          {/* Temporary elevation */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 shadow-md hover:border-amber-400/60 hover:shadow-[0_16px_40px_rgba(251,191,36,0.35)] transition cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-100">Temporary elevation</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-100 text-[11px] border border-amber-300/40">
                Temporary admins: 4
              </span>
            </div>
            {/* Timeline bar */}
            <div className="mt-3 h-10 rounded-lg bg-slate-900/60 border border-slate-600/60 relative overflow-hidden">
              <div className="absolute inset-x-4 top-1/2 h-px bg-gradient-to-r from-emerald-400 via-amber-300 to-red-400" />
              <div className="absolute inset-x-4 top-1/2 flex justify-between text-[9px] text-slate-300">
                {["1h", "3h", "6h", "12h"].map((label, idx) => (
                  <div key={idx} className="flex flex-col items-center -translate-y-1.5">
                    <span className="h-2 w-[2px] bg-slate-300 rounded-full" />
                    <span className="mt-1">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="mt-3 text-xs rounded-full border border-red-400/60 bg-red-500/10 px-3 py-1 text-red-200 hover:bg-red-500/20 transition">
              Revoke all early
            </button>
          </div>
        </section>

        {/* Bottom: lethal control zone */}
        <section className="rounded-3xl bg-slate-950/70 border border-slate-700/60 backdrop-blur-xl shadow-[0_24px_70px_rgba(15,23,42,0.9)] p-4 md:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
            {/* User table side */}
            <div className="flex flex-col">
              {/* Table top bar */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 flex items-center rounded-full bg-slate-900/80 border border-slate-600/80 px-3 py-1.5 text-xs text-slate-200">
                    <FiSearch className="h-4 w-4 text-slate-400 mr-2" />
                    <input
                      className="bg-transparent outline-none flex-1 placeholder:text-slate-500 text-xs"
                      placeholder="Search users by name, email, role, IP…"
                    />
                    <span className="hidden sm:inline text-[10px] text-slate-500 font-mono">
                      /
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-600/70">
                    Role: Any
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-600/70">
                    Status: Any
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-600/70">
                    Risk: Any
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/70 border border-slate-600/70">
                    Last seen: 7d
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2 text-[11px] text-slate-400">
                <span>Showing 50 of 234 users</span>
                <button
                  className={`px-2.5 py-1 rounded-full border text-[11px] ${
                    selectedIds.size === 0
                      ? "border-slate-700 text-slate-600 cursor-not-allowed"
                      : "border-slate-400 text-slate-100 bg-slate-900/60"
                  }`}
                  disabled={selectedIds.size === 0}
                >
                  Bulk actions ▾
                </button>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/70">
                <div className="max-h-[360px] overflow-auto custom-scroll">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-900/90 sticky top-0 z-10">
                      <tr className="text-[11px] text-slate-400 uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleSelectAll}
                            className="h-3 w-3 rounded border-slate-500 bg-slate-900"
                          />
                        </th>
                        <th className="px-3 py-2 text-left">User</th>
                        <th className="px-3 py-2 text-left">Role</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Last login</th>
                        <th className="px-3 py-2 text-left">Sessions</th>
                        <th className="px-3 py-2 text-left">IP / Device</th>
                        <th className="px-3 py-2 text-left">Failed</th>
                        <th className="px-3 py-2 text-left">Risk</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockUsers.map((user) => {
                        const selected = selectedIds.has(user.id);
                        const isActive = selectedUser?.id === user.id;
                        return (
                          <tr
                            key={user.id}
                            className={`border-t border-slate-800/60 cursor-pointer group ${
                              isActive ? "bg-slate-900/80" : "hover:bg-slate-900/60"
                            }`}
                            onClick={() => setSelectedUser(user)}
                          >
                            <td className="px-3 py-2 align-top">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleRowSelection(user.id);
                                }}
                                className="h-3 w-3 rounded border-slate-500 bg-slate-900"
                              />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="flex flex-col">
                                <span className="text-[13px] font-medium text-slate-100">
                                  {user.name}
                                </span>
                                <span className="text-[11px] text-slate-400">{user.email}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${roleColors[user.role]}`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] ${statusColors[user.status]}`}
                              >
                                {user.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top text-[11px] text-slate-300">
                              {user.lastLogin}
                            </td>
                            <td className="px-3 py-2 align-top text-[11px] text-slate-300">
                              {user.sessions} devices
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span className="inline-flex items-center rounded-full bg-slate-900/80 border border-slate-600/80 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                                {user.ip}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] ${
                                  user.failedAttempts > 3
                                    ? "bg-red-500/20 text-red-200 border border-red-400/50"
                                    : "bg-slate-800/80 text-slate-200 border border-slate-600/80"
                                }`}
                              >
                                {user.failedAttempts}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-200">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${riskDotColors[user.risk]}`}
                                />
                                {user.risk}
                              </span>
                            </td>
                            <td className="px-3 py-2 align-top text-right">
                              <button className="text-slate-400 hover:text-slate-200">
                                <FiMoreVertical className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Inspector side */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-700/80 p-4 flex flex-col">
              {selectedUser ? (
                <>
                  {/* Identity */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-xs font-semibold text-slate-950">
                            {selectedUser.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-50">
                              {selectedUser.name}
                            </p>
                            <p className="text-[11px] text-slate-400">{selectedUser.email}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                          <span
                            className={`px-2 py-0.5 rounded-full ${roleColors[selectedUser.role]}`}
                          >
                            {selectedUser.role}
                          </span>
                          <span className={`${statusColors[selectedUser.status]} px-2 py-0.5`}>
                            {selectedUser.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-600/80 text-slate-300">
                            Campus Alpha • Org tenant
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 text-right">
                        Created: 2024-09-01
                      </span>
                    </div>

                    {/* Risk indicator */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1 text-[11px]">
                        <span className="text-slate-300">Risk</span>
                        <span className="text-amber-300">
                          High (failed logins from 3 IPs)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500" />
                      </div>
                    </div>
                  </div>

                  {/* Power actions */}
                  <div className="mb-4 grid grid-cols-2 gap-2 text-[11px]">
                    <button className="rounded-xl border border-slate-600/80 bg-slate-900/80 px-3 py-2 text-left hover:border-teal-400/60 hover:bg-slate-900 transition">
                      <p className="font-semibold text-slate-100">Promote / Demote</p>
                      <p className="text-[10px] text-slate-400">Adjust role &amp; scope</p>
                    </button>
                    <button className="rounded-xl border border-red-500/60 bg-red-500/10 px-3 py-2 text-left hover:bg-red-500/20 transition">
                      <p className="font-semibold text-red-100">Lock / Unlock account</p>
                      <p className="text-[10px] text-red-200/80">Requires confirmation</p>
                    </button>
                    <button className="rounded-xl border border-slate-600/80 bg-slate-900/80 px-3 py-2 text-left hover:border-slate-300/70 hover:bg-slate-900 transition">
                      <p className="font-semibold text-slate-100">Force password reset</p>
                      <p className="text-[10px] text-slate-400">
                        Next login requires new password
                      </p>
                    </button>
                    <button
                      className={`rounded-xl border px-3 py-2 text-left ${
                        viewAsUserId === selectedUser.id
                          ? "border-amber-400 bg-amber-400/10 text-amber-100"
                          : "border-teal-400/70 bg-slate-900/80 text-teal-200 hover:bg-slate-900"
                      }`}
                      onClick={handleViewAsToggle}
                    >
                      <p className="font-semibold">
                        {viewAsUserId === selectedUser.id ? "Exit view-as" : "View as this user"}
                      </p>
                      <p className="text-[10px]">
                        Impersonate safely • All actions logged
                      </p>
                    </button>
                  </div>

                  {/* Activity timeline */}
                  <div className="flex-1 overflow-auto custom-scroll">
                    <h4 className="text-xs font-semibold text-slate-200 mb-2">
                      Activity timeline
                    </h4>
                    <div className="relative pl-3">
                      <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-700/70" />
                      <div className="space-y-3 text-[11px]">
                        <div className="relative flex gap-3">
                          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                          <div>
                            <p className="text-slate-100">
                              Logged in from Chrome on Windows
                            </p>
                            <p className="text-slate-400 text-[10px]">10:02</p>
                          </div>
                        </div>
                        <div className="relative flex gap-3">
                          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
                          <div>
                            <p className="text-slate-100">
                              Failed login (password)
                            </p>
                            <p className="text-slate-400 text-[10px]">09:58</p>
                          </div>
                        </div>
                        <div className="relative flex gap-3">
                          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-sky-400" />
                          <div>
                            <p className="text-slate-100">
                              Role changed: Operator → Admin by you
                            </p>
                            <p className="text-slate-400 text-[10px]">Yesterday</p>
                          </div>
                        </div>
                        <div className="relative flex gap-3">
                          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-400" />
                          <div>
                            <p className="text-slate-100">
                              Account locked
                            </p>
                            <p className="text-slate-400 text-[10px]">2 days ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  Select a user from the table to inspect activity.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* simple custom scrollbars (optional, Tailwind add in globals) */}
    </div>
  );
};

export default UserRoleCommandSurface;
