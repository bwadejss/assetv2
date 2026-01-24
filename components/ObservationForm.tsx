
import React, { useState, useRef } from 'react';
import { AssetCategory, RiskLevel, Observation } from '../types';
import { Camera, ChevronLeft, Plus, Minus, Save, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '../services/imageResizer';

interface ObservationFormProps {
  category: AssetCategory;
  initialData: Observation | null;
  onSave: (obs: Observation) => void;
  onBack: () => void;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({ category, initialData, onSave, onBack }) => {
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
    // Fix: Explicitly cast to File[] to avoid 'unknown' type issues in some TypeScript configurations
    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];

    for (const file of filesToProcess) {
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          // File extends Blob, so readAsDataURL accepts it
          reader.readAsDataURL(file);
        });
        
        // Compress and resize image before adding to state
        const optimized = await compressImage(base64);
        setPhotos(prev => [...prev, optimized]);
      } catch (err) {
        console.error("Error processing photo:", err);
      }
    }
    
    setIsProcessing(false);
    // Reset inputs so the same file can be selected again if needed
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
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-slate-900 truncate px-2 text-sm uppercase tracking-widest">
          {initialData ? 'Edit Observation' : (category === AssetCategory.NON_MAINTENANCE ? 'Site Issue' : `${category} Observation`)}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Asset Name / Description *</label>
          <input 
            type="text" 
            value={assetName}
            onChange={e => setAssetName(e.target.value)}
            placeholder="e.g. Pump 01 Suction Valve"
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Asset ID</label>
            <input 
              type="text" 
              value={assetId}
              onChange={e => setAssetId(e.target.value)}
              placeholder="Optional"
              className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Seen Prev?</label>
            <select 
              value={previouslySeen}
              onChange={e => setPreviouslySeen(e.target.value as 'Yes' | 'No')}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white outline-none text-slate-900 shadow-sm"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Risk Level</label>
            <select 
              value={risk}
              onChange={e => setRisk(e.target.value as RiskLevel)}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white outline-none text-slate-900 shadow-sm"
            >
              <option value={RiskLevel.LOW}>Low</option>
              <option value={RiskLevel.MED}>Medium</option>
              <option value={RiskLevel.HI}>High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">NC Count</label>
            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden h-[52px] shadow-sm">
              <button 
                onClick={() => setCount(Math.max(1, count - 1))}
                className="flex-1 h-full bg-red-50 text-red-600 active:bg-red-100 flex items-center justify-center transition-colors"
                title="Decrease count"
              >
                <Minus className="w-5 h-5 stroke-[3px]" />
              </button>
              <div className="w-14 text-center font-black text-xl text-slate-900 bg-white h-full flex items-center justify-center border-x">
                {count}
              </div>
              <button 
                onClick={() => setCount(count + 1)}
                className="flex-1 h-full bg-green-50 text-green-600 active:bg-green-100 flex items-center justify-center transition-colors"
                title="Increase count"
              >
                <Plus className="w-5 h-5 stroke-[3px]" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Observation Notes</label>
          <textarea 
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Details about the non-compliance..."
            className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Photos ({photos.length}/10)</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, idx) => (
              <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                <img src={src} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg active:scale-90 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photos.length < 10 && !isProcessing && (
              <>
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 active:bg-blue-50 active:text-blue-500 transition-all"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">CAMERA</span>
                </button>
                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 active:bg-blue-50 active:text-blue-500 transition-all"
                >
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">GALLERY</span>
                </button>
              </>
            )}
            {isProcessing && (
              <div className="aspect-square border-2 border-blue-100 rounded-xl flex flex-col items-center justify-center text-blue-600 bg-blue-50 animate-pulse">
                <Loader2 className="w-6 h-6 animate-spin mb-1" />
                <span className="text-[8px] font-bold">RESIZING...</span>
              </div>
            )}
          </div>
          {/* Dedicated camera input for mobile devices */}
          <input 
            type="file" 
            ref={cameraInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
          {/* General gallery/file input */}
          <input 
            type="file" 
            ref={galleryInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            multiple 
            className="hidden" 
          />
        </div>

        <div className="pt-4 flex gap-3 pb-8">
          <button onClick={onBack} className="flex-1 py-4 border border-slate-300 rounded-xl font-bold text-slate-600 active:bg-slate-50">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> {initialData ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
