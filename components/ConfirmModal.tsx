import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  darkMode: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-8 text-center">
          <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight mb-2">{title}</h2>
          <p className="text-sm opacity-60 leading-relaxed">{message}</p>
        </div>
        <div className={`flex border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <button 
            onClick={onClose} 
            className={`flex-1 py-5 font-bold uppercase tracking-widest text-xs border-r transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50 text-slate-500'}`}
          >
            CANCEL
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="flex-1 py-5 font-black uppercase tracking-widest text-xs text-red-500 hover:bg-red-500/10 transition-colors"
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};