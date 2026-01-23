import React, { useState, useRef } from 'react';
import { 
  ClipboardCheck, ShieldCheck, User, MapPin, Factory,
  Settings, Info, Zap, Wind, AlertCircle, CheckCircle2, ChevronRight, Minus, 
  Trash2, Edit2, Camera, ChevronLeft, Plus, Save, X, Image as ImageIcon, Loader2
} from 'lucide-react';
import * as docx from 'docx';

// --- TYPES & ENUMS ---
enum SiteType { WTW = 'WTW', STW = 'STW' }
enum RiskLevel { LOW = 'Low', MED = 'Med', HI = 'Hi' }
enum AssetCategory {
  PUMPS = 'Pumps',
  MOTORS = 'Motors',
  COMPRESSORS = 'Compressors',
  ELECTRICAL_PANELS = 'Electrical Panels',
  NON_MAINTENANCE = 'Non-Maintenance'
}

interface Observation {
  id: string;
  category: AssetCategory;
  assetName: string;
  assetId?: string;
  risk: RiskLevel;
  nonComplianceCount: number;
  notes: string;
  photos: string[];
}

interface InspectionData {
  userName: string;
  siteName: string;
  siteType: SiteType;
  date: string;
  compliantCounts: Record<string, number>;
  observations: Observation[];
}

// --- UTILITIES ---
const compressImage = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1024;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
      } else {
        if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64Str);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const base64ToUint8 = (base64: string): Uint8Array | null => {
  try {
    const parts = base64.split(';base64,');
    if (parts.length < 2) return null;
    const raw = window.atob(parts[1]);
    const uInt8 = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) uInt8[i] = raw.charCodeAt(i);
    return uInt8;
  } catch (e) { return null; }
};

// --- DOC GENERATOR ---
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, TextRun, ImageRun } = docx;

const generateReport = async (data: InspectionData) => {
  const maintenanceObs = data.observations.filter(o => o.category !== AssetCategory.NON_MAINTENANCE);
  const nonMaintenanceObs = data.observations.filter(o => o.category === AssetCategory.NON_MAINTENANCE);
  
  const totalNonMaintCount = nonMaintenanceObs.reduce((sum, o) => sum + o.nonComplianceCount, 0);
  
  const categories = [AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS];
  let totalCompliant = 0;
  categories.forEach(cat => totalCompliant += (data.compliantCounts[cat] || 0));
  
  const totalAssets = totalCompliant + maintenanceObs.length;
  const compliancePercent = totalAssets === 0 ? 100 : Math.round((totalCompliant / totalAssets) * 100);

  const generateSimpleRow = (label: string, value: any) => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })], width: { size: 40, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${value || ''}` })] })] }),
    ]
  });

  const children: any[] = [
    new Paragraph({ alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "SITE INSPECTION REPORT", bold: true, size: 36 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `${data.siteName} - ${data.date}`, size: 24 })] }),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        generateSimpleRow("Inspector", data.userName),
        generateSimpleRow("Site Name", data.siteName),
        generateSimpleRow("Site Type", data.siteType),
        generateSimpleRow("Date", data.date),
        generateSimpleRow("Non-Maintenance Issue Count", totalNonMaintCount),
        generateSimpleRow("Maintenance Compliance %", `${compliancePercent}%`),
      ]
    }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 }, children: [new TextRun({ text: "Compliance Table", bold: true })] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Category", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Compliant", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Non-Compliant", bold: true })] })] }),
        ]}),
        ...categories.map(cat => new TableRow({ children: [
          new TableCell({ children: [new Paragraph({ text: cat })] }),
          new TableCell({ children: [new Paragraph({ text: `${data.compliantCounts[cat] || 0}` })] }),
          new TableCell({ children: [new Paragraph({ text: `${maintenanceObs.filter(o => o.category === cat).length}` })] }),
        ]}))
      ]
    })
  ];

  const addObsTable = async (obs: Observation) => {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 400, after: 100 }, children: [new TextRun({ text: `Observation: ${obs.assetName}`, bold: true })] }));
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        generateSimpleRow("Asset Description", obs.assetName),
        generateSimpleRow("Asset ID", obs.assetId || "N/A"),
        generateSimpleRow("Risk Level", obs.risk),
        generateSimpleRow("NC Count", obs.nonComplianceCount),
        generateSimpleRow("Notes", obs.notes),
        generateSimpleRow("Short Term Fix", ""),
        generateSimpleRow("Long Term Fix", ""),
        generateSimpleRow("Report Feedback Findings", ""),
        generateSimpleRow("Action Owner", ""),
      ]
    }));
    
    if (obs.photos.length > 0) {
      const photoNodes = [];
      for (const p of obs.photos) {
        const bytes = base64ToUint8(p);
        // Fix: Cast ImageRun options to any to bypass docx library type inconsistencies between SvgMediaOptions and CoreImageOptions.
        if (bytes) photoNodes.push(new ImageRun({ data: bytes, transformation: { width: 250, height: 180 } } as any));
      }
      children.push(new Paragraph({ children: photoNodes, spacing: { before: 200 } }));
    }
  };

  if (maintenanceObs.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400 }, children: [new TextRun({ text: "Maintenance Observations", bold: true, underline: {} })] }));
    for (const obs of maintenanceObs) await addObsTable(obs);
  }

  if (nonMaintenanceObs.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400 }, children: [new TextRun({ text: "Non-Maintenance Observations", bold: true, underline: {} })] }));
    for (const obs of nonMaintenanceObs) await addObsTable(obs);
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.siteName}_Inspection_${data.date.replace(/\//g, '-')}.docx`;
  a.click();
};

// --- COMPONENTS ---

const App: React.FC = () => {
  const [view, setView] = useState<'SETUP' | 'DASHBOARD' | 'FORM'>('SETUP');
  const [data, setData] = useState<InspectionData>({
    userName: '', siteName: '', siteType: SiteType.WTW, date: new Date().toLocaleDateString(),
    compliantCounts: {}, observations: []
  });
  const [activeCategory, setActiveCategory] = useState<AssetCategory>(AssetCategory.PUMPS);
  const [formLoading, setFormLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form State
  const [formAsset, setFormAsset] = useState('');
  const [formId, setFormId] = useState('');
  const [formRisk, setFormRisk] = useState<RiskLevel>(RiskLevel.LOW);
  const [formCount, setFormCount] = useState(1);
  const [formNotes, setFormNotes] = useState('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.userName && data.siteName) setView('DASHBOARD');
  };

  const openForm = (cat: AssetCategory) => {
    setActiveCategory(cat);
    setFormAsset(''); setFormId(''); setFormRisk(RiskLevel.LOW);
    setFormCount(1); setFormNotes(''); setFormPhotos([]);
    setView('FORM');
  };

  const saveObservation = () => {
    if (!formAsset) return alert("Asset name is required");
    const newObs: Observation = {
      id: crypto.randomUUID(), category: activeCategory, assetName: formAsset,
      assetId: formId, risk: formRisk, nonComplianceCount: formCount,
      notes: formNotes, photos: formPhotos
    };
    setData(prev => ({ ...prev, observations: [...prev.observations, newObs] }));
    setView('DASHBOARD');
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setFormLoading(true);
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((res) => {
        reader.onloadend = () => res(reader.result as string);
        reader.readAsDataURL(file);
      });
      const optimized = await compressImage(base64);
      setFormPhotos(prev => [...prev, optimized]);
    }
    setFormLoading(false);
  };

  if (view === 'SETUP') return (
    <div className="p-6 h-full flex flex-col justify-center max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <ShieldCheck className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Inspection Setup</h2>
      </div>
      <form onSubmit={handleStart} className="space-y-4">
        <div><label className="block text-sm font-bold mb-1">Inspector Name</label><input required className="w-full p-3 border rounded-xl" value={data.userName} onChange={e => setData(d => ({ ...d, userName: e.target.value }))} /></div>
        <div><label className="block text-sm font-bold mb-1">Site Name</label><input required className="w-full p-3 border rounded-xl" value={data.siteName} onChange={e => setData(d => ({ ...d, siteName: e.target.value }))} /></div>
        <div><label className="block text-sm font-bold mb-1">Site Type</label>
          <select className="w-full p-3 border rounded-xl" value={data.siteType} onChange={e => setData(d => ({ ...d, siteType: e.target.value as SiteType }))}>
            <option value={SiteType.WTW}>WTW</option>
            <option value={SiteType.STW}>STW</option>
          </select>
        </div>
        <button className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold">Start Inspection</button>
      </form>
    </div>
  );

  if (view === 'FORM') return (
    <div className="flex flex-col h-full bg-white max-w-lg mx-auto w-full">
      <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
        <button onClick={() => setView('DASHBOARD')} className="p-2"><ChevronLeft /></button>
        <h2 className="font-bold">{activeCategory} Form</h2>
        <div className="w-8"></div>
      </div>
      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        <div><label className="block text-sm font-bold mb-1">Asset Name / Description *</label><input className="w-full p-3 border rounded-xl" value={formAsset} onChange={e => setFormAsset(e.target.value)} /></div>
        <div><label className="block text-sm font-bold mb-1">Asset ID (Optional)</label><input className="w-full p-3 border rounded-xl" value={formId} onChange={e => setFormId(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-bold mb-1">Risk</label>
            <select className="w-full p-3 border rounded-xl" value={formRisk} onChange={e => setFormRisk(e.target.value as RiskLevel)}>
              <option value={RiskLevel.LOW}>Low</option><option value={RiskLevel.MED}>Med</option><option value={RiskLevel.HI}>Hi</option>
            </select>
          </div>
          <div><label className="block text-sm font-bold mb-1">NC Count</label>
            <div className="flex border rounded-xl overflow-hidden h-12">
              <button onClick={() => setFormCount(Math.max(0, formCount - 1))} className="flex-1 bg-slate-50 border-r">-1</button>
              <div className="w-12 flex items-center justify-center font-bold">{formCount}</div>
              <button onClick={() => setFormCount(formCount + 1)} className="flex-1 bg-slate-50 border-l">+1</button>
            </div>
          </div>
        </div>
        <div><label className="block text-sm font-bold mb-1">Notes</label><textarea className="w-full p-3 border rounded-xl" value={formNotes} onChange={e => setFormNotes(e.target.value)} /></div>
        <div><label className="block text-sm font-bold mb-1">Photos ({formPhotos.length})</label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {formPhotos.map((p, idx) => (
              <div key={idx} className="aspect-square relative"><img src={p} className="w-full h-full object-cover rounded-lg border" /><button onClick={() => setFormPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3"/></button></div>
            ))}
            <label className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer">
              {formLoading ? <Loader2 className="animate-spin" /> : <Camera />}
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>
        </div>
      </div>
      <div className="p-4 border-t flex gap-2">
        <button onClick={() => setView('DASHBOARD')} className="flex-1 p-4 border rounded-xl font-bold">Back</button>
        <button onClick={() => { setFormAsset(''); setFormId(''); setFormNotes(''); setFormPhotos([]); }} className="flex-1 p-4 bg-slate-100 rounded-xl font-bold">Clear</button>
        <button onClick={saveObservation} className="flex-1 p-4 bg-blue-600 text-white rounded-xl font-bold">Save</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto w-full bg-slate-50 h-screen flex flex-col">
      <header className="p-4 bg-blue-700 text-white shadow-lg">
        <h1 className="font-bold">{data.siteName}</h1>
        <p className="text-xs opacity-75">{data.userName} • {data.date}</p>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-3">
          <h2 className="font-bold text-slate-700">Maintenance Categories</h2>
          {[AssetCategory.PUMPS, AssetCategory.MOTORS, AssetCategory.COMPRESSORS, AssetCategory.ELECTRICAL_PANELS].map(cat => (
            <div key={cat} className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-3">
              <div className="flex-1">
                <div className="font-bold">{cat}</div>
                <div className="text-xs text-slate-500">Compliant: {data.compliantCounts[cat] || 0} | Issues: {data.observations.filter(o => o.category === cat).length}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setData(d => ({ ...d, compliantCounts: { ...d.compliantCounts, [cat]: (d.compliantCounts[cat] || 0) + 1 } }))} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold">Compliant +1</button>
                <button onClick={() => openForm(cat)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-bold">Log Issue</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => openForm(AssetCategory.NON_MAINTENANCE)} className="w-full p-4 bg-slate-800 text-white rounded-2xl flex justify-between items-center font-bold">
          <span>Log Non-Maintenance Issue</span>
          <ChevronRight />
        </button>
      </div>
      <div className="p-4 bg-white border-t">
        <button onClick={async () => { setExporting(true); await generateReport(data); setExporting(false); }} disabled={exporting} className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2">
          {exporting ? <Loader2 className="animate-spin"/> : <ClipboardCheck />}
          Complete Visit & Export
        </button>
      </div>
    </div>
  );
};

export default App;
