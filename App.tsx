import React, { useState, useEffect, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ObservationForm } from './components/ObservationForm.tsx';
import { ReadmeModal } from './components/ReadmeModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { FileGuideModal } from './components/FileGuideModal.tsx';
import { AssetCategory, InspectionData, SiteType, AppView, Observation, DEFAULT_SCORING_CONFIG } from './types.ts';
import { generateInspectionWordDoc } from './services/docGenerator.ts';
import { ClipboardCheck, Loader2, BookOpen, Settings, Moon, Sun, Home, CheckCircle2, Terminal, Info, Download } from 'lucide-react';

const APP_VERSION = "v2.4.0";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [exporting, setExporting] = useState(false);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [showFileGuide, setShowFileGuide] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showReadme, setShowReadme] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
    setDebugLogs(prev => [`${new Date().toLocaleTimeString().split(' ')[0]} - ${msg}`, ...prev].slice(0, 30));
  }, []);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleStart = (userName: string, siteName: string, siteType: SiteType) => {
    logDebug(`START: User=${userName} Site=${siteName}`);
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
    setLastFilename(null);
    setLastBlob(null);
    setView('SETUP');
    setPendingHomeAction(false);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    logDebug(`DOWNLOAD: Triggering browser download for ${filename}`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleExport = async () => {
    logDebug(`EXPORT: Requested for ${data.siteName}`);
    setExporting(true);
    try {
      const filename = `${data.siteName.replace(/\s+/g, '_')}_Report_${data.date.replace(/\//g, '-')}.docx`;
      const blob = await generateInspectionWordDoc(data, false); 
      setLastBlob(blob);
      setLastFilename(filename);
      
      triggerDownload(blob, filename);
      
      logDebug(`SUCCESS: Blob created and download triggered.`);
      setShowFileGuide(true);
      setTimeout(() => setExporting(false), 1500);
    } catch (error) {
      logDebug(`ERROR: Export failed - ${error}`);
      alert('Failed to generate report.');
      setExporting(false);
    }
  };

  const clearLogs = () => setDebugLogs([]);

  return (
    <div className={`min-h-screen flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      
      <header className={`p-4 shadow-md sticky top-0 z-[100] flex justify-between items-center transition-colors duration-300 ${darkMode ? 'bg-slate-850 text-white' : 'bg-blue-700 text-white'}`}>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {view === 'SETUP' ? 'Site Inspector' : `${data.siteName}`}
          </h1>
          <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">
            {APP_VERSION}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {view !== 'SETUP' && (
            <button onClick={() => setPendingHomeAction(true)} className="p-3 hover:bg-white/10 rounded-lg transition-colors"><Home size={22} /></button>
          )}
          <button onClick={() => setShowReadme(true)} className="p-2 hover:bg-white/10 rounded-lg"><BookOpen size={18} /></button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-lg"><Settings size={18} /></button>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-lg">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto relative z-10 ${view === 'DASHBOARD' ? (lastFilename ? 'pb-40' : 'pb-32') : 'pb-24'}`}>
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
        <div className={`p-4 fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-40 border-t space-y-2 transition-colors duration-300 ${darkMode ? 'bg-slate-850 border-slate-700' : 'bg-white border-slate-200'}`}>
          {lastFilename && (
            <div className={`flex gap-2 mb-1 p-2 rounded-xl animate-in slide-in-from-bottom-2 duration-300 ${darkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-100'}`}>
              <div className="flex-1 flex items-center gap-2 px-2 overflow-hidden">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className={`text-[10px] font-black uppercase tracking-tight truncate ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {lastFilename}
                </span>
              </div>
              <button 
                onClick={() => setShowFileGuide(true)}
                className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all bg-indigo-600 text-white`}
              >
                <Info size={14} /> How to Share
              </button>
            </div>
          )}
          
          <button 
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className={`w-full ${exporting ? 'bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-5 rounded-xl flex items-center justify-center gap-3 font-black text-xs tracking-[0.2em] transition-all active:scale-95 shadow-xl`}
          >
            {exporting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> GENERATING...</>
            ) : (
              <><ClipboardCheck className="w-5 h-5" /> {lastFilename ? 'RE-GENERATE REPORT' : 'GENERATE SITE REPORT'}</>
            )}
          </button>
        </div>
      )}

      {data.config.debugMode && (
        <div className="fixed top-20 left-4 right-4 max-w-[calc(100%-2rem)] max-h-48 z-[200] bg-black/90 text-emerald-400 p-3 rounded-xl border border-emerald-500/30 font-mono text-[10px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-2 border-b border-emerald-500/20 pb-1">
            <div className="flex items-center gap-2">
              <Terminal size={12} />
              <span className="font-bold tracking-widest">LIVE DEBUG LOG</span>
            </div>
            <button onClick={clearLogs} className="hover:text-white uppercase">{"[Clear]"}</button>
          </div>
          <div className="overflow-y-auto flex-1 space-y-1">
            {debugLogs.length === 0 ? (
              <p className="opacity-40 italic">Waiting for events...</p>
            ) : (
              debugLogs.map((log, i) => <div key={i} className="whitespace-nowrap">{"- "}{log}</div>)
            )}
          </div>
        </div>
      )}

      <FileGuideModal 
        isOpen={showFileGuide} 
        onClose={() => setShowFileGuide(false)} 
        lastFilename={lastFilename}
        onRetry={() => lastBlob && lastFilename && triggerDownload(lastBlob, lastFilename)}
        darkMode={darkMode}
      />

      <ConfirmModal 
        isOpen={pendingHomeAction} 
        onClose={() => setPendingHomeAction(false)} 
        onConfirm={confirmHome}
        title="EXIT TO MENU?"
        message="This will clear all current session data."
        darkMode={darkMode}
      />

      <ConfirmModal 
        isOpen={!!pendingDeleteId} 
        onClose={() => setPendingDeleteId(null)} 
        onConfirm={confirmDelete}
        title="DELETE DEFECT?"
        message="This action cannot be undone."
        darkMode={darkMode}
      />

      {showReadme && <ReadmeModal onClose={() => setShowReadme(false)} darkMode={darkMode} />}
      {showSettings && (
        <SettingsModal 
          config={data.config} 
          onSave={(newConfig) => {
            logDebug(`SETTINGS: Config updated. Debug=${newConfig.debugMode}`);
            setData(prev => ({ ...prev, config: newConfig }));
          }} 
          onClose={() => setShowSettings(false)} 
          darkMode={darkMode} 
        />
      )}
    </div>
  );
};

export default App;