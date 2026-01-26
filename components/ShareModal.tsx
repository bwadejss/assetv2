import React, { useState, useRef, useEffect } from 'react';
import { InspectionData } from '../types.ts';
import { X, FileText, Loader2, AlertCircle, CheckCircle2, Download, Info, FolderDown } from 'lucide-react';
import { generateInspectionWordDoc } from '../services/docGenerator.ts';
import { APP_VERSION } from '../App.tsx';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InspectionData;
  darkMode: boolean;
}

type ShareStage = 'IDLE' | 'GENERATING' | 'SUCCESS' | 'ERROR';

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data, darkMode }) => {
  const [stage, setStage] = useState<ShareStage>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  
  const preparedFileRef = useRef<File | null>(null);

  if (!isOpen) return null;

  const handleTriggerDownload = (file: File) => {
    try {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error("Manual download trigger failed", err);
    }
  };

  const handleGenerateAndDownload = async () => {
    setStage('GENERATING');
    setError(null);
    try {
      const blob = await generateInspectionWordDoc(data);
      const prefix = data.config.exportPathPrefix || 'AUDIT';
      const site = data.siteName.replace(/[^a-z0-9]/gi, '_');
      const fname = `${prefix}_${site}_${APP_VERSION}.docx`;
      
      const file = new File([blob], fname, { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      preparedFileRef.current = file;
      setFilename(fname);
      
      // Step 1: Trigger the standard download immediately
      handleTriggerDownload(file);
      
      // Step 2: Update UI to Success
      setStage('SUCCESS');
    } catch (err: any) {
      console.error("Generation Error:", err);
      setError("Document compilation failed. Check logs for details.");
      setStage('ERROR');
    }
  };

  const reset = () => {
    setStage('IDLE');
    preparedFileRef.current = null;
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md transition-all">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border animate-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-5 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Report Generator</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6">
          {stage === 'IDLE' && (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-blue-600/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20">
                <FileText size={32} className="text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight">Ready to Export</h3>
                <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">This will save a .docx to your device</p>
              </div>
              <button 
                onClick={handleGenerateAndDownload}
                className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
              >
                Start Download
              </button>
            </div>
          )}

          {stage === 'GENERATING' && (
            <div className="py-10 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <Loader2 size={48} className="text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                </div>
              </div>
              <p className="text-xs font-black uppercase tracking-widest animate-pulse">Encoding Images & Data...</p>
            </div>
          )}

          {stage === 'SUCCESS' && (
            <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in-95">
              <div className="bg-emerald-500/10 p-6 rounded-full border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <CheckCircle2 size={48} className="text-emerald-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-tight text-emerald-500">Success!</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-relaxed">
                  File saved to your system's <span className="text-blue-500">Downloads</span> folder.
                </p>
              </div>

              <div className="w-full space-y-3">
                <div className={`p-3 rounded-xl border flex items-center gap-3 text-left ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <FolderDown size={20} className="text-blue-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-black opacity-40 uppercase">Filename</p>
                    <p className="text-[10px] font-bold truncate opacity-80">{filename}</p>
                  </div>
                </div>

                <button 
                  onClick={() => preparedFileRef.current && handleTriggerDownload(preparedFileRef.current)}
                  className={`w-full py-4 rounded-xl border flex items-center justify-center gap-3 font-black text-[10px] tracking-widest active:scale-95 ${darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-600'}`}
                >
                  <Download size={14} /> RE-TRIGGER DOWNLOAD
                </button>
              </div>
            </div>
          )}

          {stage === 'ERROR' && (
            <div className="space-y-6 text-center animate-in fade-in">
              <div className={`p-5 rounded-2xl border flex flex-col items-center gap-4 ${darkMode ? 'bg-red-950/20 border-red-500/20 text-red-200' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <AlertCircle size={32} className="text-red-500" />
                <p className="text-xs font-black leading-relaxed uppercase">{error}</p>
              </div>
              <button onClick={reset} className="w-full py-4 text-xs font-black uppercase tracking-widest bg-slate-800 text-white rounded-xl active:scale-95">
                Retry Generation
              </button>
            </div>
          )}
        </div>

        <div className={`p-6 border-t ${darkMode ? 'border-slate-700 bg-slate-850' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-start gap-3 opacity-60">
            <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
            <p className="text-[9px] font-bold leading-tight uppercase tracking-tight">
              Standard downloads bypass Android system permissions. If the download doesn't start, check your browser's "Downloads" history.
            </p>
          </div>
          <button onClick={onClose} className="w-full mt-4 py-2 text-xs font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};