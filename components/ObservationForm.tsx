import React, { useState, useRef, useEffect } from 'react';
import { AssetCategory, RiskLevel, Observation } from '../types.ts';
import { Camera, ChevronLeft, Plus, Minus, X, Scan, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../services/imageResizer.ts';
import { ConfirmModal } from './ConfirmModal.tsx';
import { PhotoEditor } from './PhotoEditor.tsx';
// @ts-ignore
import { Html5Qrcode } from 'html5-qrcode';

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
  const scannerInstance = useRef<any>(null);

  const stopScanner = async () => {
    if (scannerInstance.current) {
      try {
        if (scannerInstance.current.isScanning) {
          await scannerInstance.current.stop();
        }
      } catch (err) {
        console.error("Error cleaning up scanner:", err);
      }
      scannerInstance.current = null;
    }
    setIsScanning(false);
    setScanError(null);
  };

  const startScanner = async () => {
    setIsScanning(true);
    setScanError(null);
    
    // Short delay to ensure the DOM container #qr-reader is rendered
    setTimeout(async () => {
      try {
        const scannerId = "qr-reader";
        const scanner = new Html5Qrcode(scannerId);
        scannerInstance.current = scanner;

        const config = { 
          fps: 15, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        };

        // Use standard camera constraints that work better on managed devices
        await scanner.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText: string) => {
            setAssetId(decodedText);
            if ('vibrate' in navigator) navigator.vibrate(100);
            stopScanner();
          },
          () => {
            // Frame scan failure - ignore to keep scanning
          }
        );
      } catch (err: any) {
        console.error("Failed to start scanner:", err);
        setScanError(err.message || "Camera access failed. Check your browser permissions or Work Profile restrictions.");
      }
    }, 150);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    const filesToProcess = Array.from(files).slice(0, 10 - photos.length) as File[];
    for (const file of filesToProcess) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
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
  const inputClass = `w-full p-4 rounded-xl border outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 focus:border-blue-500'}`;

  return (
    <div className={`flex flex-col h-full ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className={`p-4 border-b flex items-center justify-between z-20 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <button onClick={() => setShowBackWarning(true)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-500/10 rounded-full transition-colors"><ChevronLeft size={24} /></button>
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
              <button onClick={startScanner} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600/20 transition-colors shadow-sm"><Scan size={18} /></button>
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
            <div className={`flex items-center border rounded-xl h-[54px] ${darkMode ? 'border-slate-700 shadow-inner bg-slate-800/20' : 'border-slate-300 bg-slate-50'}`}>
              <button onClick={() => setCount(Math.max(1, count - 1))} className="flex-1 text-red-500 hover:bg-red-500/5 h-full rounded-l-xl transition-colors font-black text-xl leading-none">－</button>
              <div className="w-12 text-center font-black">{count}</div>
              <button onClick={() => setCount(count + 1)} className="flex-1 text-emerald-500 hover:bg-emerald-500/5 h-full rounded-r-xl transition-colors font-black text-xl leading-none">＋</button>
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Findings & Observations</label>
          <textarea rows={3} value={feedbackNotes} onChange={e => setFeedbackNotes(e.target.value)} className={inputClass} placeholder="Describe the physical condition..." />
        </div>

        <div>
          <label className={labelClass}>Photos ({photos.length}/10)</label>
          <div className="grid grid-cols-3 gap-3">
            {photos.map((src, idx) => (
              <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-slate-700/30 group">
                <img src={src} className="w-full h-full object-cover" alt="" />
                <button onClick={() => setPhotos(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
              </div>
            ))}
            {photos.length < 10 && (
              <>
                <button onClick={() => cameraInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all bg-slate-500/5 group">
                  <Camera size={24} className="group-active:scale-90 transition-transform" />
                  <span className="text-[8px] font-black mt-1 uppercase tracking-widest">Camera</span>
                </button>
                <button onClick={() => galleryInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all bg-slate-500/5 group">
                  <ImageIcon size={24} className="group-active:scale-90 transition-transform" />
                  <span className="text-[8px] font-black mt-1 uppercase tracking-widest">Gallery</span>
                </button>
              </>
            )}
          </div>
          <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
          <input type="file" ref={galleryInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
        </div>

        <div className="pt-8 flex gap-3">
          <button onClick={() => setShowBackWarning(true)} className={`flex-1 py-5 border rounded-xl font-black text-xs tracking-widest transition-all ${darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}>DISCARD</button>
          <button onClick={handleSave} disabled={isProcessing} className="flex-1 py-5 bg-blue-600 text-white rounded-xl font-black text-xs tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">SAVE FINDING</button>
        </div>
      </div>

      {isScanning && (
        <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
          {scanError ? (
            <div className="p-8 text-center space-y-6">
               <div className="bg-red-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
                 <AlertCircle size={48} className="text-red-500" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-white font-black uppercase tracking-[0.1em] text-lg">Scanner Error</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">{scanError}</p>
               </div>
               <button onClick={stopScanner} className="bg-white text-black px-12 py-4 rounded-xl font-black text-xs tracking-[0.2em] shadow-xl hover:bg-slate-100 active:scale-95 transition-all">CLOSE</button>
            </div>
          ) : (
            <>
              <div id="qr-reader" className="w-full h-full"></div>
              <div className="absolute inset-0 border-[50px] border-black/70 pointer-events-none">
                <div className="w-full h-full border-2 border-blue-500/30 rounded-[40px] relative">
                  <div className="absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"></div>
                  <div className="absolute top-6 left-0 right-0 text-center">
                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-5 py-2.5 rounded-full border border-white/20 tracking-[0.3em] uppercase">Target Barcode</span>
                  </div>
                </div>
              </div>
              <button onClick={stopScanner} className="absolute bottom-12 bg-white text-black px-14 py-5 rounded-full font-black text-xs tracking-[0.2em] shadow-2xl active:scale-90 transition-all uppercase">Exit Scanner</button>
            </>
          )}
        </div>
      )}

      {editingPhotoIndex !== null && <PhotoEditor base64={photos[editingPhotoIndex]} onSave={(newB: string) => {
        const updated = [...photos]; updated[editingPhotoIndex] = newB; setPhotos(updated); setEditingPhotoIndex(null);
      }} onCancel={() => setEditingPhotoIndex(null)} darkMode={darkMode} />}
      
      <ConfirmModal isOpen={showBackWarning} onClose={() => setShowBackWarning(false)} onConfirm={onBack} title="DISCARD DATA?" message="This will delete everything you just entered for this observation." darkMode={darkMode} />
    </div>
  );
};