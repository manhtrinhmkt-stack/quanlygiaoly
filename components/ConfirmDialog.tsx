import React from 'react';
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  type = 'danger',
}) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <ShieldAlert size={24} className="text-red-600" />,
      iconBg: 'bg-red-50',
      confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-100 focus:ring-red-500',
      titleColor: 'text-red-800',
    },
    warning: {
      icon: <AlertTriangle size={24} className="text-amber-600" />,
      iconBg: 'bg-amber-50',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-100 focus:ring-amber-500',
      titleColor: 'text-amber-800',
    },
    info: {
      icon: <Info size={24} className="text-blue-600" />,
      iconBg: 'bg-blue-50',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 focus:ring-blue-500',
      titleColor: 'text-blue-800',
    },
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden scale-in-center">
        {/* Close Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-4">
            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${config.iconBg}`}>
              {config.icon}
            </div>
            <div className="flex-1">
              <h3 className={`text-base font-bold ${config.titleColor} mb-2`}>
                {title}
              </h3>
              <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.15s ease-out forwards; }
        .scale-in-center { animation: scale-in 0.15s ease-out forwards; }
      `}</style>
    </div>
  );
};
