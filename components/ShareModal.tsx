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

  // Use a persistent click listener on a stable ref
  useEffect(() => {
    const btn = shareButtonRef.current;
    if (!btn) return;

    const handleShareClick = async (e: MouseEvent) => {
      // Direct, immediate response to user interaction
      const file = preparedFileRef.current;
      
      if (!file) {
        // If file isn't ready, let the React state handle the UI, 
        // but this shouldn't happen for the 'READY' button.
        return;
      }

      if (!navigator.share) {
        handleDownload();
        return;
      }

      try {
        // Verify if OS actually allows sharing this specific file instance
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          // Sync-like call: No awaits before the share trigger
          await navigator.share({ 
            files: [file]
          });
          onClose();
        } else {
          throw new Error("OS_REJECTED_FILE_TYPE");
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("Android Share Failed:", err);
        
        // Final fallback: Always download if share fails
        handleDownload();
        setError(`System blocked share (${err.name}). Document saved to your Downloads folder.`);
        setStage('ERROR');
      }
    };

    btn.addEventListener('click', handleShareClick);
    return () => btn.removeEventListener('click', handleShareClick);
  }, [isOpen]); // Only re-bind if modal re-opens

  if (!isOpen) return null;

  const handlePrepare = async () => {
    setStage('GENERATING');
    setError(null);
    try {
      const blob = await generateInspectionWordDoc(data);
      
      // We create the File object HERE, in the background.
      const prefix = data.config.exportPathPrefix || 'AUDIT';
      const site = data.siteName.replace(/[^a-z0-9]/gi, '_');
      const filename = `${prefix}_${site}.docx`;
      
      preparedFileRef.current = new File([blob], filename, { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      setStage('READY');
    } catch (err: any) {
      setError("Document build failed.");
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
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Android Export</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Always render both buttons, hide based on stage. 
              This keeps the DOM structure stable for the system's gesture tracking. */}
          
          <div className={stage === 'IDLE' ? 'block' : 'hidden'}>
            <div className="text-center space-y-2 mb-6">
              <p className="text-sm font-bold opacity-80 uppercase tracking-tight">Step 1: Assemble Report</p>
              <p className="text-[10px] uppercase tracking-widest opacity-50 italic px-4">Wait for the green "Ready" state before sharing.</p>
            </div>
            <button 
              onClick={handlePrepare}
              className="w-full p-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-4 transition-all active:scale-95 shadow-lg"
            >
              <div className="bg-white/20 p-2.5 rounded-xl"><Loader2 size={20} className="text-white" /></div>
              <div className="text-left">
                <div className="font-black text-sm uppercase tracking-tight">Generate File</div>
                <div className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Compiling Photos...</div>
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
            <div className="py-4 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-emerald-500">Step 2: Ready to Send</p>
                <p className="text-[10px] opacity-50 font-bold uppercase mt-1">Tap below to open Teams/Outlook</p>
              </div>

              <div className="w-full space-y-3">
                <button 
                  ref={shareButtonRef}
                  className="w-full py-5 rounded-2xl bg-indigo-600 text-white flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all"
                >
                  <Send size={18} /> OPEN SHARE MENU
                </button>

                <button 
                  onClick={handleDownload}
                  className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-[10px] tracking-widest transition-all ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}
                >
                  <Download size={14} /> DOWNLOAD AS BACKUP
                </button>
              </div>
            </div>
          </div>

          {stage === 'ERROR' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${darkMode ? 'bg-red-950/20 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <AlertCircle size={20} className="shrink-0 text-red-500" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-tight">Permission Warning</p>
                  <p className="text-[10px] opacity-80 leading-relaxed">{error}</p>
                </div>
              </div>
              <button onClick={reset} className="w-full py-4 text-[10px] font-black uppercase tracking-widest bg-slate-700 text-white rounded-xl shadow-lg active:scale-95">
                Reset & Try Again
              </button>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-slate-700 bg-slate-850' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-start gap-2 mb-4 opacity-60">
            <Info size={12} className="shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold leading-tight uppercase">
              Notice: Browsers cannot choose specific folders. Files always go to your system "Downloads" folder.
            </p>
          </div>
          <button onClick={onClose} className="w-full py-2 text-xs font-black uppercase tracking-widest opacity-60">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};