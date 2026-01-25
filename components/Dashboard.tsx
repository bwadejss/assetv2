import React from 'react';
import { AssetCategory, InspectionData, Observation, calculateCompliance, NON_MAINTENANCE_CATEGORY } from '../types.ts';
import { Settings, Info, Zap, Wind, AlertCircle, CheckCircle2, ChevronRight, Minus, Trash2, Edit2, ShieldAlert, Wrench } from 'lucide-react';

interface DashboardProps {
  data: InspectionData;
  onUpdateCompliant: (cat: AssetCategory, delta: number) => void;
  onOpenForm: (cat: AssetCategory, obs?: Observation) => void;
  onDeleteObservation: (id: string) => void;
  darkMode: boolean;
  logDebug: (msg: string) => void;
}

const CATEGORY_META: Record<string, any> = {
  'Pumps': { icon: Wind, color: 'text-sky-500', bg: 'bg-sky-500/10' },
  'Motors': { icon: Settings, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  'Compressors': { icon: Wind, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'Electrical Panels': { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  [NON_MAINTENANCE_CATEGORY]: { icon: ShieldAlert, color: 'text-slate-500', bg: 'bg-slate-500/10' },
};

export const Dashboard: React.FC<DashboardProps> = ({ data, onUpdateCompliant, onOpenForm, onDeleteObservation, darkMode, logDebug }) => {
  const categories = data.config.categories;
  const stats = calculateCompliance(data);
  const config = data.config;

  const sisIsHigh = Number(stats.siteIssueScore) > config.sisThreshold;
  const complianceIsLow = stats.compliancePercentage < config.complianceThreshold;

  return (
    <div className="p-4 space-y-6">
      <div className={`grid grid-cols-2 gap-3 p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="text-center border-r border-slate-700/50">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Site SIS</p>
          <p className={`text-2xl font-black ${sisIsHigh ? 'text-red-500' : (darkMode ? 'text-blue-400' : 'text-blue-600')}`}>
            {stats.siteIssueScore}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Compliance %</p>
          <p className={`text-2xl font-black ${complianceIsLow ? 'text-red-500' : (darkMode ? 'text-emerald-400' : 'text-emerald-600')}`}>
            {stats.compliancePercentage}%
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className={`text-xs font-black uppercase tracking-[0.2em] px-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Asset Inspection
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {categories.map(cat => {
            const Meta = CATEGORY_META[cat] || { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' };
            const compliant = data.compliantCounts[cat] || 0;
            const observations = data.observations.filter(o => o.category === cat);

            return (
              <div key={cat} className={`rounded-2xl p-4 shadow-sm border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${Meta.bg} p-2.5 rounded-xl`}>
                    <Meta.icon className={`w-5 h-5 ${Meta.color}`} />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-tight flex-1 truncate">{cat}</h3>
                  <div className="text-right">
                     <span className="text-[9px] font-black text-slate-500 block uppercase tracking-tighter">Issues</span>
                     <span className={`font-black text-sm ${observations.length > 0 ? 'text-red-500' : (darkMode ? 'text-slate-600' : 'text-slate-300')}`}>
                      {observations.length}
                     </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-[1.5] flex gap-1 h-12">
                    <button 
                      type="button"
                      onClick={() => onUpdateCompliant(cat, 1)}
                      className={`flex-1 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${darkMode ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'bg-emerald-600 text-white'}`}
                    >
                      <CheckCircle2 size={16} /> {compliant} Pass
                    </button>
                    <button 
                      type="button"
                      onClick={() => onUpdateCompliant(cat, -1)}
                      className={`w-12 rounded-xl font-black flex items-center justify-center cursor-pointer ${darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                    >
                      <Minus size={18} />
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onOpenForm(cat)}
                    className={`flex-1 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all border cursor-pointer ${darkMode ? 'bg-red-950/20 border-red-500/30 text-red-400' : 'bg-white border-red-200 text-red-600'}`}
                  >
                    <AlertCircle size={16} /> Log Defect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        type="button"
        onClick={() => onOpenForm(NON_MAINTENANCE_CATEGORY)}
        className={`w-full p-5 rounded-2xl flex items-center justify-between group transition-all shadow-lg border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <div className="font-black text-sm uppercase tracking-tight">Safety / Site Defect</div>
            <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Signage, PPE, Lighting</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Observation History */}
      {data.observations.length > 0 && (
        <div className="space-y-3 pb-12">
          <h2 className={`text-xs font-black uppercase tracking-[0.2em] px-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Defect Log ({data.observations.length})
          </h2>
          <div className="space-y-2">
            {[...data.observations].reverse().map(obs => (
              <div key={obs.id} className={`p-4 rounded-2xl border flex items-center gap-3 shadow-sm relative z-20 overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className={`p-2 rounded-xl border ${darkMode ? 'bg-red-950/20 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                   <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black text-slate-500 uppercase tracking-tighter truncate">{obs.category}</div>
                  <div className="font-black text-sm truncate uppercase tracking-tight">{obs.assetName}</div>
                </div>
                <div className="flex gap-3 relative z-30">
                  <button 
                    type="button"
                    onClick={() => { logDebug(`TRIGGER: Edit Button hit for ${obs.id}`); onOpenForm(obs.category, obs); }} 
                    className={`p-3 rounded-xl transition-colors cursor-pointer ${darkMode ? 'bg-slate-700 text-blue-400 hover:bg-slate-600' : 'bg-blue-50 text-blue-600'}`}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    type="button"
                    onPointerUp={(e) => {
                      logDebug(`TRIGGER: Trash onPointerUp for ${obs.id}`);
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteObservation(obs.id);
                    }} 
                    className={`p-3 rounded-xl transition-colors cursor-pointer relative z-[100] touch-manipulation shadow-md ${darkMode ? 'bg-slate-700 text-red-400 active:bg-red-600 active:text-white' : 'bg-red-50 text-red-600 active:bg-red-600 active:text-white'}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};