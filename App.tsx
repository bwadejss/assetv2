
import React, { useState } from 'react';
import { SetupScreen } from './components/SetupScreen.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { ObservationForm } from './components/ObservationForm.tsx';
import { AssetCategory, InspectionData, SiteType, AppView, Observation } from './types.ts';
import { generateInspectionWordDoc } from './services/docGenerator.ts';
import { syncToExcel } from './services/sharepoint.ts';
import { ClipboardCheck, CloudUpload, Loader2 } from 'lucide-react';

const APP_VERSION = "v1.4.1";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [exporting, setExporting] = useState(false);
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
    observations: []
  });

  const [activeCategory, setActiveCategory] = useState<AssetCategory>(AssetCategory.PUMPS);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [syncing, setSyncing] = useState(false);

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
    if (confirm("Delete this observation?")) {
      setData(prev => ({
        ...prev,
        observations: prev.observations.filter(o => o.id !== id)
      }));
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncToExcel(data);
    setSyncing(false);
    alert(result.message);
  };

  const handleExport = async () => {
    if (exporting) return;
    
    setExporting(true);
    try {
      await generateInspectionWordDoc(data);
      
      setTimeout(() => {
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
          observations: []
        });
        setView('SETUP');
        setExporting(false);
      }, 4500);
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export report. Please try again.');
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50 shadow-xl overflow-hidden relative border-x border-slate-200">
      {view !== 'SETUP' && (
        <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold truncate">{data.siteName}</h1>
              <p className="text-xs opacity-80 uppercase tracking-widest font-black">
                {data.siteType} Inspection • {APP_VERSION}
              </p>
            </div>
            <button 
              onClick={handleSync}
              disabled={syncing || exporting}
              className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg transition-colors disabled:opacity-50 shadow-inner"
              title="Sync to SharePoint"
            >
              <CloudUpload className={`w-5 h-5 ${syncing ? 'animate-pulse' : ''}`} />
            </button>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        {view === 'SETUP' && <SetupScreen onStart={handleStart} />}
        {view === 'DASHBOARD' && (
          <Dashboard 
            data={data} 
            onUpdateCompliant={handleUpdateCompliant} 
            onOpenForm={handleOpenForm}
            onDeleteObservation={handleDeleteObservation}
          />
        )}
        {view === 'OBSERVATION_FORM' && (
          <ObservationForm 
            category={activeCategory} 
            initialData={editingObservation}
            onSave={handleSaveObservation} 
            onBack={() => setView('DASHBOARD')} 
          />
        )}
      </main>

      {view === 'DASHBOARD' && (
        <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className={`w-full ${exporting ? 'bg-slate-400' : 'bg-green-600 hover:bg-green-700'} text-white px-4 py-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all active:scale-95 shadow-md`}
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing Report...
              </>
            ) : (
              <>
                <ClipboardCheck className="w-5 h-5" />
                Complete Visit & Export
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
