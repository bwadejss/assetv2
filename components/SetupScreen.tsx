
import React, { useState } from 'react';
import { SiteType } from '../types';
import { ShieldCheck, User, MapPin, Factory } from 'lucide-react';

interface SetupScreenProps {
  onStart: (user: string, site: string, type: SiteType) => void;
  darkMode: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, darkMode }) => {
  const [userName, setUserName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteType, setSiteType] = useState<SiteType>(SiteType.WTW);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName && siteName) {
      onStart(userName, siteName, siteType);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col justify-center relative min-h-[600px]">
      <div className="mb-12 text-center">
        <div className={`${darkMode ? 'bg-blue-900/40' : 'bg-blue-100'} w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner`}>
          <ShieldCheck className={`w-12 h-12 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>Site Inspector</h2>
        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-2`}>Reliable Offline Auditing Environment</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 max-w-sm mx-auto w-full">
        <div>
          <label className={`block text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-2 ml-1`}>
            Inspector Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              required
              type="text" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className={`w-full p-4 pl-12 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-600'} focus:ring-2 outline-none transition-all shadow-sm`}
              placeholder="e.g. Mike Ross"
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-2 ml-1`}>
            Site Reference
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              required
              type="text" 
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className={`w-full p-4 pl-12 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-600'} focus:ring-2 outline-none transition-all shadow-sm`}
              placeholder="e.g. Blue River WTW"
            />
          </div>
        </div>

        <div>
          <label className={`block text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-2 ml-1`}>
            Operational Area
          </label>
          <div className="relative">
            <Factory className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={siteType}
              onChange={(e) => setSiteType(e.target.value as SiteType)}
              className={`w-full p-4 pl-12 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-600'} focus:ring-2 outline-none appearance-none transition-all shadow-sm`}
            >
              <option value={SiteType.WTW}>Water Treatment (WTW)</option>
              <option value={SiteType.STW}>Sewage Treatment (STW)</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={!userName || !siteName}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'} disabled:opacity-40`}
        >
          Initialize Audit
        </button>
      </form>
    </div>
  );
};
