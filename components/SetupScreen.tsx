
import React, { useState } from 'react';
import { SiteType } from '../types.ts';
import { ShieldCheck, User, MapPin, Factory } from 'lucide-react';

interface SetupScreenProps {
  onStart: (user: string, site: string, type: SiteType) => void;
}

const APP_VERSION = "v1.4.1";

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStart }) => {
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
      <div className="mb-8 text-center">
        <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Site Inspector</h2>
        <p className="text-slate-500">Configure your inspection details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 max-w-sm mx-auto w-full">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" /> Inspector Name
          </label>
          <input 
            required
            type="text" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
            placeholder="e.g. John Smith"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Site Name
          </label>
          <input 
            required
            type="text" 
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
            placeholder="e.g. Riverside Station"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Factory className="w-4 h-4" /> Site Type
          </label>
          <select 
            value={siteType}
            onChange={(e) => setSiteType(e.target.value as SiteType)}
            className="w-full p-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900"
          >
            <option value={SiteType.WTW} className="text-slate-900">Water Treatment Works (WTW)</option>
            <option value={SiteType.STW} className="text-slate-900">Sewage Treatment Works (STW)</option>
          </select>
        </div>

        <button 
          type="submit"
          disabled={!userName || !siteName}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
        >
          Start Inspection
        </button>
      </form>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          Build {APP_VERSION}
        </p>
      </div>
    </div>
  );
};
