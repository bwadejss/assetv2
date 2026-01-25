import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SetupScreen } from './components/SetupScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ObservationForm } from './components/ObservationForm.tsx';
import { ReadmeModal } from './components/ReadmeModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { ShareModal } from './components/ShareModal.tsx';
import { AssetCategory, InspectionData, SiteType, AppView, Observation, DEFAULT_SCORING_CONFIG, ScoringConfig } from './types.ts';
import { generateInspectionWordDoc } from './services/docGenerator.ts';
import { ClipboardCheck, Loader2, BookOpen, Settings, Moon, Sun, Home, Terminal, Share2 } from 'lucide-react';

const APP_VERSION = "v2.2.1-fixed";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [exporting, setExporting] = useState(false);
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
    logDebug(`EVENT: Pass count changed for ${category}`);
    setData(prev => ({
      ...prev,
      compliantCounts: { ...prev.compliantCounts, [category]: Math.max(0, (prev.compliantCounts[category] || 0) + delta) }
    }));
  };

  const handleOpenForm = (category: AssetCategory, existingObs?: Observation) => {
    logDebug(`EVENT: Form Open [${category}]`);
    setActiveCategory(category);
    setEditingObservation(existingObs || null);
    setView('OBSERVATION_FORM');
  };

  const handleSaveObservation = (observation: Observation) => {
    logDebug(`EVENT: Saved Observation ${observation.id}`);
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
    logDebug(`ACTION: DELETING ID ${pendingDeleteId}`);
    setData(prev => ({
      ...prev,
      observations: prev.observations.filter(o => o.id !== pendingDeleteId)
    }));
    setPendingDeleteId(null);
  };

  const confirmHome = () => {
    logDebug(`ACTION: RESETTING APP TO MENU`);
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

  const handleExport = async () => {
    logDebug(`EVENT: Export Request`);
    setExporting(true);
    try {
      await generateInspectionWordDoc(data, true); // Use true to trigger immediate download
      logDebug(`SUCCESS: Export Complete`);
      setTimeout(() => setExporting(false), 3000);
    } catch (error) {
      logDebug(`ERROR: Export failed - ${error}`);
      alert('Failed to export report.');
      setExporting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      
      <header className={`p-4 shadow-md sticky top-0 z-[100] flex justify-between items-center transition-colors duration-300 ${darkMode ? 'bg-slate-850 text-white' : 'bg-blue-700 text-white'}`}>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {view === 'SETUP' ? 'Site Inspector' : `${data.siteName} (${data.siteType})`}
          </h1>
          <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">
            {view === 'SETUP' ? APP_VERSION : `Compliance Audit • ${APP_VERSION}`}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {view !== 'SETUP' && (
            <button 
              type="button"
              onPointerUp={(e) => { 
                logDebug("TRIGGER: Home Button onPointerUp"); 
                e.preventDefault();
                e.stopPropagation(); 
                setPendingHomeAction(true); 
              }}
              className="p-3 hover:bg-white/10 rounded-lg transition-colors cursor-pointer relative z-[110] touch-manipulation" 
              title="Return Home"
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

      <main className={`flex-1 overflow-y-auto relative z-10 ${view === 'DASHBOARD' ? 'pb-44' : 'pb-24'}`}>
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
            onDeleteObservation={(id) => { logDebug(`TRIGGER: Delete for ${id}`); setPendingDeleteId(id); }}
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
        <div className={`p-4 fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-40 border-t space-y-2 transition-colors duration-300 ${darkMode ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-200'}`}>
          <button 
            type="button"
            onClick={() => setShowShare(true)}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs tracking-widest transition-all active:scale-95 shadow-md cursor-pointer`}
          >
            <Share2 size={16} /> SHARE REPORT
          </button>
          <button 
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={`w-full ${exporting ? 'bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-4 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-md cursor-pointer`}
          >
            {exporting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> EXPORTING...</>
            ) : (
              <><ClipboardCheck className="w-5 h-5" /> EXPORT REPORT</>
            )}
          </button>
        </div>
      )}

      {/* Debug Console Overlay */}
      {data.config.debugMode && (
        <div className="fixed top-24 right-4 w-72 max-h-60 bg-black/90 text-emerald-400 p-3 text-[10px] font-mono rounded-xl z-[999] pointer-events-none shadow-2xl border border-emerald-500/50 overflow-hidden backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 border-b border-emerald-500/30 pb-2">
            <Terminal size={14} /> <span className="font-black">LIVE EVENT LOG</span>
          </div>
          <div className="space-y-1">
            {debugLogs.map((log, i) => <div key={i} className="truncate whitespace-pre-wrap">{log}</div>)}
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
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
          onSave={(newConfig) => { logDebug("CONFIG: Settings Saved"); setData(prev => ({ ...prev, config: newConfig })); }} 
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