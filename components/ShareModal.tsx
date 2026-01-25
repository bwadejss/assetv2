import React, { useState } from 'react';
import { InspectionData } from '../types.ts';
import { X, Mail, MessageSquare, Share2, Loader2, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
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
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetApp, setTargetApp] = useState<'Outlook' | 'Teams' | null>(null);

  if (!isOpen) return null;

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'site_report';
  };

  const handlePrepare = async (app: 'Outlook' | 'Teams') => {
    setTargetApp(app);
    setStage('GENERATING');
    setError(null);
    
    try {
      // 1. Generate the heavy document first
      const blob = await generateInspectionWordDoc(data);
      const safeName = sanitizeFilename(data.siteName);
      const filename = `${safeName}_audit_${data.date.replace(/\//g, '-')}.docx`;
      const file = new File([blob], filename, { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });

      setPreparedFile(file);
      setStage('READY');
    } catch (err: any) {
      console.error("Generation failed", err);
      setError("Failed to generate report document.");
      setStage('ERROR');
    }
  };

  const handleFinalShare = async () => {
    if (!preparedFile) return;

    try {
      const canShare = navigator.canShare && navigator.canShare({ files: [preparedFile] });

      if (canShare) {
        await navigator.share({
          files: [preparedFile],
          title: `Audit Report: ${data.siteName}`,
          text: `Professional audit report for ${data.siteName} (${data.siteType}).`
        });
        onClose();
      } else {
        // Fallback for desktop or unsupported browsers
        const url = URL.createObjectURL(preparedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = preparedFile.name;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setError("System sharing not supported. File downloaded instead.");
        setStage('ERROR');
      }
    } catch (shareError: any) {
      if (shareError.name === 'AbortError') return;
      console.error("Share API failed", shareError);
      setError("The share sheet was blocked or failed. Please try again or download.");
      setStage('ERROR');
    }
  };

  const reset = () => {
    setStage('IDLE');
    setPreparedFile(null);
    setError(null);
    setTargetApp(null);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Share Report</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {stage === 'IDLE' && (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Choose Destination</p>
              
              <button 
                onClick={() => handlePrepare('Outlook')}
                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
              >
                <div className="bg-blue-500 p-2.5 rounded-xl">
                  <Mail size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-black text-sm uppercase tracking-tight">Outlook</div>
                  <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Prepare for Email</div>
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
                  <div className="font-black text-sm uppercase tracking-tight">Teams</div>
                  <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Prepare for Chat</div>
                </div>
              </button>
            </>
          )}

          {stage === 'GENERATING' && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Loader2 size={48} className="text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Share2 size={16} className="text-blue-500/50" />
                </div>
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest">Assembling Report</p>
                <p className="text-[10px] opacity-50 font-bold uppercase mt-1">Processing photos and metadata...</p>
              </div>
            </div>
          )}

          {stage === 'READY' && (
            <div className="py-6 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase tracking-widest">Report Prepared</p>
                <p className="text-[10px] opacity-50 font-bold uppercase">Ready to send to {targetApp}</p>
              </div>

              <button 
                onClick={handleFinalShare}
                className={`w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all animate-bounce`}
              >
                <Send size={18} /> SEND TO {targetApp?.toUpperCase()}
              </button>
              
              <button 
                onClick={reset}
                className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 underline decoration-dotted"
              >
                Start Over
              </button>
            </div>
          )}

          {stage === 'ERROR' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl flex items-start gap-3 border ${darkMode ? 'bg-red-950/20 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-tight">Share Action Failed</p>
                  <p className="text-[10px] font-bold opacity-80 leading-relaxed">{error}</p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest bg-slate-500/10 rounded-xl hover:bg-slate-500/20 transition-colors"
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
            {stage === 'READY' ? 'Cancel' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};