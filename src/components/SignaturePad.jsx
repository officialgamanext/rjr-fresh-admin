import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';

const SignaturePad = ({ onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set display size (css)
    const size = canvas.getBoundingClientRect();
    canvas.width = size.width;
    canvas.height = size.height;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasData(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasData(false);
  };

  const handleSave = () => {
    if (!hasData) return;
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      onSave(blob);
    }, 'image/png');
  };

  return (
    <div className="signature-pad-container">
      <div className="sig-pad-header">
        <h4>Draw Customer Signature</h4>
        <button className="btn-close-sig" onClick={onCancel}><X size={20}/></button>
      </div>
      
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />
      </div>

      <div className="sig-pad-footer">
        <button className="btn-clear" onClick={clear}><RotateCcw size={16}/> Clear</button>
        <div className="flex-grow"></div>
        <button className="btn-save-sig" onClick={handleSave} disabled={!hasData}><Check size={16}/> Use Signature</button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .signature-pad-container {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }
        .sig-pad-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .sig-pad-header h4 { margin: 0; color: #0f172a; font-weight: 700; }
        .canvas-wrapper {
          background: #f8fafc;
          height: 250px;
          position: relative;
        }
        .canvas-wrapper canvas {
          width: 100%;
          height: 100%;
          cursor: crosshair;
        }
        .sig-pad-footer {
          padding: 16px 20px;
          display: flex;
          gap: 12px;
          background: white;
        }
        .btn-clear {
          padding: 10px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 10px;
          font-weight: 600;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-save-sig {
          padding: 10px 24px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-save-sig:disabled { opacity: 0.5; }
        .flex-grow { flex-grow: 1; }
        .btn-close-sig { background: none; border: none; cursor: pointer; color: #94a3b8; }
      `}} />
    </div>
  );
};

export default SignaturePad;
