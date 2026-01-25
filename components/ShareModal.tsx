import React, { useState, useRef } from 'react';
import { InspectionData } from '../types.ts';
import { X, Mail, MessageSquare, Share2, Loader2, AlertCircle, Send, CheckCircle2, Download } from 'lucide-react';
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
  const [targetApp, setTargetApp] = useState<'Outlook' | 'Teams' | null>(null);
  
  // Use a ref to store the file across renders without triggering re-renders 
  // or losing the reference during the async transition.
  const preparedFileRef = useRef<File | null>(null);

  if (!isOpen) return null;

  const handlePrepare = async (app: 'Outlook' | 'Teams') => {
    setTargetApp(app);
    setStage('GENERATING');
    setError(null);
    
    try {
      // Step 1: Generate the document (The "Heavy" part)
      const blob = await generateInspectionWordDoc(data);
      
      // Use a simple, clean filename for better Android app compatibility
      const filename = `audit_report_${data.siteName.replace(/\s+/g, '_').toLowerCase()}.docx`;
      const file = new File([blob], filename, { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      preparedFileRef.current = file;
      setStage('READY');
    } catch (err: any) {
      console.error("Doc generation failed", err);
      setError("Failed to generate report file.");
      setStage('ERROR');
    }
  };

  const handleFinalShare = () => {
    const file = preparedFileRef.current;
    
    // Safety check for navigator.share
    if (!navigator.share) {
      handleDownload();
      setError("System sharing is not available in this browser. File has been downloaded instead.");
      setStage('ERROR');
      return;
    }

    if (!file) return;

    // CRITICAL for Android: navigator.share MUST be the first call in the handler.
    // We do NOT use 'await' before this call.
    const shareData = {
      files: [file],
      title: 'Site Inspection Report',
      text: `Audit Report for ${data.siteName}`
    };

    // Use .then/.catch instead of async/await to keep the execution stack "clean" 
    // from the browser's perspective of user activation.
    navigator.share(shareData)
      .then(() => {
        onClose();
      })
      .catch((shareError: any) => {
        // AbortError means user just closed the share sheet, which is fine.
        if (shareError.name === 'AbortError') return;
        
        console.error("Android Share API failed", shareError);
        
        // Automatic fallback: If share fails, download it.
        handleDownload();
        
        if (shareError.name === 'NotAllowedError') {
          setError("Permission Denied: The share gesture expired or was blocked. The file has been saved to your 'Downloads' folder instead.");
        } else {
          setError("Sharing failed. The report has been downloaded to your device.");
        }
        setStage('ERROR');
      });
  };

  const handleDownload = () => {
    if (!preparedFileRef.current) return;
    const url = URL.createObjectURL(preparedFileRef.current);
    const link = document.createElement('a');
    link.href = url;
    link.download = preparedFileRef.current.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const reset = () => {
    setStage('IDLE');
    preparedFileRef.current = null;
    setError(null);
    setTargetApp(null);
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
          {stage === 'IDLE' && (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4 text-center">Step 1: Build Document</p>
              
              <button 
                onClick={() => handlePrepare('Outlook')}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
              >
                <div className="bg-blue-500 p-2.5 rounded-xl">
                  <Mail size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-black text-sm uppercase tracking-tight">Prepare for Email</div>
                  <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Builds .docx report</div>
                </div>
              </button>

              <button 
                onClick={() => handlePrepare('Teams')}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
              >
                <div className="bg-indigo-600 p-2.5 rounded-xl">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-black text-sm uppercase tracking-tight">Prepare for Teams</div>
                  <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Builds .docx report</div>
                </div>
              </button>
            </>
          )}

          {stage === 'GENERATING' && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <Loader2 size={48} className="text-blue-500 animate-spin" />
              <div>
                <p className="text-sm font-black uppercase tracking-widest">Processing Data</p>
                <p className="text-[10px] opacity-50 font-bold uppercase mt-1 tracking-tight">Assembling report & photos...</p>
              </div>
            </div>
          )}

          {stage === 'READY' && (
            <div className="py-4 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest text-emerald-500">Report Ready</p>
                <p className="text-[10px] opacity-50 font-bold uppercase tracking-tight">Click below to trigger share sheet</p>
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={handleFinalShare}
                  className={`w-full py-5 rounded-2xl bg-blue-600 text-white flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all`}
                >
                  <Send size={18} /> OPEN SYSTEM SHARE
                </button>

                <button 
                  onClick={handleDownload}
                  className={`w-full py-4 rounded-2xl border flex items-center justify-center gap-3 font-black text-[10px] tracking-widest transition-all ${darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Download size={14} /> DOWNLOAD FILE DIRECTLY
                </button>
              </div>
            </div>
          )}

          {stage === 'ERROR' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${darkMode ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-1 text-left">
                  <p className="text-xs font-black uppercase tracking-tight">Android System Message</p>
                  <p className="text-[10px] font-bold opacity-80 leading-relaxed">{error}</p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white rounded-xl shadow-lg active:scale-95"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <button 
            onClick={onClose} 
            className="w-full py-4 text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};