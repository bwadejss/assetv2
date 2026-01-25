
import React, { useState, useRef } from 'react';
import { AssetCategory, RiskLevel, Observation } from '../types';
import { Camera, ChevronLeft, Plus, Minus, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '../services/imageResizer';

interface ObservationFormProps {
  category: AssetCategory;
  initialData: Observation | null;
  onSave: (obs: Observation) => void;
  onBack: () => void;
  darkMode: boolean;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({ category, initialData, onSave, onBack, darkMode }) => {
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
    const remainingSlots = 10 - photos.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];

    for (const file of filesToProcess) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const optimized = await compressImage(base64);
        setPhotos(prev => [...prev, optimized]);
      } catch (err) {
        console.error("Error processing photo:", err);
      }
    }
    setIsProcessing(false);
    if (e.target) e.target.value = '';
  };

  const handleSave = () => {
    if (!assetName) {
      alert("Please enter Asset Name/Description");
      return;
    }

    const observation: Observation = {
      id: initialData?.id || crypto.randomUUID(),
      category,
      assetName,
      assetId,
      risk,
      nonComplianceCount: count,
      previouslySeen,
      notes,
      photos,
      timestamp: initialData?.timestamp || Date.now()
    };
    onSave(observation);
  };

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
      <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button onClick={onBack} className={`p-2 -ml-2 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-black text-xs uppercase tracking-[0.2em] truncate px-2">
          {initialData ? 'Edit Log' : 'New Defect'}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-8">
        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Asset Description / ID *
          </label>
          <input 
            type="text" 
            value={assetName}
            onChange={e => setAssetName(e.target.value)}
            placeholder="e.g. Pump 01 Motor Housing"
            className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-600'} focus:ring-2`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Reference ID
            </label>
            <input 
              type="text" 
              value={assetId}
              onChange={e => setAssetId(e.target.value)}
              placeholder="Optional"
              className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-600'} focus:ring-2`}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Known Issue?
            </label>
            <select 
              value={previouslySeen}
              onChange={e => setPreviouslySeen(e.target.value as 'Yes' | 'No')}
              className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-600'} focus:ring-2 appearance-none`}
            >
              <option value="No">New Problem</option>
              <option value="Yes">Seen Before</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Risk Level
            </label>
            <select 
              value={risk}
              onChange={e => setRisk(e.target.value as RiskLevel)}
              className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:ring-blue-600'} focus:ring-2 appearance-none`}
            >
              <option value={RiskLevel.LOW}>Low Risk</option>
              <option value={RiskLevel.MED}>Medium Risk</option>
              <option value={RiskLevel.HI}>High Risk</option>
            </select>
          </div>

          <div>
            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Defect Qty
            </label>
            <div className={`flex items-center border rounded-2xl overflow-hidden h-[58px] shadow-inner ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <button onClick={() => setCount(Math.max(1, count - 1))} className="flex-1 h-full flex items-center justify-center hover:bg-red-500/10 text-red-500">
                <Minus size={20} strokeWidth={3} />
              </button>
              <div className="w-12 text-center font-black text-lg border-x border-slate-700/50 h-full flex items-center justify-center">
                {count}
              </div>
              <button onClick={() => setCount(count + 1)} className="flex-1 h-full flex items-center justify-center hover:bg-emerald-500/10 text-emerald-500">
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Audit Notes
          </label>
          <textarea 
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Specify observation details..."
            className={`w-full p-4 rounded-2xl border outline-none font-bold transition-all resize-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:ring-blue-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-600'} focus:ring-2`}
          />
        </div>

        <div>
          <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Media Evidence ({photos.length}/10)
          </label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, idx) => (
              <div key={idx} className={`aspect-square relative rounded-2xl overflow-hidden border shadow-sm ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <img src={src} className="w-full h-full object-cover" alt="Evidence" />
                <button onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full shadow-lg active:scale-90">
                  <X size={10} />
                </button>
              </div>
            ))}
            {photos.length < 10 && !isProcessing && (
              <>
                <button onClick={() => cameraInputRef.current?.click()} className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-blue-400 hover:text-blue-500'}`}>
                  <Camera size={24} className="mb-1.5" />
                  <span className="text-[9px] font-black uppercase">Capture</span>
                </button>
                <button onClick={() => galleryInputRef.current?.click()} className={`aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-blue-500 hover:text-blue-400' : 'border-slate-300 bg-slate-50 text-slate-400 hover:border-blue-400 hover:text-blue-500'}`}>
                  <ImageIcon size={24} className="mb-1.5" />
                  <span className="text-[9px] font-black uppercase">Browse</span>
                </button>
              </>
            )}
            {isProcessing && (
              <div className="aspect-square border-2 border-blue-500/20 rounded-2xl flex flex-col items-center justify-center text-blue-500 bg-blue-500/5 animate-pulse">
                <Loader2 size={24} className="animate-spin mb-1.5" />
                <span className="text-[8px] font-black uppercase">Processing</span>
              </div>
            )}
          </div>
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
          <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
        </div>

        <div className="pt-4 flex gap-3 pb-12">
          <button onClick={onBack} className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${darkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-100 text-slate-600'}`}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isProcessing} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50">
            <Save size={18} /> {initialData ? 'Update Log' : 'Save Log'}
          </button>
        </div>
      </div>
    </div>
  );
};
