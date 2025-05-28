import React, { FC, useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signatureImage: string) => void;
  onBegin?: () => void;
  onEnd?: () => void;
}

const SignaturePad: FC<SignaturePadProps> = ({ onSave, onBegin, onEnd }) => {
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState<boolean>(true);

  const clearSignature = () => {
    sigCanvasRef.current?.clear();
    setIsCanvasEmpty(true);
    if (onEnd) onEnd(); 
  };

  const saveSignature = () => {
    if (sigCanvasRef.current && !isCanvasEmpty) {
      const signatureImage = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      onSave(signatureImage);
    } else {
      // This case should ideally be prevented by disabling the button
      // Consider a small, non-blocking notification if needed, or rely on button state.
    }
  };

  const handleBeginStroke = () => {
    setIsCanvasEmpty(false);
    if (onBegin) onBegin();
  };

  const handleEndStroke = () => {
    if (sigCanvasRef.current) {
      setIsCanvasEmpty(sigCanvasRef.current.isEmpty());
    }
    if (onEnd) onEnd();
  };
  
  useEffect(() => {
    if (sigCanvasRef.current) {
        setIsCanvasEmpty(sigCanvasRef.current.isEmpty());
    }
  }, [sigCanvasRef]);


  return (
    <div className="w-full flex flex-col items-center">
      {/* The h3 title is now part of page.tsx or the consuming component for better layout control */}
      {/* <h3 className="text-lg font-medium text-slate-700 mb-3">Sign Here</h3> */}
      
      <div 
        className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 cursor-crosshair overflow-hidden shadow-inner hover:border-sky-400 focus-within:border-sky-500 transition-colors duration-150 ease-in-out"
        // Add tabIndex to make the div focusable, so focus-within works if needed, though SignatureCanvas might handle focus.
        tabIndex={0} 
      >
        <SignatureCanvas
          ref={sigCanvasRef}
          penColor="black"
          canvasProps={{
            // className: 'w-full h-full bg-white', // Original, bg-white can be good.
            className: 'w-full h-full', // Transparent bg, parent div provides visual
            // width and height props on canvasProps directly set canvas element dimensions, not via CSS
          }}
          onBegin={handleBeginStroke}
          onEnd={handleEndStroke}
          backgroundColor="rgba(255,255,255,0)" // Keep data transparent
        />
      </div>
      <div className="flex justify-between w-full mt-4 space-x-3">
        <button
          type="button"
          onClick={clearSignature}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-all duration-150 ease-in-out w-1/2"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={saveSignature}
          disabled={isCanvasEmpty}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out w-1/2
            ${isCanvasEmpty
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-sky-600 hover:bg-sky-700 focus:ring-sky-500'
            }`}
        >
          Save Signature
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
