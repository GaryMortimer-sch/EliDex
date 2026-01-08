
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { fetchPokemonList } from '../services/pokeApi';

interface CameraScannerProps {
  onClose: () => void;
  onIdentified: (name: string) => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onClose, onIdentified }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<any>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Initializing Pokedex Vision...');
  const [error, setError] = useState<string | null>(null);
  const [pokemonNames, setPokemonNames] = useState<string[]>([]);

  // Load the list of names for fuzzy matching
  useEffect(() => {
    fetchPokemonList(151).then(list => {
      setPokemonNames(list.map(p => p.name.toLowerCase()));
    });
  }, []);

  // Initialize persistent Tesseract worker
  useEffect(() => {
    async function initWorker() {
      try {
        const worker = await createWorker('eng');
        workerRef.current = worker;
        setStatus('Ready to scan');
      } catch (err) {
        setError('Failed to initialize OCR engine.');
      }
    }
    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const findPokemonInText = (text: string): string | null => {
    const words = text.toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    for (const word of words) {
      // Direct match
      if (pokemonNames.includes(word)) return word;
      
      // Fuzzy match (very simple: check if word is contained in a pokemon name or vice versa)
      const fuzzyMatch = pokemonNames.find(name => 
        name.includes(word) || word.includes(name)
      );
      if (fuzzyMatch) return fuzzyMatch;
    }
    return null;
  };

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning || !workerRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    // We want to capture the area inside our visual "Target Frame"
    // Calculate relative coordinates
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    // The HUD frame is roughly 320x320 on screen, but we'll scan a larger center portion
    const scanSize = Math.min(videoWidth, videoHeight) * 0.8;
    const startX = (videoWidth - scanSize) / 2;
    const startY = (videoHeight - scanSize) / 2;

    context.drawImage(
      videoRef.current, 
      startX, startY, scanSize, scanSize, 
      0, 0, canvasRef.current.width, canvasRef.current.height
    );
    
    try {
      setStatus('Analyzing subject...');
      const { data: { text } } = await workerRef.current.recognize(canvasRef.current);

      const foundName = findPokemonInText(text);

      if (foundName) {
        setStatus(`Visual Match: ${foundName.toUpperCase()}`);
        // Add a slight delay for visual feedback before navigating
        setTimeout(() => onIdentified(foundName), 800);
      } else {
        setStatus('Scanning for signature...');
        if (isScanning) {
          // Faster cycle now that worker is persistent
          setTimeout(processFrame, 500); 
        }
      }
    } catch (err) {
      console.error('Vision error:', err);
      if (isScanning) setTimeout(processFrame, 1000);
    }
  }, [isScanning, onIdentified, pokemonNames]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsScanning(true);
        }
      } catch (err) {
        setError('Camera access denied. Check browser permissions.');
      }
    }

    if (pokemonNames.length > 0) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [pokemonNames]);

  useEffect(() => {
    if (isScanning && workerRef.current) {
      processFrame();
    }
  }, [isScanning, processFrame]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans">
      <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Camera Feed */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        
        {/* Processing Canvas (scaled for OCR efficiency) */}
        <canvas ref={canvasRef} className="hidden" width="400" height="400" />

        {/* Scanner HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          
          {/* Main Large Target Frame */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 border border-white/20 rounded-3xl backdrop-blur-[1px]">
            {/* Pulsing Corners */}
            <div className="absolute -top-2 -left-2 w-12 h-12 border-t-4 border-l-4 border-red-500 rounded-tl-xl animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-12 h-12 border-t-4 border-r-4 border-red-500 rounded-tr-xl animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-12 h-12 border-b-4 border-l-4 border-red-500 rounded-bl-xl animate-pulse"></div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 border-b-4 border-r-4 border-red-500 rounded-br-xl animate-pulse"></div>
            
            {/* Central Crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-40">
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white"></div>
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white"></div>
            </div>

            {/* Fast Scanning Line */}
            <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-[scan_1.5s_infinite_ease-in-out]"></div>
          </div>
          
          {/* Floating UI Badges */}
          <div className="absolute top-12 flex flex-col items-center gap-2">
            <div className="bg-red-600/90 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 border border-red-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              Subject Recognition Active
            </div>
            <div className="text-white/40 text-[9px] font-mono uppercase">Resolution: 400x400 / Filter: OCR-MAX</div>
          </div>

          <div className="absolute bottom-12 px-8 py-3 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 text-white font-mono text-sm tracking-wide min-w-[240px] text-center shadow-2xl">
            <span className="text-red-500 mr-2">»</span> {status}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-950 p-8 flex justify-center border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button 
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-wider text-sm shadow-xl active:scale-95 transition-all flex items-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Abort Scan
        </button>
      </div>

      {error && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-10 text-center z-[110]">
          <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-white text-lg font-bold mb-2">Optical Sensor Error</p>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">{error}</p>
          </div>
          <button onClick={onClose} className="bg-white text-black px-8 py-3 rounded-xl font-bold">Return to Dex</button>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CameraScanner;
