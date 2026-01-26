import React, { useState } from 'react';
import { ScoringConfig, AssetCategory } from '../types.ts';
import { X, Sliders, Plus, Trash2, Tag, Terminal } from 'lucide-react';

interface SettingsModalProps {
  config: ScoringConfig;
  onSave: (config: ScoringConfig) => void;
  onClose: () => void;
  darkMode: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose, darkMode }) => {
  const [sis, setSis] = useState(config.sisThreshold);
  const [comp, setComp] = useState(config.complianceThreshold);
  const [categories, setCategories] = useState<AssetCategory[]>([...config.categories]);
  const [debugMode, setDebugMode] = useState(config.debugMode);
  const [newCat, setNewCat] = useState('');

  const addCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat('');
    }
  };

  const removeCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className={`w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}`}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-500/10 transition-colors z-10">
          <X size={20} />
        </button>
        
        <div className="p-6 overflow-y-auto">
          <div className="text-center mb-6">
             <div className="bg-slate-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sliders className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Audit Config</h2>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">SIS Alert Threshold</label>
                <span className="text-sm font-black text-blue-500">{sis.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0" max="2" step="0.05" value={sis} 
                onChange={e => setSis(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Compliance Threshold %</label>
                <span className="text-sm font-black text-emerald-500">{comp}%</span>
              </div>
              <input 
                type="range" min="50" max="100" step="1" value={comp} 
                onChange={e => setComp(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Debug Toggle */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Terminal size={18} className="text-blue-500" />
                <div>
                  <div className="text-xs font-black uppercase tracking-widest">Debug Mode</div>
                  <div className="text-[10px] opacity-60">Live on-screen logging</div>
                </div>
              </div>
              <button 
                onClick={() => setDebugMode(!debugMode)}
                className={`w-12 h-6 rounded-full transition-all relative ${debugMode ? 'bg-blue-600' : 'bg-slate-500/30'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${debugMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-60 block">Category Manager</label>
              <div className="flex gap-2 mb-3">
                <input 
                  type="text" 
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                  placeholder="New Category..."
                  className={`flex-1 p-3 rounded-xl border outline-none text-sm font-medium ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                />
                <button 
                  onClick={addCategory}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-md"
                >
                  <Plus size={20} />
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.map(cat => (
                  <div key={cat} className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2 truncate">
                      <Tag size={12} className="opacity-40" />
                      <span className="text-xs font-bold truncate">{cat}</span>
                    </div>
                    <button onClick={() => removeCategory(cat)} className="text-red-500 p-1 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700/30 flex gap-3">
           <button onClick={onClose} className={`flex-1 py-4 border rounded-xl font-bold ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
            Cancel
          </button>
          <button 
            onClick={() => { onSave({ sisThreshold: sis, complianceThreshold: comp, categories, debugMode }); onClose(); }}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
          >
            Save All
          </button>
        </div>
      </div>
    </div>
  );
};