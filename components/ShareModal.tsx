import React from 'react';
import { InspectionData, calculateCompliance } from '../types.ts';
import { X, Mail, MessageSquare, Share2, Copy, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InspectionData;
  darkMode: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data, darkMode }) => {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen) return null;

  const stats = calculateCompliance(data);
  
  const summaryText = `
*AUDIT SUMMARY: ${data.siteName} (${data.siteType})*
Inspector: ${data.userName}
Date: ${data.date}

- Compliance: ${stats.compliancePercentage}%
- Site Issue Score (SIS): ${stats.siteIssueScore}
- Total Assets Checked: ${stats.totalAssetsChecked}
- Total Defects Found: ${stats.totalMechanicalDefects}

Generated via Industrial Site Inspector.
  `.trim();

  const handleOutlook = () => {
    const subject = encodeURIComponent(`Inspection Report: ${data.siteName}`);
    const body = encodeURIComponent(summaryText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onClose();
  };

  const handleTeams = () => {
    // Teams deep link for a new chat with text
    const encodedText = encodeURIComponent(summaryText);
    const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?users=&message=${encodedText}`;
    window.open(teamsUrl, '_blank');
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Share Summary</h2>
          </div>
          <button onClick={onClose} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Select Platform</p>
          
          <button 
            onClick={handleOutlook}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
          >
            <div className="bg-blue-500 p-2.5 rounded-xl">
              <Mail size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-sm uppercase tracking-tight">Outlook</div>
              <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Send as Email</div>
            </div>
          </button>

          <button 
            onClick={handleTeams}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-50 hover:bg-slate-100'}`}
          >
            <div className="bg-indigo-600 p-2.5 rounded-xl">
              <MessageSquare size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-sm uppercase tracking-tight">Microsoft Teams</div>
              <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Send to Chat / Channel</div>
            </div>
          </button>

          <div className={`mt-6 p-4 rounded-2xl border border-dashed ${darkMode ? 'bg-slate-950/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Text Preview</span>
                <button onClick={handleCopy} className="text-indigo-500 hover:text-indigo-400">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
             </div>
             <pre className="text-[10px] font-mono opacity-60 whitespace-pre-wrap leading-tight">
                {summaryText}
             </pre>
          </div>
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