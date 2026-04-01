import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ShieldCheck, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_BASE } from '../config';

const RoleOnboardingModal: React.FC = () => {
  const { user, token, setUser, login } = useAuth();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'operator'>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || !user.needsRoleSelection) return null;

  const handleConfirmRole = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/update-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update role');
      }

      // Update the local user state with the new role and token
      login(data.user, data.token);
      showToast(`Welcome! Your role is now set to ${selectedRole}.`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative max-w-2xl w-full bg-white rounded-[32px] shadow-2xl border border-orange-100 overflow-hidden"
        >
          {/* Animated Background Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/50 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-100/50 rounded-full blur-3xl -ml-32 -mb-32" />

          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col items-center text-center space-y-4 mb-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Complete your profile</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-md">
                  Welcome to AtmosTrack! To provide the right tools for your research, 
                  please choose your primary access role.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {/* Viewer Role Card */}
              <button
                onClick={() => setSelectedRole('viewer')}
                className={`relative group p-6 rounded-3xl border-2 transition-all duration-300 text-left ${
                  selectedRole === 'viewer'
                    ? 'border-orange-500 bg-orange-50/50 shadow-md scale-[1.02]'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                {selectedRole === 'viewer' && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-6 h-6 text-orange-500 fill-white" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  selectedRole === 'viewer' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Viewer</h3>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                    Monitor live air quality
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-orange-400" />
                    View health alerts
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    Limited data export
                  </li>
                </ul>
              </button>

              {/* Operator Role Card */}
              <button
                onClick={() => setSelectedRole('operator')}
                className={`relative group p-6 rounded-3xl border-2 transition-all duration-300 text-left ${
                  selectedRole === 'operator'
                    ? 'border-amber-500 bg-amber-50/50 shadow-md scale-[1.02]'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                {selectedRole === 'operator' && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 className="w-6 h-6 text-amber-500 fill-white" />
                  </div>
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                  selectedRole === 'operator' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Operator</h3>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    All Viewer features
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    Full data export (CSV)
                  </li>
                  <li className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1 h-1 rounded-full bg-amber-400" />
                    Manage carbon credits
                  </li>
                </ul>
              </button>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleConfirmRole}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Provisioning...' : 'Get Started'}
                <ArrowRight className="w-5 h-5 text-orange-400" />
              </button>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                Action: COMMIT_IDENTITY_TO_ATMOSTRACK_MESH
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RoleOnboardingModal;
