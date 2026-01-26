import React, { useState, useEffect, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ObservationForm } from './components/ObservationForm.tsx';
import { ReadmeModal } from './components/ReadmeModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { AssetCategory, InspectionData, SiteType, AppView, Observation, DEFAULT_SCORING_CONFIG } from './types.ts';
import { generateInspectionWordDoc } from './services/docGenerator.ts';
import { ClipboardCheck, Loader2, BookOpen, Settings, Moon, Sun, Home, Share2, CheckCircle2 } from 'lucide-react';

const APP_VERSION = "v2.2.8-clean-share";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [exporting, setExporting] = useState(false);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
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
    setLastBlob(null);
    setLastFilename(null);
    setView('SETUP');
    setPendingHomeAction(false);
  };

  const handleExport = async () => {
    logDebug(`EVENT: Export Request`);
    setExporting(true);
    try {
      const filename = `${data.siteName}_Report_${data.date.replace(/\//g, '-')}.docx`;
      const blob = await generateInspectionWordDoc(data, true); 
      setLastBlob(blob);
      setLastFilename(filename);
      logDebug(`SUCCESS: Export Complete -> ${filename}`);
      
      // Auto-trigger share sheet
      setTimeout(() => handleShare(blob, filename), 500);
      
      setTimeout(() => setExporting(false), 1500);
    } catch (error) {
      logDebug(`ERROR: Export failed - ${error}`);
      alert('Failed to generate report.');
      setExporting(false);
    }
  };

  const handleShare = async (blob: Blob, filename: string) => {
    const file = new File([blob], filename, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Industrial Inspection Report',
          text: `Inspection report for ${data.siteName}`
        });
        logDebug("SUCCESS: Share sheet opened");
      } catch (err) {
        logDebug(`INFO: Share dismissed or failed - ${err}`);
      }
    } else {
      logDebug("WARN: Native sharing not supported. Falling back to browser download.");
      alert("Sharing is not supported on this browser profile. The file has been downloaded to your storage.");
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
          {lastFilename && lastBlob && (
            <div className={`flex gap-2 mb-1 p-2 rounded-xl animate-in slide-in-from-bottom-2 duration-300 ${darkMode ? 'bg-blue-600/10' : 'bg-blue-50'}`}>
              <div className="flex-1 flex items-center gap-2 px-2 overflow-hidden">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className={`text-[10px] font-black uppercase tracking-tight truncate ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  Report Ready
                </span>
              </div>
              <button 
                onClick={() => handleShare(lastBlob, lastFilename)}
                className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all bg-indigo-600 text-white`}
              >
                <Share2 size={14} /> Send to Teams / Outlook
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
              <><Loader2 className="w-5 h-5 animate-spin" /> EXPORTING...</>
            ) : (
              <><ClipboardCheck className="w-5 h-5" /> {lastFilename ? 'RE-GENERATE REPORT' : 'GENERATE FORMATTED DOCX'}</>
            )}
          </button>
        </div>
      )}

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