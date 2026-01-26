import React from 'react';
import { BellRing, CheckCircle2 } from 'lucide-react';

interface FileGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastFilename: string | null;
  darkMode: boolean;
}

export const FileGuideModal: React.FC<FileGuideModalProps> = ({ isOpen, onClose, lastFilename, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        <div className="p-8 text-center space-y-6">
          <div className="bg-blue-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
            <BellRing className="w-8 h-8 text-blue-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tight">Report Ready!</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 opacity-80">Check your notifications</p>
          </div>

          <div className={`p-6 rounded-2xl border text-left space-y-4 ${darkMode ? 'bg-slate-850 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-[10px]">1</div>
              <p className="text-xs font-bold leading-relaxed">
                Swipe down from the <span className="text-blue-500">very top</span> of your phone screen.
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-[10px]">2</div>
              <p className="text-xs font-bold leading-relaxed">
                Find the download for <strong>{lastFilename || 'Report.docx'}</strong>.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-[10px]">3</div>
              <p className="text-xs font-bold leading-relaxed">
                Tap <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] uppercase">OPEN</span> or <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] uppercase">DETAILS</span>.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-[10px]">4</div>
              <p className="text-xs font-bold leading-relaxed">
                Select <span className="text-blue-500">Share</span> then choose <span className="font-black">Teams</span> or <span className="font-black">Outlook</span>.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={16} /> I'VE SHARED IT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};