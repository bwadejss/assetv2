import React, { useState } from 'react';
import { InspectionData, calculateCompliance } from '../types.ts';
import { X, Mail, MessageSquare, Share2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { generateInspectionWordDoc } from '../services/docGenerator.ts';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InspectionData;
  darkMode: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data, darkMode }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShareReport = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const blob = await generateInspectionWordDoc(data);
      const filename = `${data.siteName}_Audit_${data.date.replace(/\//g, '-')}.docx`;
      const file = new File([blob], filename, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

      // Check if the system supports file sharing
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Audit Report: ${data.siteName}`,
          text: `Professional audit report for ${data.siteName} conducted on ${data.date}.`
        });
        onClose();
      } else {
        // Fallback for browsers that don't support file sharing
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        setError("System sharing not supported. Report downloaded instead. Please attach manually to your message.");
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
    } catch (err) {
      console.error("Sharing failed", err);
      setError("Failed to generate report for sharing.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Share Full Report</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Select Destination App</p>
          
          <button 
            disabled={isGenerating}
            onClick={handleShareReport}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 disabled:opacity-50 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
          >
            <div className="bg-blue-500 p-2.5 rounded-xl">
              <Mail size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-sm uppercase tracking-tight">Outlook</div>
              <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Send full report as attachment</div>
            </div>
          </button>

          <button 
            disabled={isGenerating}
            onClick={handleShareReport}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 disabled:opacity-50 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
          >
            <div className="bg-indigo-600 p-2.5 rounded-xl">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-sm uppercase tracking-tight">Microsoft Teams</div>
              <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Share to Chat / Channel</div>
            </div>
          </button>

          {isGenerating && (
            <div className="flex items-center justify-center gap-2 p-4 text-blue-500 animate-pulse">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Assembling Document...</span>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 border ${darkMode ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <button 
            onClick={onClose} 
            className="w-full py-4 text-xs font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};