
import React, { useState, useRef } from 'react';
import { 
  ClipboardCheck, CloudUpload, Loader2, ShieldCheck, User, MapPin, Factory,
  Settings, Info, Zap, Wind, AlertCircle, CheckCircle2, ChevronRight, Minus, 
  Trash2, Edit2, Camera, ChevronLeft, Plus, Save, X, Image as ImageIcon
} from 'lucide-react';
import { generateInspectionWordDoc } from './services/docGenerator.ts';
import { syncToExcel } from './services/sharepoint.ts';
import { compressImage } from './services/imageResizer.ts';

// --- TYPES ---
export enum SiteType { WTW = 'WTW', STW = 'STW' }
export enum RiskLevel { LOW = 'Low', MED = 'Med', HI = 'Hi' }
export enum AssetCategory {
  PUMPS = 'Pumps',
  MOTORS = 'Motors',
  COMPRESSORS = 'Compressors',
  ELECTRICAL_PANELS = 'Electrical Panels',
  NON_MAINTENANCE = 'Non-Maintenance'
}

export interface Observation {
  id: string;
  category: AssetCategory;
  assetName: string;
  assetId?: string;
  risk: RiskLevel;
  nonComplianceCount: number;
  previouslySeen: 'Yes' | 'No';
  notes: string;
  photos: string[];
  timestamp: number;
}

export interface InspectionData {
  userName: string;
  siteName: string;
  siteType: SiteType;
  date: string;
  compliantCounts: Record<string, number>;
  observations: Observation[];
}

export type AppView = 'SETUP' | 'DASHBOARD' | 'OBSERVATION_FORM';

export const calculateCompliance = (data: InspectionData) => {
  const categories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];
  let totalCompliant = 0;
  let totalNC_Sum = 0;
  let maintenanceAssetWithIssuesCount = 0;

  categories.forEach(cat => {
    totalCompliant += (data.compliantCounts[cat] || 0);
    const catObs = data.observations.filter(o => o.category === cat);
    maintenanceAssetWithIssuesCount += catObs.length;
    catObs.forEach(obs => {
      totalNC_Sum += obs.nonComplianceCount;
    });
  });

  const totalAssetsChecked = totalCompliant + maintenanceAssetWithIssuesCount;
  const siteIssueScore = totalAssetsChecked === 0 ? 0 : (totalNC_Sum / totalAssetsChecked).toFixed(3);
  const compliancePercentage = totalAssetsChecked === 0 ? 100 : Math.round((totalCompliant / totalAssetsChecked) * 100);
  
  return { compliancePercentage, siteIssueScore, totalAssetsChecked, totalNC_Sum };
};

// --- COMPONENTS ---

const SetupScreen = ({ onStart }) => {
  const [userName, setUserName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteType, setSiteType] = useState<SiteType>(SiteType.WTW);

  return (
    <div className="p-6 h-full flex flex-col justify-center min-h-[600px]">
      <div className="mb-8 text-center">
        <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Site Inspector</h2>
        <p className="text-slate-500">Configure your inspection details</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onStart(userName, siteName, siteType); }} className="space-y-6 flex-1 max-w-sm mx-auto w-full">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" /> Inspector Name
          </label>
          <input required type="text" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 outline-none transition-all text-slate-900" placeholder="e.g. John Smith" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Site Name
          </label>
          <input required type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 outline-none transition-all text-slate-900" placeholder="e.g. Riverside Station" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Factory className="w-4 h-4" /> Site Type
          </label>
          <select value={siteType} onChange={(e) => setSiteType(e.target.value as SiteType)} className="w-full p-3 rounded-xl border border-slate-300 bg-white outline-none transition-all text-slate-900">
            <option value={SiteType.WTW}>Water Treatment Works (WTW)</option>
            <option value={SiteType.STW}>Sewage Treatment Works (STW)</option>
          </select>
        </div>
        <button type="submit" disabled={!userName || !siteName} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg">Start Inspection</button>
      </form>
    </div>
  );
};

const Dashboard = ({ data, onUpdateCompliant, onOpenForm, onDeleteObservation }) => {
  const categories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];
  const META = {
    [AssetCategory.PUMPS]: { icon: Wind, color: 'text-blue-600', bg: 'bg-blue-50' },
    [AssetCategory.MOTORS]: { icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50' },
    [AssetCategory.COMPRESSORS]: { icon: Wind, color: 'text-green-600', bg: 'bg-green-50' },
    [AssetCategory.ELECTRICAL_PANELS]: { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  };

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 px-1">Asset Loggers</h2>
        <div className="grid grid-cols-1 gap-4">
          {categories.map(cat => {
            // Fix: Extract properties to avoid complex property access in JSX tag, which is invalid syntax
            const meta = META[cat];
            const Icon = meta.icon;
            return (
              <div key={cat} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`${meta.bg} p-2 rounded-lg`}><Icon className={`w-5 h-5 ${meta.color}`} /></div>
                  <h3 className="font-bold text-slate-800 flex-1">{cat}</h3>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Issues</span>
                    <span className="font-bold text-red-600">{data.observations.filter(o => o.category === cat).length}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-1 h-12">
                    <button onClick={() => onUpdateCompliant(cat, 1)} className="flex-1 bg-green-600 text-white font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> {data.compliantCounts[cat] || 0}</button>
                    <button onClick={() => onUpdateCompliant(cat, -1)} className="w-12 bg-red-100 text-red-600 font-bold rounded-xl active:scale-95 flex items-center justify-center"><Minus className="w-4 h-4 stroke-[3px]" /></button>
                  </div>
                  <button onClick={() => onOpenForm(cat)} className="flex-1 bg-white border border-red-200 text-red-600 font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"><AlertCircle className="w-4 h-4" /> Log Issue</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={() => onOpenForm(AssetCategory.NON_MAINTENANCE)} className="w-full bg-slate-800 text-white p-5 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-slate-700 p-2 rounded-lg"><Info className="w-5 h-5" /></div>
          <div className="text-left">
            <div className="font-bold">Log Non-Maintenance Issue</div>
            <div className="text-xs opacity-60">Site safety, signage, hygiene</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5" />
      </button>
      {data.observations.length > 0 && (
        <div className="space-y-3 pb-4">
          <h2 className="text-lg font-bold text-slate-800 px-1">Logged Observations ({data.observations.length})</h2>
          <div className="space-y-2">
            {[...data.observations].reverse().map(obs => (
              <div key={obs.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <div className="bg-red-50 p-2 rounded-lg"><AlertCircle className="w-4 h-4 text-red-600" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-400 uppercase truncate">{obs.category}</div>
                  <div className="font-bold text-slate-800 truncate">{obs.assetName}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onOpenForm(obs.category, obs)} className="p-2 bg-slate-100 rounded-lg text-slate-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => onDeleteObservation(obs.id)} className="p-2 bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ObservationForm = ({ category, initialData, onSave, onBack }) => {
  const [assetName, setAssetName] = useState(initialData?.assetName || '');
  const [assetId, setAssetId] = useState(initialData?.assetId || '');
  const [risk, setRisk] = useState<RiskLevel>(initialData?.risk || RiskLevel.LOW);
  const [count, setCount] = useState(initialData?.nonComplianceCount || 1);
  const [previouslySeen, setPreviouslySeen] = useState<'Yes' | 'No'>(initialData?.previouslySeen || 'No');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    for (const file of Array.from(files).slice(0, 10 - photos.length)) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => { reader.onloadend = () => resolve(reader.result as string); reader.readAsDataURL(file); });
      const optimized = await compressImage(base64);
      setPhotos(prev => [...prev, optimized]);
    }
    setIsProcessing(false);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500"><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="font-bold text-slate-900 truncate px-2 text-sm uppercase tracking-widest">{initialData ? 'Edit' : category}</h2>
        <div className="w-10"></div>
      </div>
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Asset Name / Description *</label>
          <input type="text" value={assetName} onChange={e => setAssetName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 outline-none text-slate-900" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Asset ID</label>
            <input type="text" value={assetId} onChange={e => setAssetId(e.target.value)} placeholder="Optional" className="w-full p-3 rounded-xl border border-slate-300 outline-none text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Seen Prev?</label>
            <select value={previouslySeen} onChange={e => setPreviouslySeen(e.target.value as 'Yes' | 'No')} className="w-full p-3 rounded-xl border border-slate-300 bg-white outline-none text-slate-900">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Risk Level</label>
            <select value={risk} onChange={e => setRisk(e.target.value as RiskLevel)} className="w-full p-3 rounded-xl border border-slate-300 bg-white outline-none text-slate-900">
              <option value={RiskLevel.LOW}>Low</option>
              <option value={RiskLevel.MED}>Medium</option>
              <option value={RiskLevel.HI}>High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">NC Count</label>
            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden h-[52px]">
              <button onClick={() => setCount(Math.max(1, count - 1))} className="flex-1 h-full bg-red-50 text-red-600 flex items-center justify-center"><Minus className="w-5 h-5 stroke-[3px]" /></button>
              <div className="w-14 text-center font-black text-xl text-slate-900 bg-white h-full flex items-center justify-center border-x">{count}</div>
              <button onClick={() => setCount(count + 1)} className="flex-1 h-full bg-green-50 text-green-600 flex items-center justify-center"><Plus className="w-5 h-5 stroke-[3px]" /></button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Observation Notes</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 rounded-xl border border-slate-300 outline-none text-slate-900" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Photos ({photos.length}/10)</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, idx) => (
              <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-slate-200">
                <img src={src} className="w-full h-full object-cover" />
                <button onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
              </div>
            ))}
            {photos.length < 10 && !isProcessing && (
              <>
                <button onClick={() => cameraInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50"><Camera className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">CAMERA</span></button>
                <button onClick={() => galleryInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50"><ImageIcon className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">GALLERY</span></button>
              </>
            )}
          </div>
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
          <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
        </div>
        <div className="pt-4 flex gap-3 pb-8">
          <button onClick={onBack} className="flex-1 py-4 border border-slate-300 rounded-xl font-bold text-slate-600">Cancel</button>
          <button onClick={() => { if (!assetName) return alert("Required field!"); onSave({ id: initialData?.id || crypto.randomUUID(), category, assetName, assetId, risk, nonComplianceCount: count, previouslySeen, notes, photos, timestamp: initialData?.timestamp || Date.now() }); }} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"><Save className="w-5 h-5" /> Save</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('SETUP');
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AssetCategory>(AssetCategory.PUMPS);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [data, setData] = useState<InspectionData>({
    userName: '', siteName: '', siteType: SiteType.WTW, date: new Date().toLocaleDateString(),
    compliantCounts: {}, observations: []
  });

  const handleStart = (userName, siteName, siteType) => {
    setData(prev => ({ ...prev, userName, siteName, siteType, date: new Date().toLocaleDateString() }));
    setView('DASHBOARD');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await generateInspectionWordDoc(data);
      alert("Report Exported! Site data cleared.");
      window.location.reload();
    } catch (e) { alert("Export failed"); }
    setExporting(false);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50 shadow-xl overflow-hidden relative border-x border-slate-200">
      {view !== 'SETUP' && (
        <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-20 flex justify-between items-center">
          <div><h1 className="text-lg font-bold">{data.siteName}</h1><p className="text-[10px] opacity-80 uppercase font-black">{data.siteType} Inspection</p></div>
          <button onClick={async () => { setSyncing(true); const r = await syncToExcel(data); setSyncing(false); alert(r.message); }} className="bg-blue-600 p-2 rounded-lg"><CloudUpload className={`w-5 h-5 ${syncing ? 'animate-pulse' : ''}`} /></button>
        </header>
      )}
      <main className="flex-1 overflow-y-auto pb-20">
        {view === 'SETUP' && <SetupScreen onStart={handleStart} />}
        {view === 'DASHBOARD' && <Dashboard data={data} onUpdateCompliant={(cat, delta) => setData(p => ({ ...p, compliantCounts: { ...p.compliantCounts, [cat]: Math.max(0, (p.compliantCounts[cat] || 0) + delta) } }))} onOpenForm={(cat, obs) => { setActiveCategory(cat); setEditingObservation(obs || null); setView('OBSERVATION_FORM'); }} onDeleteObservation={id => setData(p => ({ ...p, observations: p.observations.filter(o => o.id !== id) }))} />}
        {view === 'OBSERVATION_FORM' && <ObservationForm category={activeCategory} initialData={editingObservation} onBack={() => setView('DASHBOARD')} onSave={obs => { setData(p => { const isEdit = p.observations.find(o => o.id === obs.id); return { ...p, observations: isEdit ? p.observations.map(o => o.id === obs.id ? obs : o) : [...p.observations, obs] }; }); setView('DASHBOARD'); }} />}
      </main>
      {view === 'DASHBOARD' && (
        <div className="bg-white border-t p-4 sticky bottom-0"><button onClick={handleExport} disabled={exporting} className="w-full bg-green-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-md">{exporting ? <Loader2 className="animate-spin" /> : <ClipboardCheck />} Complete Visit & Export</button></div>
      )}
    </div>
  );
};

export default App;
