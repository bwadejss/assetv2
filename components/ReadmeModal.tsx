import React from 'react';
import { X, Info, ShieldCheck, Zap } from 'lucide-react';

interface ReadmeModalProps {
  onClose: () => void;
  darkMode: boolean;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-md max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl transition-all border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b sticky top-0 flex items-center justify-between ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'} backdrop-blur-md`}>
          <div className="flex items-center gap-2">
            <Info className="text-blue-500" />
            <h2 className="font-black text-sm uppercase tracking-widest">Audit System Guide</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 text-slate-400 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <ShieldCheck size={20} />
              <h3 className="font-black text-xs uppercase tracking-widest">Site Compliance % (Breadth)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Measures the <strong>maintenance compliance</strong> across the site. It shows what portion of the checked population had zero defects.
            </p>
            <div className={`p-3 rounded-xl font-mono text-xs ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-50 text-emerald-700'}`}>
              (Total Pass Clicks / Total Assets Checked) * 100
            </div>
            <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'} italic`}>
              Note: This asks "Did the machine pass or fail?". Multiple defects on one machine still only count as one failed asset.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-blue-500">
              <Zap size={20} />
              <h3 className="font-black text-xs uppercase tracking-widest">SIS Score (Depth)</h3>
            </div>
            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Measures <strong>Defect Density</strong>. It represents the average number of physical defects found per asset checked.
            </p>
            <div className={`p-3 rounded-xl font-mono text-xs ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-slate-50 text-blue-700'}`}>
              Total Sum of Defects / Total Assets Checked
            </div>
            <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Risk levels (Low/Med/Hi) are recorded for reporting priority but do not affect the mathematical SIS calculation.
            </p>
          </section>

          <div className={`p-4 rounded-2xl border flex gap-3 ${darkMode ? 'bg-blue-900/10 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
             <Info className="shrink-0" size={18} />
             <p className="text-[11px] font-bold leading-tight">
               SIS targets 0.000. Higher scores indicate a high density of issues on specific equipment, even if the overall compliance % is high.
             </p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800/50">
          <button onClick={onClose} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};