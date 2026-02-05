import React, { useState } from 'react';
import { SiteType, InspectionData } from '../types.ts';
import { ShieldCheck, User, MapPin, Factory } from 'lucide-react';

interface SetupScreenProps {
  onStart: (user: string, site: string, type: SiteType) => void;
  darkMode: boolean;
  initialData?: InspectionData;
  onClear?: () => void;
}

const APP_VERSION = "v2.4.1";

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, darkMode, initialData, onClear }) => {
  const [userName, setUserName] = useState(initialData?.userName || '');
  const [siteName, setSiteName] = useState(initialData?.siteName || '');
  const [siteType, setSiteType] = useState<SiteType>(initialData?.siteType || SiteType.WTW);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName && siteName) {
      onStart(userName, siteName, siteType);
    }
  };

  const hasExistingData = !!initialData?.siteName;

  return (
    <div className="p-6 h-full flex flex-col justify-center relative transition-colors overflow-y-auto">
      <div className="mb-8 text-center pt-8">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
          <ShieldCheck className={`w-10 h-10 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Site Inspector</h2>
        <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Professional Asset Compliance Audit</p>
      </div>

      {hasExistingData && (
        <div className={`mb-6 p-4 rounded-xl border animate-pulse ${darkMode ? 'bg-amber-900/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <p className="font-bold text-sm">Active Session Detected</p>
          <p className="text-xs opacity-80 mt-1">Audit for <strong>{initialData.siteName}</strong> is ready to resume.</p>
          <div className="flex gap-2 mt-3">
             <button onClick={() => onStart(userName, siteName, siteType)} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm">Resume</button>
             <button onClick={onClear} className={`px-4 py-2 rounded-lg font-bold text-xs border ${darkMode ? 'border-amber-500/30 text-amber-300' : 'border-amber-200 text-amber-700'}`}>Clear</button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 max-w-sm mx-auto w-full pb-20">
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            <User className="w-3 h-3" /> Inspector Name
          </label>
          <input 
            required
            type="text" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className={`w-full p-4 rounded-xl border outline-none transition-all font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
            placeholder="Enter name..."
          />
        </div>

        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            <MapPin className="w-3 h-3" /> Site Reference
          </label>
          <input 
            required
            type="text" 
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className={`w-full p-4 rounded-xl border outline-none transition-all font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
            placeholder="Site location..."
          />
        </div>

        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            <Factory className="w-3 h-3" /> Facility Classification
          </label>
          <select 
            value={siteType}
            onChange={(e) => setSiteType(e.target.value as SiteType)}
            className={`w-full p-4 rounded-xl border outline-none transition-all font-medium appearance-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`}
          >
            <option value={SiteType.WTW}>Water Treatment (WTW)</option>
            <option value={SiteType.STW}>Sewage Treatment (STW)</option>
          </select>
        </div>

        <button 
          type="submit"
          disabled={!userName || !siteName}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
        >
          {hasExistingData ? "Continue Audit" : "Begin Audit"}
        </button>
      </form>

      <div className="text-center pb-6">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
          OFFLINE COMPLIANCE TOOL • {APP_VERSION}
        </p>
      </div>
    </div>
  );
};