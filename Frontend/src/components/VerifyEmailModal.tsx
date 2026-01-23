import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

type Props = {
  open: boolean;
  onClose: () => void;
};

const VerifyEmailModal: React.FC<Props> = ({ open, onClose }) => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  if (!open) return null;

  const handleIHaveVerified = async () => {
    await refreshUser();
    if (user?.emailVerified) {
      showToast('Email verified. You can now use all features.', 'success');
      onClose();
    } else {
      showToast('Still not verified. Try refreshing after clicking the link.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-[90%] p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Verify your email</h2>
        <p className="text-sm text-gray-600">
          An email was sent to <span className="font-semibold">{user?.email}</span>. 
          Open it and click the verification link, then come back here.
        </p>
        <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
          <li>Check Promotions / Spam if you do not see it.</li>
          <li>If the link expires, request a new verification email from the account page.</li>
        </ul>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleIHaveVerified}
            className="px-4 py-1.5 text-xs rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600"
          >
            I’ve verified my email
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailModal;
