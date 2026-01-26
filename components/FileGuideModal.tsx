import React from 'react';
import { X, Share2, FolderOpen, Download, MonitorSmartphone, Info, ExternalLink } from 'lucide-react';

interface FileGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastFilename: string | null;
  onDownloadAgain: () => void;
  darkMode: boolean;
}

export const FileGuideModal: React.FC<FileGuideModalProps> = ({ isOpen, onClose, lastFilename, onDownloadAgain, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'bg-slate-850/50' : 'bg-blue-50/50'}`}>
          <div className="flex items-center gap-2 text-blue-500">
            <MonitorSmartphone size={18} />
            <h2 className="text-xs font-black uppercase tracking-widest text-blue-500">How to Share Report</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-100'}`}>
            <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold leading-relaxed">
              To send the file to your <span className="text-blue-500 uppercase font-black">Work Profile</span> Teams or Outlook:
            </p>
          </div>

          <div className="space-y-4 px-1">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-xs">1</div>
              <div>
                <p className="text-xs font-semibold leading-relaxed">
                  Use the <strong>SHARE REPORT</strong> button on the dashboard.
                </p>
                <p className="text-[10px] opacity-60 mt-1">This opens the Android system menu directly.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-xs">2</div>
              <div>
                <p className="text-xs font-semibold leading-relaxed">
                  Select <span className="text-blue-500 font-black">TEAMS</span> or <span className="text-blue-500 font-black">OUTLOOK</span> from the list.
                </p>
                <p className="text-[10px] opacity-60 mt-1">The system will show your Work apps automatically.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-xs">3</div>
              <div>
                <p className="text-xs font-semibold leading-relaxed">
                  If you need the file manualy:
                </p>
                <p className="text-[10px] opacity-60 mt-1 italic">Go to Browser Settings > Downloads to find the raw file.</p>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-[9px] font-black uppercase opacity-50 mb-1">Current Document</p>
            <p className="text-xs font-mono break-all text-blue-500">{lastFilename || 'site_report.docx'}</p>
          </div>

          <div className="pt-2 space-y-2">
            <button 
              onClick={onDownloadAgain}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={16} /> SHARE TO TEAMS / OUTLOOK
            </button>
            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
            >
              Close Guide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};