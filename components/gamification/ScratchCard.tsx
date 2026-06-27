'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface ScratchCardProps {
  coverImage?: string;
  primaryColor?: string;
  onScratch: () => Promise<{ result: string; isWin: boolean; message: string; playId: string }>;
  disabled?: boolean;
}

export default function ScratchCard({ primaryColor = '#f59e0b', onScratch, disabled }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [result, setResult] = useState<{ result: string; isWin: boolean; message: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const scratchedRef = useRef(false);
  const resultRef = useRef<{ result: string; isWin: boolean; message: string } | null>(null);

  const CARD_WIDTH = 320;
  const CARD_HEIGHT = 200;

  // Initialize the scratch overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed || disabled) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CARD_WIDTH * dpr;
    canvas.height = CARD_HEIGHT * dpr;
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Metallic gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
    gradient.addColorStop(0, '#C0C0C0');
    gradient.addColorStop(0.25, '#D8D8D8');
    gradient.addColorStop(0.5, '#A8A8A8');
    gradient.addColorStop(0.75, '#D0D0D0');
    gradient.addColorStop(1, '#B8B8B8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Add shimmer pattern
    for (let i = 0; i < 100; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * CARD_WIDTH,
        Math.random() * CARD_HEIGHT,
        Math.random() * 3 + 0.5,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
      ctx.fill();
    }

    // "Scratch Here" text
    ctx.fillStyle = '#666';
    ctx.font = 'bold 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨ Scratch Here ✨', CARD_WIDTH / 2, CARD_HEIGHT / 2);
  }, [revealed, disabled]);

  // Fetch result on first scratch
  const fetchResult = useCallback(async () => {
    if (scratchedRef.current || disabled) return;
    scratchedRef.current = true;
    setLoading(true);

    try {
      const serverResult = await onScratch();
      resultRef.current = serverResult;
      setResult(serverResult);
    } catch (err: any) {
      resultRef.current = { result: 'Error', isWin: false, message: err?.message || 'Something went wrong' };
      setResult(resultRef.current);
    } finally {
      setLoading(false);
    }
  }, [onScratch, disabled]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x * dpr, y * dpr, 22 * dpr, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const percent = (transparent / (imageData.data.length / 4)) * 100;
    setScratchPercent(percent);

    // Auto-reveal at 55%
    if (percent > 55 && !revealed) {
      setRevealed(true);
    }
  }, [revealed]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || revealed) return;
    e.preventDefault();
    setIsScratching(true);
    fetchResult();
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || disabled || revealed) return;
    e.preventDefault();
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => {
    setIsScratching(false);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Card Container */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        {/* Prize layer (under the scratch overlay) */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${
          revealed ? 'opacity-100' : 'opacity-100'
        }`}>
          {result ? (
            <div className={`text-center p-6 w-full h-full flex flex-col items-center justify-center ${
              result.isWin
                ? 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100'
                : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'
            }`}>
              <div className="text-4xl mb-2">{result.isWin ? '🎉' : '😢'}</div>
              <h3 className={`text-xl font-black mb-1 ${result.isWin ? 'text-amber-600' : 'text-gray-500'}`}>
                {result.isWin ? result.result : 'No Win'}
              </h3>
              <p className="text-sm text-gray-600">{result.message}</p>
            </div>
          ) : loading ? (
            <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-white">
              <svg className="animate-spin h-8 w-8 text-gray-400 mb-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-gray-400 text-sm font-medium">Revealing...</span>
            </div>
          ) : (
            <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
              <div className="text-4xl mb-2">🎁</div>
              <p className="text-gray-400 font-medium text-sm">Scratch to reveal your prize!</p>
            </div>
          )}
        </div>

        {/* Scratch Canvas Overlay */}
        {!revealed && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair touch-none"
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        )}

        {/* Border */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 3px ${primaryColor}` }}
        />
      </div>

      {/* Progress hint */}
      {!revealed && scratchPercent > 0 && scratchPercent < 55 && (
        <p className="text-sm text-gray-400 animate-pulse">Keep scratching! {Math.round(scratchPercent)}% revealed</p>
      )}

      {/* Revealed result card */}
      {revealed && result && (
        <div className={`text-center p-4 rounded-xl border-2 w-full max-w-sm animate-in fade-in zoom-in duration-500 ${
          result.isWin
            ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
        }`}>
          <p className="font-medium text-gray-700">{result.message}</p>
          {result.isWin && (
            <div className="mt-3 px-4 py-2 bg-white rounded-lg border border-amber-200 inline-block">
              <span className="text-sm text-gray-500">Your prize:</span>
              <span className="block text-lg font-black text-amber-600">{result.result}</span>
            </div>
          )}
        </div>
      )}

      {disabled && (
        <p className="text-sm text-gray-400 font-medium">You&apos;ve already played!</p>
      )}
    </div>
  );
}
