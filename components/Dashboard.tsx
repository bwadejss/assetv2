
import React from 'react';
import { AssetCategory, InspectionData, Observation } from '../types';
import { Settings, Info, Zap, Wind, AlertCircle, CheckCircle2, ChevronRight, Minus, Trash2, Edit2 } from 'lucide-react';

interface DashboardProps {
  data: InspectionData;
  onUpdateCompliant: (cat: AssetCategory, delta: number) => void;
  onOpenForm: (cat: AssetCategory, obs?: Observation) => void;
  onDeleteObservation: (id: string) => void;
}

const CATEGORY_META = {
  [AssetCategory.PUMPS]: { icon: Wind, color: 'text-blue-600', bg: 'bg-blue-50' },
  [AssetCategory.MOTORS]: { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50' },
  [AssetCategory.COMPRESSORS]: { icon: Wind, color: 'text-green-600', bg: 'bg-green-50' },
  [AssetCategory.ELECTRICAL_PANELS]: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  [AssetCategory.NON_MAINTENANCE]: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-50' },
};

export const Dashboard: React.FC<DashboardProps> = ({ data, onUpdateCompliant, onOpenForm, onDeleteObservation }) => {
  const categories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 px-1">Asset Loggers</h2>
        <div className="grid grid-cols-1 gap-4">
          {categories.map(cat => {
            const Meta = CATEGORY_META[cat];
            const compliant = data.compliantCounts[cat] || 0;
            const observations = data.observations.filter(o => o.category === cat);

            return (
              <div key={cat} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${Meta.bg} p-2 rounded-lg`}>
                    <Meta.icon className={`w-5 h-5 ${Meta.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-800 flex-1">{cat}</h3>
                  <div className="text-right">
                     <span className="text-[10px] font-bold text-slate-400 block uppercase">Issues</span>
                     <span className="font-bold text-red-600">{observations.length}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 flex gap-1 h-12">
                    <button 
                      onClick={() => onUpdateCompliant(cat, 1)}
                      className="flex-1 bg-green-600 text-white font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> {compliant}
                    </button>
                    <button 
                      onClick={() => onUpdateCompliant(cat, -1)}
                      className="w-12 bg-red-100 text-red-600 font-bold rounded-xl active:scale-95 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4 stroke-[3px]" />
                    </button>
                  </div>
                  <button 
                    onClick={() => onOpenForm(cat)}
                    className="flex-1 bg-white border border-red-200 text-red-600 font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <AlertCircle className="w-4 h-4" /> Log Issue
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button 
        onClick={() => onOpenForm(AssetCategory.NON_MAINTENANCE)}
        className="w-full bg-slate-800 text-white p-5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 p-2 rounded-lg">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-bold">Log Non-Maintenance Issue</div>
            <div className="text-xs opacity-60">Site safety, signage, hygiene</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Observation History / Edit Section */}
      {data.observations.length > 0 && (
        <div className="space-y-3 pb-4">
          <h2 className="text-lg font-bold text-slate-800 px-1">Logged Observations ({data.observations.length})</h2>
          <div className="space-y-2">
            {[...data.observations].reverse().map(obs => (
              <div key={obs.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-lg">
                   <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-400 uppercase truncate">{obs.category}</div>
                  <div className="font-bold text-slate-800 truncate">{obs.assetName}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onOpenForm(obs.category, obs)}
                    className="p-2 bg-slate-100 rounded-lg text-slate-600 active:bg-slate-200"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDeleteObservation(obs.id)}
                    className="p-2 bg-red-50 rounded-lg text-red-600 active:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
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
