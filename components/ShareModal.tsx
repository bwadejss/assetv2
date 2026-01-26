import React, { useState, useRef, useEffect } from 'react';
import { InspectionData } from '../types.ts';
import { X, Share2, Loader2, AlertCircle, Send, CheckCircle2, Download, Info } from 'lucide-react';
import { generateInspectionWordDoc } from '../services/docGenerator.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InspectionData;
  darkMode: boolean;
}

type ShareStage = 'IDLE' | 'GENERATING' | 'READY' | 'ERROR';

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data, darkMode }) => {
  const [stage, setStage] = useState<ShareStage>('IDLE');
  const [error, setError] = useState<string | null>(null);
  
  // Ref for the File object to ensure it is ready BEFORE the click
  const preparedFileRef = useRef<File | null>(null);
  const shareButtonRef = useRef<HTMLButtonElement>(null);

  // Sync listener to preserve user activation chain for Android
  useEffect(() => {
    const btn = shareButtonRef.current;
    if (!btn || !isOpen) return;

    const handleShareClick = () => {
      const file = preparedFileRef.current;
      if (!file) return;

      if (!navigator.share) {
        handleDownload();
        return;
      }

      // No 'await' before share - call it instantly
      navigator.share({ 
        files: [file],
        title: file.name
      }).then(() => {
        onClose();
      }).catch((err) => {
        if (err.name === 'AbortError') return;
        console.error("Android Share Failed:", err);
        handleDownload();
        setError(`System block: ${err.message}. Downloaded to local folder instead.`);
        setStage('ERROR');
      });
    };

    btn.addEventListener('click', handleShareClick);
    return () => btn.removeEventListener('click', handleShareClick);
  }, [isOpen, stage]);

  if (!isOpen) return null;

  const handlePrepare = async () => {
    setStage('GENERATING');
    setError(null);
    try {
      const blob = await generateInspectionWordDoc(data);
      const prefix = data.config.exportPathPrefix || 'AUDIT';
      const site = data.siteName.replace(/[^a-z0-9]/gi, '_');
      const filename = `${prefix}_${site}.docx`;
      
      preparedFileRef.current = new File([blob], filename, { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      setStage('READY');
    } catch (err: any) {
      setError("Failed to compile document.");
      setStage('ERROR');
    }
  };

  const handleDownload = () => {
    const file = preparedFileRef.current;
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const reset = () => {
    setStage('IDLE');
    preparedFileRef.current = null;
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Android Export</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className={stage === 'IDLE' ? 'block' : 'hidden'}>
            <div className="text-center space-y-2 mb-6">
              <p className="text-sm font-bold opacity-80 uppercase tracking-tight">Step 1: Build Report</p>
            </div>
            <button 
              onClick={handlePrepare}
              className="w-full p-6 rounded-2xl bg-blue-600 text-white flex items-center gap-4 shadow-lg active:scale-95"
            >
              <Loader2 size={20} className="text-white shrink-0" />
              <div className="text-left">
                <div className="font-black text-sm uppercase tracking-tight">Generate File</div>
                <div className="text-[10px] opacity-60 uppercase font-bold">Compressing Images...</div>
              </div>
            </button>
          </div>

          <div className={stage === 'GENERATING' ? 'block' : 'hidden'}>
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <Loader2 size={48} className="text-blue-500 animate-spin" />
              <p className="text-sm font-black uppercase tracking-widest">Building Document</p>
            </div>
          </div>

          <div className={stage === 'READY' ? 'block' : 'hidden'}>
            <div className="py-4 flex flex-col items-center text-center space-y-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-emerald-500">Step 2: Share</p>
              </div>

              <div className="w-full space-y-3">
                <button 
                  ref={shareButtonRef}
                  className="w-full py-5 rounded-2xl bg-indigo-600 text-white flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] shadow-xl active:scale-95"
                >
                  <Send size={18} /> OPEN SHARE MENU
                </button>

                <button 
                  onClick={handleDownload}
                  className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-[10px] tracking-widest ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                >
                  <Download size={14} /> DOWNLOAD AS BACKUP
                </button>
              </div>
            </div>
          </div>

          {stage === 'ERROR' && (
            <div className="space-y-4 text-center">
              <AlertCircle size={32} className="text-red-500 mx-auto" />
              <p className="text-[10px] opacity-80 uppercase font-bold leading-relaxed px-4">{error}</p>
              <button onClick={reset} className="w-full py-4 text-[10px] font-black uppercase tracking-widest bg-slate-700 text-white rounded-xl">
                Reset
              </button>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-slate-700 bg-slate-850' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-start gap-2 mb-4 opacity-50">
            <Info size={12} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold leading-tight uppercase">
              Notice: Browsers save to "Downloads". Use the Filename Prefix in Settings to stay organized.
            </p>
          </div>
          <button onClick={onClose} className="w-full py-2 text-xs font-black uppercase tracking-widest opacity-40">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};