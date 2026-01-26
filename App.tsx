import React, { useState, useEffect, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ObservationForm } from './components/ObservationForm.tsx';
import { ReadmeModal } from './components/ReadmeModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { AssetCategory, InspectionData, SiteType, AppView, Observation, DEFAULT_SCORING_CONFIG } from './types.ts';
import { ClipboardCheck, Loader2, BookOpen, Settings, Moon, Sun, Home, Terminal, Download } from 'lucide-react';

export const APP_VERSION = "v2.2.4-STABLE";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [darkMode, setDarkMode] = useState(true);
  const [showReadme, setShowReadme] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const [pendingHomeAction, setPendingHomeAction] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [data, setData] = useState<InspectionData>({
    userName: '',
    siteName: '',
    siteType: SiteType.WTW,
    date: new Date().toLocaleDateString(),
    compliantCounts: {},
    observations: [],
    config: DEFAULT_SCORING_CONFIG
  });

  const [activeCategory, setActiveCategory] = useState<AssetCategory>('');
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);

  const logDebug = useCallback((msg: string) => {
    console.log(`[DEBUG] ${msg}`);
    setDebugLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 15));
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleStart = (userName: string, siteName: string, siteType: SiteType) => {
    logDebug(`EVENT: Start Audit for ${siteName}`);
    setData(prev => ({ ...prev, userName, siteName, siteType, date: new Date().toLocaleDateString() }));
    setView('DASHBOARD');
  };

  const handleUpdateCompliant = (category: AssetCategory, delta: number) => {
    setData(prev => ({
      ...prev,
      compliantCounts: { ...prev.compliantCounts, [category]: Math.max(0, (prev.compliantCounts[category] || 0) + delta) }
    }));
  };

  const handleOpenForm = (category: AssetCategory, existingObs?: Observation) => {
    setActiveCategory(category);
    setEditingObservation(existingObs || null);
    setView('OBSERVATION_FORM');
  };

  const handleSaveObservation = (observation: Observation) => {
    setData(prev => {
      const isEdit = prev.observations.find(o => o.id === observation.id);
      const newObs = isEdit 
        ? prev.observations.map(o => o.id === observation.id ? observation : o)
        : [...prev.observations, observation];
      return { ...prev, observations: newObs };
    });
    setEditingObservation(null);
    setView('DASHBOARD');
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    setData(prev => ({
      ...prev,
      observations: prev.observations.filter(o => o.id !== pendingDeleteId)
    }));
    setPendingDeleteId(null);
  };

  const confirmHome = () => {
    setData(prev => ({
      ...prev,
      userName: '',
      siteName: '',
      siteType: SiteType.WTW,
      date: new Date().toLocaleDateString(),
      compliantCounts: {},
      observations: [],
    }));
    setView('SETUP');
    setPendingHomeAction(false);
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      
      <header className={`p-4 shadow-md sticky top-0 z-[100] flex justify-between items-center transition-colors duration-300 ${darkMode ? 'bg-slate-850 text-white' : 'bg-blue-700 text-white'}`}>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {view === 'SETUP' ? 'Site Inspector' : `${data.siteName} (${data.siteType})`}
          </h1>
          <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">
            {view === 'SETUP' ? APP_VERSION : `Build • ${APP_VERSION}`}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {view !== 'SETUP' && (
            <button 
              type="button"
              onClick={() => setPendingHomeAction(true)}
              className="p-3 hover:bg-white/10 rounded-lg transition-colors cursor-pointer" 
            >
              <Home size={22} />
            </button>
          )}
          <button onClick={() => setShowReadme(true)} className="p-2 hover:bg-white/10 rounded-lg"><BookOpen size={18} /></button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-lg"><Settings size={18} /></button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-lg">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto relative z-10 ${view === 'DASHBOARD' ? 'pb-24' : 'pb-24'}`}>
        {view === 'SETUP' && (
          <SetupScreen 
            onStart={handleStart} 
            darkMode={darkMode} 
            initialData={data.siteName ? data : undefined} 
            onClear={() => setPendingHomeAction(true)} 
          />
        )}
        {view === 'DASHBOARD' && (
          <Dashboard 
            data={data} 
            onUpdateCompliant={handleUpdateCompliant} 
            onOpenForm={handleOpenForm}
            onDeleteObservation={(id) => setPendingDeleteId(id)}
            darkMode={darkMode}
            logDebug={logDebug}
          />
        )}
        {view === 'OBSERVATION_FORM' && (
          <ObservationForm 
            category={activeCategory} 
            initialData={editingObservation}
            onSave={handleSaveObservation} 
            onBack={() => setView('DASHBOARD')} 
            darkMode={darkMode}
          />
        )}
      </main>

      {view === 'DASHBOARD' && (
        <div className={`p-4 fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-40 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-200'}`}>
          <button 
            type="button"
            onClick={() => setShowShare(true)}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm tracking-widest transition-all active:scale-95 shadow-xl`}
          >
            <Download size={20} /> GENERATE & DOWNLOAD REPORT
          </button>
        </div>
      )}

      {/* Debug Console */}
      {data.config.debugMode && (
        <div className="fixed top-24 right-4 w-72 max-h-60 bg-black/90 text-emerald-400 p-3 text-[10px] font-mono rounded-xl z-[999] pointer-events-none shadow-2xl border border-emerald-500/50 overflow-hidden backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 border-b border-emerald-500/30 pb-2">
            <Terminal size={14} /> <span className="font-black">SYSTEM LOG</span>
          </div>
          <div className="space-y-1">
            {debugLogs.map((log, i) => <div key={i} className="truncate whitespace-pre-wrap">{log}</div>)}
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={pendingHomeAction} 
        onClose={() => setPendingHomeAction(false)} 
        onConfirm={confirmHome}
        title="EXIT TO MENU?"
        message="This will permanently delete all data in the current session."
        darkMode={darkMode}
      />

      <ConfirmModal 
        isOpen={!!pendingDeleteId} 
        onClose={() => setPendingDeleteId(null)} 
        onConfirm={confirmDelete}
        title="DELETE DEFECT?"
        message="This will permanently remove this observation from the report."
        darkMode={darkMode}
      />

      {showReadme && <ReadmeModal onClose={() => setShowReadme(false)} darkMode={darkMode} />}
      {showSettings && (
        <SettingsModal 
          config={data.config} 
          onSave={(newConfig) => setData(prev => ({ ...prev, config: newConfig }))} 
          onClose={() => setShowSettings(false)} 
          darkMode={darkMode} 
        />
      )}
      <ShareModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        data={data} 
        darkMode={darkMode} 
      />
    </div>
  );
};

export default App;