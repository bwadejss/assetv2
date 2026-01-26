import React from 'react';
import { BellRing, CheckCircle2, Download, MoreVertical, Share2 } from 'lucide-react';

interface FileGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  lastFilename: string | null;
  darkMode: boolean;
}

export const FileGuideModal: React.FC<FileGuideModalProps> = ({ isOpen, onClose, onRetry, lastFilename, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        <div className="p-6 text-center space-y-4">
          <div className="bg-blue-600/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto">
            <Share2 className="w-7 h-7 text-blue-500" />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-lg font-black uppercase tracking-tight">Manual Sharing</h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 opacity-80">If the share menu didn't open</p>
          </div>

          <div className="space-y-3">
            <div className={`p-4 rounded-2xl border text-left space-y-3 ${darkMode ? 'bg-slate-850 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-[10px]">1</div>
                <p className="text-xs font-bold leading-tight">
                  Open your browser menu (usually 3 dots <span className="font-black">⋮</span> in the top right).
                </p>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-[10px]">2</div>
                <p className="text-xs font-bold leading-tight">
                  Select <span className="font-black">Downloads</span> from the menu list.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-[10px]">3</div>
                <p className="text-xs font-bold leading-tight">
                  Tap the report name and select <span className="text-blue-500 font-black">Share</span> to send it to Teams.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button 
              onClick={onRetry}
              className={`w-full py-4 border rounded-xl font-black text-xs tracking-widest transition-all flex items-center justify-center gap-2 ${darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <Download size={16} /> DOWNLOAD AGAIN
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};