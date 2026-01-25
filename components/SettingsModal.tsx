import React, { useState } from 'react';
import { ScoringConfig } from '../types';
import { X, Save, Settings, RefreshCcw } from 'lucide-react';

interface SettingsModalProps {
  config: ScoringConfig;
  onSave: (config: ScoringConfig) => void;
  onClose: () => void;
  darkMode: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose, darkMode }) => {
  const [localConfig, setLocalConfig] = useState<ScoringConfig>({ ...config });

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  const resetToDefault = () => {
    setLocalConfig({
      sisThreshold: 0.5,
      complianceThreshold: 75
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-md rounded-3xl shadow-2xl transition-all border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <Settings className="text-slate-400" />
            <h2 className="font-black text-sm uppercase tracking-widest">Audit Config</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-500/10 text-slate-400 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em]">Maintenance Thresholds</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">SIS Red Alert</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={localConfig.sisThreshold}
                  onChange={e => setLocalConfig({ ...localConfig, sisThreshold: Number(e.target.value) })}
                  className={`w-full p-3 rounded-xl border outline-none font-black text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Compliance Target %</label>
                <input 
                  type="number" 
                  value={localConfig.complianceThreshold}
                  onChange={e => setLocalConfig({ ...localConfig, complianceThreshold: Number(e.target.value) })}
                  className={`w-full p-3 rounded-xl border outline-none font-black text-center ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
            </div>
          </div>
          <p className={`text-[10px] italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Risk weights (Low/Med/Hi) are now for prioritization only and do not affect scoring.
          </p>
        </div>

        <div className="p-6 border-t border-slate-800/50 flex gap-3">
          <button onClick={resetToDefault} className={`p-4 rounded-2xl font-black uppercase text-[10px] transition-all border flex items-center justify-center gap-2 ${darkMode ? 'border-slate-700 text-slate-500 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}>
            <RefreshCcw size={14} /> Reset
          </button>
          <button onClick={handleSave} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95">
            <Save size={18} /> Apply Config
          </button>
        </div>
      </div>
    </div>
  );
};