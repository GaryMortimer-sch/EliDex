
import React, { useRef, useState, useEffect } from 'react';
import { identifyPokemonFromImage } from '../services/geminiService';

interface CameraScannerProps {
  onClose: () => void;
  onIdentified: (name: string) => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onIdentified }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Camera access denied. Please check your permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      
      try {
        const identifiedName = await identifyPokemonFromImage(base64Image);
        if (identifiedName) {
          onIdentified(identifiedName);
        } else {
          setError("Could not identify a Pokémon. Try again with a clearer view!");
        }
      } catch (err) {
        setError("AI Identification failed. Please check your connection.");
      } finally {
        setIsScanning(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[60] flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full flex flex-col items-center gap-6">
        <div className="flex justify-between items-center w-full text-white px-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            AR Pokedex Scanner
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative w-full aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Scanner Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 -ml-1 -mt-1 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 -mr-1 -mt-1 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 -ml-1 -mb-1 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 -mr-1 -mb-1 rounded-br-lg"></div>
              
              {isScanning && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_linear_infinite]"></div>
              )}
            </div>
          </div>

          {isScanning && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-bold tracking-widest uppercase text-sm">Analyzing Target...</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 text-center w-full">
            {error}
          </div>
        )}

        <div className="flex gap-4 w-full">
          <button
            onClick={captureAndIdentify}
            disabled={isScanning}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-900/20 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Identify Pokemon
          </button>
        </div>

        <p className="text-slate-400 text-xs text-center px-8">
          Point your camera at a Pokémon card, toy, or image. Our AI will analyze the features to find a match in the Pokedex.
        </p>
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CameraScanner;
