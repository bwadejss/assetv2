import React, { useState, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ObservationForm } from './components/ObservationForm.tsx';
import { ReadmeModal } from './components/ReadmeModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { AssetCategory, InspectionData, SiteType, AppView, Observation, DEFAULT_SCORING_CONFIG, ScoringConfig } from './types.ts';
import { generateInspectionWordDoc } from './services/docGenerator.ts';
import { ClipboardCheck, Loader2, BookOpen, Settings, Moon, Sun, Home } from 'lucide-react';

const APP_VERSION = "v1.8.1-MAINT";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [exporting, setExporting] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showReadme, setShowReadme] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [data, setData] = useState<InspectionData>({
    userName: '',
    siteName: '',
    siteType: SiteType.WTW,
    date: new Date().toLocaleDateString(),
    compliantCounts: {
      [AssetCategory.PUMPS]: 0,
      [AssetCategory.MOTORS]: 0,
      [AssetCategory.COMPRESSORS]: 0,
      [AssetCategory.ELECTRICAL_PANELS]: 0,
    },
    observations: [],
    config: DEFAULT_SCORING_CONFIG
  });

  const [activeCategory, setActiveCategory] = useState<AssetCategory>(AssetCategory.PUMPS);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [darkMode]);

  const handleStart = (userName: string, siteName: string, siteType: SiteType) => {
    setData(prev => ({ 
      ...prev, 
      userName, 
      siteName, 
      siteType,
      date: new Date().toLocaleDateString()
    }));
    setView('DASHBOARD');
  };

  const handleUpdateCompliant = (category: AssetCategory, delta: number) => {
    setData(prev => ({
      ...prev,
      compliantCounts: {
        ...prev.compliantCounts,
        [category]: Math.max(0, (prev.compliantCounts[category] || 0) + delta)
      }
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

  const handleDeleteObservation = (id: string) => {
    if (window.confirm("Delete this observation?")) {
      setData(prev => {
        const filtered = prev.observations.filter(o => o.id !== id);
        return { ...prev, observations: filtered };
      });
    }
  };

  const handleUpdateConfig = (newConfig: ScoringConfig) => {
    setData(prev => ({ ...prev, config: newConfig }));
  };

  const handleBackToMenu = () => {
    if (confirm("WARNING: All current inspection data will be permanently deleted. Do you want to return to the main menu?")) {
      setData({
        userName: '',
        siteName: '',
        siteType: SiteType.WTW,
        date: new Date().toLocaleDateString(),
        compliantCounts: {
          [AssetCategory.PUMPS]: 0,
          [AssetCategory.MOTORS]: 0,
          [AssetCategory.COMPRESSORS]: 0,
          [AssetCategory.ELECTRICAL_PANELS]: 0,
        },
        observations: [],
        config: data.config
      });
      setView('SETUP');
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await generateInspectionWordDoc(data);
      setTimeout(() => {
        setData(prev => ({
          ...prev,
          userName: '',
          siteName: '',
          siteType: SiteType.WTW,
          date: new Date().toLocaleDateString(),
          compliantCounts: {
            [AssetCategory.PUMPS]: 0,
            [AssetCategory.MOTORS]: 0,
            [AssetCategory.COMPRESSORS]: 0,
            [AssetCategory.ELECTRICAL_PANELS]: 0,
          },
          observations: []
        }));
        setView('SETUP');
        setExporting(false);
      }, 4500);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export report.');
      setExporting(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden relative border-x transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      
      <header className={`p-4 shadow-md sticky top-0 z-20 flex justify-between items-center ${darkMode ? 'bg-slate-800 text-white' : 'bg-blue-700 text-white'}`}>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {view === 'SETUP' ? 'Site Inspector' : `${data.siteName} (${data.siteType})`}
          </h1>
          <p className="text-[10px] opacity-80 uppercase tracking-widest font-black">
            {view === 'SETUP' ? APP_VERSION : `Maintenance Audit • ${APP_VERSION}`}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {view !== 'SETUP' && (
            <button onClick={handleBackToMenu} className="p-2 hover:bg-white/10 rounded-lg" title="Back to Menu">
              <Home size={18} />
            </button>
          )}
          <button onClick={() => setShowReadme(true)} className="p-2 hover:bg-white/10 rounded-lg" title="View Guide">
            <BookOpen size={18} />
          </button>
          {view !== 'SETUP' && (
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/10 rounded-lg" title="Scoring Config">
              <Settings size={18} />
            </button>
          )}
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-white/10 rounded-lg">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {view === 'SETUP' && <SetupScreen onStart={handleStart} darkMode={darkMode} />}
        {view === 'DASHBOARD' && (
          <Dashboard 
            data={data} 
            onUpdateCompliant={handleUpdateCompliant} 
            onOpenForm={handleOpenForm}
            onDeleteObservation={handleDeleteObservation}
            darkMode={darkMode}
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
        <div className={`p-4 sticky bottom-0 flex justify-between items-center shadow-lg border-t ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className={`w-full ${exporting ? 'bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-4 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-md`}
          >
            {exporting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Report...</>
            ) : (
              <><ClipboardCheck className="w-5 h-5" /> Export Maintenance Report</>
            )}
          </button>
        </div>
      )}

      {showReadme && <ReadmeModal onClose={() => setShowReadme(false)} darkMode={darkMode} />}
      {showSettings && (
        <SettingsModal 
          config={data.config} 
          onSave={handleUpdateConfig} 
          onClose={() => setShowSettings(false)} 
          darkMode={darkMode} 
        />
      )}
    </div>
  );
};

export default App;