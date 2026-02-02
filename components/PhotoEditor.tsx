
import React, { useRef, useState, useEffect } from 'react';
import { X, Check, ArrowRight, Circle as CircleIcon, RotateCcw, Trash2 } from 'lucide-react';

interface PhotoEditorProps {
  base64: string;
  onSave: (newBase64: string) => void;
  onCancel: () => void;
  darkMode: boolean;
}

type EditMode = 'ARROW' | 'CIRCLE';

interface Shape {
  type: EditMode;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({ base64, onSave, onCancel, darkMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<EditMode>('ARROW');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);

  const drawAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background image
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      // Ensure canvas matches image size
      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      ctx.drawImage(img, 0, 0);

      // Draw all shapes
      [...shapes, ...(currentShape ? [currentShape] : [])].forEach(shape => {
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = Math.max(8, canvas.width / 50); // Scale line width to image size
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (shape.type === 'ARROW') {
          drawArrow(ctx, shape.startX, shape.startY, shape.endX, shape.endY);
        } else {
          drawCircle(ctx, shape.startX, shape.startY, shape.endX, shape.endY);
        }
      });
    };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headlen = Math.max(20, ctx.canvas.width / 20);
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    ctx.stroke();
  };

  useEffect(() => {
    drawAll();
  }, [shapes, currentShape, base64]);

  const getPointerPos = (e: React.PointerEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.PointerEvent).clientY;
    
    // Scale to internal canvas dimensions
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.PointerEvent) => {
    setIsDrawing(true);
    const { x, y } = getPointerPos(e);
    setCurrentShape({
      type: mode,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      color: '#EF4444' // Red highlight
    });
  };

  const handleMove = (e: React.PointerEvent) => {
    if (!isDrawing || !currentShape) return;
    const { x, y } = getPointerPos(e);
    setCurrentShape({ ...currentShape, endX: x, endY: y });
  };

  const handleEnd = () => {
    if (isDrawing && currentShape) {
      setShapes([...shapes, currentShape]);
    }
    setIsDrawing(false);
    setCurrentShape(null);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/jpeg', 0.8));
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in duration-200">
      <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <button onClick={onCancel} className="p-2 text-slate-400"><X size={24} /></button>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Highlight Defect</span>
        <button onClick={handleSave} className="p-2 text-emerald-500"><Check size={24} /></button>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
        <canvas 
          ref={canvasRef}
          onPointerDown={handleStart}
          onPointerMove={handleMove}
          onPointerUp={handleEnd}
          onPointerLeave={handleEnd}
          className="max-w-full max-h-full object-contain shadow-2xl touch-none"
          style={{ cursor: 'crosshair' }}
        />
      </div>

      <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-center items-center gap-6">
        <button 
          onClick={() => setMode('ARROW')}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${mode === 'ARROW' ? 'bg-blue-600 text-white shadow-lg scale-110' : 'text-slate-500 hover:bg-slate-800'}`}
        >
          <ArrowRight size={24} />
          <span className="text-[8px] font-black tracking-widest">ARROW</span>
        </button>
        <button 
          onClick={() => setMode('CIRCLE')}
          className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${mode === 'CIRCLE' ? 'bg-blue-600 text-white shadow-lg scale-110' : 'text-slate-500 hover:bg-slate-800'}`}
        >
          <CircleIcon size={24} />
          <span className="text-[8px] font-black tracking-widest">CIRCLE</span>
        </button>
        <div className="w-[1px] h-10 bg-slate-800 mx-2" />
        <button 
          onClick={() => setShapes(prev => prev.slice(0, -1))}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl text-slate-400 active:bg-slate-800"
        >
          <RotateCcw size={20} />
          <span className="text-[8px] font-black">UNDO</span>
        </button>
        <button 
          onClick={() => setShapes([])}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl text-red-500 active:bg-red-950/20"
        >
          <Trash2 size={20} />
          <span className="text-[8px] font-black">CLEAR</span>
        </button>
      </div>
    </div>
  );
};
