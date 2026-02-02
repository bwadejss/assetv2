
import React, { useState, useRef } from 'react';
import { AssetCategory, RiskLevel, Observation } from '../types';
import { Camera, ChevronLeft, Plus, Minus, Save, X, Image as ImageIcon, Loader2, Scan, Edit3 } from 'lucide-react';
import { compressImage } from '../services/imageResizer';
import { ConfirmModal } from './ConfirmModal';
import { PhotoEditor } from './PhotoEditor';

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
  
  const [feedbackNotes, setFeedbackNotes] = useState(initialData?.feedbackNotes || '');
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  
  // Editor state
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const scannerVideoRef = useRef<HTMLVideoElement>(null);

  const startScanner = async () => {
    if (!('BarcodeDetector' in window)) {
      alert("Barcode scanning is not supported in this browser.");
      return;
    }
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        // @ts-ignore
        const barcodeDetector = new BarcodeDetector({ formats: ['code_128', 'ean_13', 'qr_code', 'code_39'] });
        const scanFrame = async () => {
          if (!isScanning) return;
          try {
            const barcodes = await barcodeDetector.detect(scannerVideoRef.current!);
            if (barcodes.length > 0) {
              setAssetId(barcodes[0].rawValue);
              stopScanner();
            } else {
              requestAnimationFrame(scanFrame);
            }
          } catch (e) {
            requestAnimationFrame(scanFrame);
          }
        };
        requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.error("Scanner error:", err);
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    if (scannerVideoRef.current?.srcObject) {
      const stream = scannerVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // Fixed: explicitly cast Array.from(files) to File[] to resolve "unknown" inference in for-of loop and reader.readAsDataURL
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    const filesToProcess = (Array.from(files) as File[]).slice(0, 10 - photos.length);
    for (const file of filesToProcess) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const optimized = await compressImage(base64);
      setPhotos(prev => [...prev, optimized]);
    }
    setIsProcessing(false);
    if (e.target) e.target.value = '';
  };

  const handleSave = () => {
    if (!assetName) {
      alert("Asset Name is required.");
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
      shortTermFix: initialData?.shortTermFix || '', 
      longTermFix: initialData?.longTermFix || '',
      feedbackNotes,
      actionOwner: initialData?.actionOwner || "", 
      notes: initialData?.notes || "",
      photos,
      timestamp: initialData?.timestamp || Date.now()
    };
    onSave(observation);
  };

  const handleUpdatePhoto = (newBase64: string) => {
    if (editingPhotoIndex !== null) {
      const updated = [...photos];
      updated[editingPhotoIndex] = newBase64;
      setPhotos(updated);
      setEditingPhotoIndex(null);
    }
  };

  const inputClass = `w-full p-4 rounded-xl border outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900'}`;
  const labelClass = `block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`;

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 z-20 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button type="button" onClick={() => setShowBackWarning(true)} className="p-2 -ml-2 text-slate-500 hover:text-blue-500 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-black truncate px-2 text-xs uppercase tracking-[0.15em]">
          {initialData ? 'Edit Defect' : 'Log New Defect'}
        </h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-64">
        <div>
          <label className={labelClass}>Asset Name / Description *</label>
          <input 
            type="text" 
            value={assetName}
            onChange={e => setAssetName(e.target.value)}
            placeholder="e.g. Pump 01 Motor"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Asset ID / Tag</label>
            <div className="relative">
              <input 
                type="text" 
                value={assetId}
                onChange={e => setAssetId(e.target.value)}
                placeholder="ID Tag"
                className={`${inputClass} pr-12`}
              />
              <button 
                type="button"
                onClick={startScanner}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600/10 text-blue-500 rounded-lg active:scale-90 transition-all"
              >
                <Scan size={18} />
              </button>
            </div>
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
            <div className={`flex items-center border rounded-xl overflow-hidden h-[54px] shadow-sm ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <button type="button" onClick={() => setCount(Math.max(1, count - 1))} className={`flex-1 h-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-red-50 text-red-600'}`}><Minus size={18} /></button>
              <div className={`w-12 text-center font-black text-lg h-full flex items-center justify-center border-x ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`}>{count}</div>
              <button type="button" onClick={() => setCount(count + 1)} className={`flex-1 h-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}><Plus size={18} /></button>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Findings & Observations</label>
          <textarea 
            rows={3}
            value={feedbackNotes}
            onChange={e => setFeedbackNotes(e.target.value)}
            placeholder="Detailed notes for the report..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Evidence Photos ({photos.length}/10)</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, idx) => (
              <div key={idx} className={`aspect-square relative rounded-xl overflow-hidden border shadow-sm ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                <img src={src} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute top-1 right-1 flex flex-col gap-1">
                  <button 
                    type="button"
                    onClick={() => setEditingPhotoIndex(idx)}
                    className="bg-blue-600 text-white p-2 rounded-full shadow-lg active:scale-90"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}
                    className="bg-red-500 text-white p-2 rounded-full shadow-lg active:scale-90"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            {photos.length < 10 && !isProcessing && (
              <>
                <button type="button" onClick={() => cameraInputRef.current?.click()} className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-500' : 'border-slate-300 bg-white text-slate-400'}`}>
                  <Camera size={24} className="mb-1" />
                  <span className="text-[8px] font-black">CAMERA</span>
                </button>
                <button type="button" onClick={() => galleryInputRef.current?.click()} className={`aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-500' : 'border-slate-300 bg-white text-slate-400'}`}>
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

        <div className="pt-8 flex gap-3 flex-shrink-0">
          <button type="button" onClick={() => setShowBackWarning(true)} className={`flex-1 py-5 border rounded-xl font-black text-sm transition-colors ${darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
            DISCARD
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="flex-1 py-5 bg-blue-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
          >
            <Save size={18} /> {initialData ? 'UPDATE' : 'SAVE DEFECT'}
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center">
          <video ref={scannerVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
            <div className="w-full h-full border-2 border-blue-500 rounded-2xl" />
          </div>
          <button onClick={stopScanner} className="absolute bottom-10 bg-white text-black px-12 py-5 rounded-full font-black text-xs tracking-widest shadow-2xl">
            EXIT SCANNER
          </button>
        </div>
      )}

      {editingPhotoIndex !== null && (
        <PhotoEditor 
          base64={photos[editingPhotoIndex]} 
          onSave={handleUpdatePhoto} 
          onCancel={() => setEditingPhotoIndex(null)} 
          darkMode={darkMode}
        />
      )}

      <ConfirmModal 
        isOpen={showBackWarning} 
        onClose={() => setShowBackWarning(false)} 
        onConfirm={onBack}
        title="DISCARD CHANGES?"
        message="Returning will lose all current form data."
        darkMode={darkMode}
      />
    </div>
  );
};
