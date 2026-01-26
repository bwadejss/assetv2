import React, { useState, useRef, useLayoutEffect } from 'react';
import { InspectionData } from '../types.ts';
import { X, Share2, Loader2, AlertCircle, Send, CheckCircle2, Download, Info, ShieldAlert } from 'lucide-react';
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
  const [isSandbox, setIsSandbox] = useState(false);
  
  const preparedFileRef = useRef<File | null>(null);
  const nativeBtnRef = useRef<HTMLButtonElement>(null);

  // Detect sandbox environments (like the preview window)
  useLayoutEffect(() => {
    if (window.self !== window.top) {
      setIsSandbox(true);
    }
  }, []);

  // Use a raw native listener to guarantee "User Activation" for navigator.share
  useLayoutEffect(() => {
    const btn = nativeBtnRef.current;
    if (!btn || stage !== 'READY') return;

    const handleHardClick = () => {
      const file = preparedFileRef.current;
      if (!file) return;

      if (!navigator.share) {
        handleDownload();
        return;
      }

      const shareData = {
        files: [file],
        title: 'Inspection Report',
        text: `Report for ${data.siteName}`
      };

      // Direct call - no promises/async before this line
      navigator.share(shareData).then(() => {
        onClose();
      }).catch((err) => {
        if (err.name === 'AbortError') return;
        console.error("Native Share Fail:", err);
        handleDownload();
        setError(`System Block: ${err.message}. Saving to Downloads instead.`);
        setStage('ERROR');
      });
    };

    btn.addEventListener('click', handleHardClick);
    return () => btn.removeEventListener('click', handleHardClick);
  }, [stage, isOpen]);

  if (!isOpen) return null;

  const handlePrepare = async () => {
    setStage('GENERATING');
    setError(null);
    try {
      const blob = await generateInspectionWordDoc(data);
      const prefix = data.config.exportPathPrefix || 'AUDIT';
      const site = data.siteName.replace(/[^a-z0-9]/gi, '_');
      const filename = `${prefix}_${site}.docx`;
      
      const file = new File([blob], filename, { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      // Verify if the system can actually share this specific file
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        console.warn("MIME type potentially unsupported for sharing");
      }
      
      preparedFileRef.current = file;
      setStage('READY');
    } catch (err: any) {
      setError("Document generation failed.");
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

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Export Report</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {isSandbox && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 ${darkMode ? 'bg-amber-900/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-tight uppercase">
                Preview Sandbox detected. Native Sharing will only work on a real device.
              </p>
            </div>
          )}

          {stage === 'IDLE' && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <button 
                onClick={handlePrepare}
                className="w-full p-8 rounded-2xl bg-blue-600 text-white flex flex-col items-center gap-3 shadow-lg active:scale-95 transition-transform"
              >
                <div className="bg-white/20 p-3 rounded-2xl"><Loader2 size={24} /></div>
                <div className="text-center">
                  <div className="font-black text-sm uppercase tracking-widest">Compile Document</div>
                  <div className="text-[9px] opacity-60 font-black uppercase tracking-[0.2em] mt-1">Processing photos...</div>
                </div>
              </button>
            </div>
          )}

          {stage === 'GENERATING' && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <Loader2 size={48} className="text-blue-500 animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest animate-pulse">Building .docx File</p>
            </div>
          )}

          {stage === 'READY' && (
            <div className="py-2 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95">
              <div className="bg-emerald-500/10 p-5 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              
              <div className="w-full space-y-3">
                <button 
                  ref={nativeBtnRef}
                  className="w-full py-5 rounded-2xl bg-indigo-600 text-white flex items-center justify-center gap-3 font-black text-sm tracking-widest shadow-xl active:scale-95"
                >
                  <Send size={18} /> SEND REPORT
                </button>

                <button 
                  onClick={handleDownload}
                  className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-[10px] tracking-widest ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                >
                  <Download size={14} /> DOWNLOAD LOCAL COPY
                </button>
              </div>
            </div>
          )}

          {stage === 'ERROR' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${darkMode ? 'bg-red-950/20 border-red-500/20 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <AlertCircle size={20} className="shrink-0 text-red-500" />
                <p className="text-[10px] font-bold leading-relaxed">{error}</p>
              </div>
              <button onClick={() => setStage('IDLE')} className="w-full py-4 text-[10px] font-black uppercase tracking-widest bg-slate-700 text-white rounded-xl active:scale-95">
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-slate-700 bg-slate-850' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-start gap-2 opacity-50">
            <Info size={12} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold leading-tight uppercase">
              Notice: Sharing works best with Teams, Outlook, and Gmail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};