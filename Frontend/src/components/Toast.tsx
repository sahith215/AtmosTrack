import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Toast: React.FC = () => {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`
        ${getBgColor()} border rounded-xl p-4 shadow-lg backdrop-blur-md
        flex items-center space-x-3 max-w-sm
      `}>
        {getIcon()}
        <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
        <button
          onClick={hideToast}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;