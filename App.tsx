
import React, { useState, useEffect, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ObservationForm } from './components/ObservationForm.tsx';
import { ReadmeModal } from './components/ReadmeModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { AssetCategory, InspectionData, SiteType, AppView, Observation, DEFAULT_SCORING_CONFIG } from './types.ts';
import { generateInspectionWordDoc } from './services/docGenerator.ts';
// Added missing 'X' icon import
import { ClipboardCheck, Loader2, BookOpen, Settings, Moon, Sun, Home, Terminal, Info, FolderOpen, CheckCircle2, X } from 'lucide-react';

const APP_VERSION = "v2.2.4-file-system-focus";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [exporting, setExporting] = useState(false);
  const [lastExportName, setLastExportName] = useState<string | null>(null);
  const [showLocatorHelp, setShowLocatorHelp] = useState(false);
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
    setLastExportName(null);
    setView('SETUP');
    setPendingHomeAction(false);
  };

  const handleExport = async () => {
    logDebug(`EVENT: Export Request`);
    setExporting(true);
    try {
      const filename = `${data.siteName}_Report_${data.date.replace(/\//g, '-')}.docx`;
      await generateInspectionWordDoc(data, true); 
      setLastExportName(filename);
      logDebug(`SUCCESS: Export Complete -> ${filename}`);
      setTimeout(() => setExporting(false), 2000);
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

      <main className={`flex-1 overflow-y-auto relative z-10 ${view === 'DASHBOARD' ? (lastExportName ? 'pb-52' : 'pb-32') : 'pb-24'}`}>
        {view === 'SETUP' && (
          <SetupScreen 
            onStart={handleStart} 
            darkMode={darkMode} 
            initialData={data.siteName ? data : undefined} 
            onClear={() => setPendingHomeAction(true)} 
            onShowLocate={() => setShowLocatorHelp(true)}
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
          {lastExportName && (
            <div className="flex gap-2 mb-1 animate-in slide-in-from-bottom-2 duration-300">
              <div className={`flex-1 py-3 px-4 rounded-xl border flex items-center gap-3 ${darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <CheckCircle2 size={16} className="shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-tight truncate">Report Saved</span>
              </div>
              <button 
                onClick={() => setShowLocatorHelp(true)}
                className={`px-4 py-3 rounded-xl border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${darkMode ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}
              >
                <FolderOpen size={14} /> Locate
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
              <><ClipboardCheck className="w-5 h-5" /> EXPORT REPORT (DOCX)</>
            )}
          </button>
        </div>
      )}

      {/* Locator Help Modal */}
      {showLocatorHelp && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="p-6 border-b border-slate-700/30 flex justify-between items-center">
              <div className="flex items-center gap-2 text-indigo-500">
                <FolderOpen size={18} />
                <h2 className="text-xs font-black uppercase tracking-widest">File Location Guide</h2>
              </div>
              <button onClick={() => setShowLocatorHelp(false)} className="p-2 opacity-50"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-black shrink-0 text-white">1</div>
                  <p className="text-sm font-medium">Open your Android <strong>Files</strong> or <strong>My Files</strong> app.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-black shrink-0 text-white">2</div>
                  <p className="text-sm font-medium">Navigate to <strong>Internal Storage</strong> then the <strong>Download</strong> folder.</p>
                </div>
                <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[10px] font-black uppercase opacity-50 mb-1">Expected Filename</p>
                  <p className="text-xs font-mono break-all">{lastExportName || 'site_report_date.docx'}</p>
                </div>
              </div>
              <button onClick={() => setShowLocatorHelp(false)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-xs tracking-widest">UNDERSTOOD</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Info Modals */}
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
          onSave={(newConfig) => setData(prev => ({ ...prev, config: newConfig }))} 
          onClose={() => setShowSettings(false)} 
          darkMode={darkMode} 
        />
      )}
    </div>
  );
};

export default App;
