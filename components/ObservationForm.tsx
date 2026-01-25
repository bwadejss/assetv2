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
  
  const [shortTermFix, setShortTermFix] = useState(initialData?.shortTermFix || '');
  const [longTermFix, setLongTermFix] = useState(initialData?.longTermFix || '');
  const [feedbackNotes, setFeedbackNotes] = useState(initialData?.feedbackNotes || '');
  
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
      shortTermFix,
      longTermFix,
      feedbackNotes,
      // Internal fields kept for report logic but removed from UI form
      actionOwner: initialData?.actionOwner || "", 
      notes: initialData?.notes || "",
      photos,
      timestamp: initialData?.timestamp || Date.now()
    };
    onSave(observation);
  };

  const inputClass = `w-full p-3 rounded-xl border outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900'}`;
  const labelClass = `block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`;

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
      <div className={`p-4 border-b flex items-center justify-between sticky top-0 z-10 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button type="button" onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-blue-500 transition-colors cursor-pointer">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-black truncate px-2 text-xs uppercase tracking-[0.15em]">
          {initialData ? 'Edit Defect' : 'Log New Defect'}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className={labelClass}>Asset Name / Description *</label>
          <input 
            type="text" 
            value={assetName}
            onChange={e => setAssetName(e.target.value)}
            placeholder="e.g. Pump 01 Suction Valve"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Asset ID / Tag</label>
            <input 
              type="text" 
              value={assetId}
              onChange={e => setAssetId(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Risk Level</label>
            <select 
              value={risk}
              onChange={e => setRisk(e.target.value as RiskLevel)}
              className={inputClass}
            >
              <option value={RiskLevel.LOW}>Low</option>
              <option value={RiskLevel.MED}>Medium</option>
              <option value={RiskLevel.HI}>High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Previously Seen?</label>
            <select 
              value={previouslySeen}
              onChange={e => setPreviouslySeen(e.target.value as 'Yes' | 'No')}
              className={inputClass}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Defect Count</label>
            <div className={`flex items-center border rounded-xl overflow-hidden h-[46px] shadow-sm ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <button 
                type="button"
                onClick={() => setCount(Math.max(1, count - 1))}
                className={`flex-1 h-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-red-400 hover:bg-red-900/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
              >
                <Minus size={18} strokeWidth={3} />
              </button>
              <div className={`w-12 text-center font-black text-lg h-full flex items-center justify-center border-x ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>
                {count}
              </div>
              <button 
                type="button"
                onClick={() => setCount(count + 1)}
                className={`flex-1 h-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-emerald-400 hover:bg-emerald-900/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Short Term Fix</label>
            <textarea 
              rows={2}
              value={shortTermFix}
              onChange={e => setShortTermFix(e.target.value)}
              placeholder="Immediate action..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Long Term Fix</label>
            <textarea 
              rows={2}
              value={longTermFix}
              onChange={e => setLongTermFix(e.target.value)}
              placeholder="Permanent resolution..."
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Findings</label>
          <textarea 
            rows={2}
            value={feedbackNotes}
            onChange={e => setFeedbackNotes(e.target.value)}
            placeholder="Specific findings for the report..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Evidence Photos ({photos.length}/10)</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, idx) => (
              <div key={idx} className={`aspect-square relative rounded-xl overflow-hidden border shadow-sm group ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <img src={src} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  type="button"
                  onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg active:scale-90 transition-transform cursor-pointer"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 10 && !isProcessing && (
              <>
                <button 
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-500 active:bg-blue-900/20 active:text-blue-400' : 'border-slate-300 bg-slate-50 text-slate-400 active:bg-blue-50 active:text-blue-500'}`}
                >
                  <Camera size={24} className="mb-1" />
                  <span className="text-[8px] font-black">CAMERA</span>
                </button>
                <button 
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-500 active:bg-blue-900/20 active:text-blue-400' : 'border-slate-300 bg-slate-50 text-slate-400 active:bg-blue-50 active:text-blue-500'}`}
                >
                  <ImageIcon size={24} className="mb-1" />
                  <span className="text-[8px] font-black">GALLERY</span>
                </button>
              </>
            )}
            {isProcessing && (
              <div className="aspect-square border-2 border-blue-500/20 rounded-xl flex flex-col items-center justify-center text-blue-500 bg-blue-500/10 animate-pulse">
                <Loader2 size={24} className="animate-spin mb-1" />
                <span className="text-[8px] font-black">OPTIMIZING</span>
              </div>
            )}
          </div>
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
          <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
        </div>

        <div className="pt-4 flex gap-3 pb-12">
          <button type="button" onClick={onBack} className={`flex-1 py-4 border rounded-xl font-black text-sm transition-colors cursor-pointer ${darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
            CANCEL
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Save size={18} /> {initialData ? 'UPDATE' : 'SAVE DEFECT'}
          </button>
        </div>
      </div>
    </div>
  );
};