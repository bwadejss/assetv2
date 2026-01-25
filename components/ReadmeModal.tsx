import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ReadmeModal: React.FC<{ onClose: () => void; darkMode: boolean }> = ({ onClose, darkMode }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl relative ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/10 transition-colors">
          <X size={20} />
        </button>
        
        <div className="p-8 space-y-6">
          <div className="text-center">
            <div className="bg-blue-600/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Audit Guide</h2>
          </div>

          <section className="space-y-4">
            <div className="flex gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg h-fit">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest text-emerald-500">Compliance % (Breadth)</h3>
                <p className="text-sm opacity-80 leading-relaxed mt-1">
                  Tracks what portion of the site assets are condition-satisfactory. 
                  <strong> Goal: 100%</strong>. This measures site-wide coverage.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg h-fit">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-widest text-amber-500">SIS Score (Depth)</h3>
                <p className="text-sm opacity-80 leading-relaxed mt-1">
                  Site Issue Score measures defect density. It represents the average number of defects per inspected asset. 
                  <strong> Goal: 0.000</strong>. High SIS with high Compliance indicates localized but severe failures.
                </p>
              </div>
            </div>
          </section>

          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
            <h4 className="font-black text-[10px] uppercase tracking-[0.2em] mb-2 opacity-50">Separation of Data</h4>
            <p className="text-xs leading-relaxed">
              Non-Maintenance defects (Safety, PPE, Signage) are tracked independently and do not penalize the mechanical SIS or Compliance scores to ensure data purity for engineering teams.
            </p>
          </div>

          <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg">
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};