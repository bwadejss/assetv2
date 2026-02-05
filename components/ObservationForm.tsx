
import React, { useState, useRef, useEffect } from 'react';
import { AssetCategory, RiskLevel, Observation } from '../types.ts';
import { Camera, ChevronLeft, Plus, Minus, Save, X, Image as ImageIcon, Loader2, Scan, Edit3, AlertCircle, RefreshCcw } from 'lucide-react';
import { compressImage } from '../services/imageResizer.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { PhotoEditor } from './PhotoEditor.tsx';

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
  const [scanError, setScanError] = useState<string | null>(null);
  const [showBackWarning, setShowBackWarning] = useState(false);
  
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const scannerVideoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const stopScanner = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (scannerVideoRef.current && scannerVideoRef.current.srcObject) {
      const stream = scannerVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      scannerVideoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setScanError(null);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      // Enterprise Android Profiles need high-compatibility constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        // Native Barcode Support Check
        if (!('BarcodeDetector' in window)) {
           setScanError("This browser doesn't support native scanning. Please enter ID manually or use a modern browser.");
           return;
        }

        const detector = new (window as any).BarcodeDetector({ formats: ['code_128', 'qr_code', 'ean_13'] });
        
        scanIntervalRef.current = window.setInterval(async () => {
          if (!scannerVideoRef.current || scannerVideoRef.current.readyState < 2) return;
          try {
            const barcodes = await detector.detect(scannerVideoRef.current);
            if (barcodes.length > 0) {
              setAssetId(barcodes[0].rawValue);
              if ('vibrate' in navigator) navigator.vibrate(100);
              stopScanner();
            }
          } catch (e) {
            // Silently retry frame
          }
        }, 500);
      }
    } catch (err: any) {
      setScanError(`Camera Access Blocked: ${err.message || 'Check permissions'}`);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    // Explicitly casting the array from FileList to File[] for robust typing
    const filesToProcess = Array.from(files).slice(0, 10 - photos.length) as File[];
    for (const file of filesToProcess) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        // Explicitly cast file as Blob to satisfy TypeScript in environments with weak FileList inference
        reader.readAsDataURL(file as Blob);
      });
      const optimized = await compressImage(base64);
      setPhotos(prev => [...prev, optimized]);
    }
    setIsProcessing(false);
    if (e.target) e.target.value = '';
  };

  const handleSave = () => {
    if (!assetName) { alert("Asset Name is required."); return; }
    onSave({
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
    });
  };

  const labelClass = `block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60 ${darkMode ? 'text-slate-400' : 'text-slate-700'}`;
  const inputClass = `w-full p-4 rounded-xl border outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`;

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`p-4 border-b flex items-center justify-between z-20 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button onClick={() => setShowBackWarning(true)} className="p-2 -ml-2 text-slate-500"><ChevronLeft size={24} /></button>
        <h2 className="font-black text-xs uppercase tracking-[0.15em]">{initialData ? 'Edit Defect' : 'Log New Defect'}</h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-64">
        <div>
          <label className={labelClass}>Asset Name / Description *</label>
          <input type="text" value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="e.g. Pump 01 Motor" className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Asset ID / Tag</label>
            <div className="relative">
              <input type="text" value={assetId} onChange={e => setAssetId(e.target.value)} className={inputClass} />
              <button onClick={startScanner} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600/10 text-blue-500 rounded-lg"><Scan size={18} /></button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Risk Level</label>
            <select value={risk} onChange={e => setRisk(e.target.value as RiskLevel)} className={inputClass}>
              <option value={RiskLevel.LOW}>Low</option>
              <option value={RiskLevel.MED}>Medium</option>
              <option value={RiskLevel.HI}>High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Previously Seen?</label>
            <select value={previouslySeen} onChange={e => setPreviouslySeen(e.target.value as 'Yes' | 'No')} className={inputClass}>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Defect Count</label>
            <div className={`flex items-center border rounded-xl h-[54px] ${darkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <button onClick={() => setCount(Math.max(1, count - 1))} className="flex-1 text-red-500"><Minus size={18} /></button>
              <div className="w-12 text-center font-black">{count}</div>
              <button onClick={() => setCount(count + 1)} className="flex-1 text-emerald-500"><Plus size={18} /></button>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Findings & Observations</label>
          <textarea rows={3} value={feedbackNotes} onChange={e => setFeedbackNotes(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Photos ({photos.length}/10)</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, idx) => (
              <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <button onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X size={12} /></button>
              </div>
            ))}
            {photos.length < 10 && (
              <button onClick={() => cameraInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400">
                <Camera size={24} />
                <span className="text-[8px] font-black mt-1">CAMERA</span>
              </button>
            )}
          </div>
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
        </div>

        <div className="pt-8 flex gap-3">
          <button onClick={() => setShowBackWarning(true)} className="flex-1 py-5 border rounded-xl font-black text-sm">DISCARD</button>
          <button onClick={handleSave} disabled={isProcessing} className="flex-1 py-5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-xl">SAVE</button>
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center">
          {scanError ? (
            <div className="p-8 text-center space-y-4">
               <AlertCircle size={48} className="text-red-500 mx-auto" />
               <p className="text-white text-sm">{scanError}</p>
               <button onClick={stopScanner} className="bg-white text-black px-8 py-3 rounded-xl font-black">CLOSE</button>
            </div>
          ) : (
            <>
              <video ref={scannerVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none">
                <div className="w-full h-full border-2 border-blue-500 rounded-2xl relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/50 animate-pulse"></div>
                </div>
              </div>
              <button onClick={stopScanner} className="absolute bottom-10 bg-white text-black px-12 py-5 rounded-full font-black text-xs">EXIT SCANNER</button>
            </>
          )}
        </div>
      )}

      {editingPhotoIndex !== null && <PhotoEditor base64={photos[editingPhotoIndex]} onSave={(newB) => {
        const updated = [...photos]; updated[editingPhotoIndex] = newB; setPhotos(updated); setEditingPhotoIndex(null);
      }} onCancel={() => setEditingPhotoIndex(null)} darkMode={darkMode} />}
      
      <ConfirmModal isOpen={showBackWarning} onClose={() => setShowBackWarning(false)} onConfirm={onBack} title="DISCARD?" message="All data will be lost." darkMode={darkMode} />
    </div>
  );
};
