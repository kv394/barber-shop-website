'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Prize {
  label: string;
  value: string;
  probability: number;
  color: string;
}

interface SpinWheelProps {
  prizes: Prize[];
  onSpin: () => Promise<{ result: string; isWin: boolean; message: string; playId: string }>;
  disabled?: boolean;
  primaryColor?: string;
}

export default function SpinWheel({ prizes, onSpin, disabled, primaryColor = '#f59e0b' }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ result: string; isWin: boolean; message: string } | null>(null);
  const [rotation, setRotation] = useState(0);
  const animRef = useRef<number | null>(null);
  const resultRef = useRef<{ result: string; isWin: boolean; message: string } | null>(null);

  const segmentAngle = (2 * Math.PI) / prizes.length;

  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  ];

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 320;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    // Draw segments
    prizes.forEach((prize, i) => {
      const startAngle = rot + i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color || defaultColors[i % defaultColors.length];
      ctx.fill();

      // Segment border
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;

      const label = prize.label.length > 14 ? prize.label.substring(0, 12) + '…' : prize.label;
      ctx.fillText(label, radius - 18, 5);
      ctx.restore();
    });

    // Center circle
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#e5e7eb');
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();

    // "SPIN" text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'transparent';
    ctx.fillText('SPIN', cx, cy);

    // Pointer
    ctx.beginPath();
    ctx.moveTo(cx + radius + 6, cy);
    ctx.lineTo(cx + radius - 16, cy - 12);
    ctx.lineTo(cx + radius - 16, cy + 12);
    ctx.closePath();
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();

    // Tick marks on outer ring
    for (let i = 0; i < prizes.length * 2; i++) {
      const angle = (i * Math.PI) / prizes.length;
      const innerR = radius + 1;
      const outerR = radius + 7;
      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
      ctx.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    }
  }, [prizes, segmentAngle, primaryColor, defaultColors]);

  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, drawWheel]);

  const handleSpin = async () => {
    if (spinning || disabled) return;
    setSpinning(true);
    setResult(null);
    resultRef.current = null;

    // Get the result from the server first
    try {
      const serverResult = await onSpin();
      resultRef.current = serverResult;

      // Find the winning segment index
      let winIndex = prizes.findIndex(p => p.label === serverResult.result);
      if (winIndex === -1) winIndex = 0;

      // Calculate target rotation to land on the winning segment
      // The pointer is at 0 radians (right side), so we need the segment to be at the pointer
      const targetSegmentCenter = winIndex * segmentAngle + segmentAngle / 2;
      const extraSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
      const targetRotation = -(extraSpins * 2 * Math.PI + targetSegmentCenter);

      // Animate the spin
      const startRotation = rotation;
      const totalRotation = targetRotation - startRotation;
      const duration = 4000 + Math.random() * 1000; // 4-5 seconds
      const startTime = performance.now();

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic ease-out for realistic deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentRotation = startRotation + totalRotation * eased;

        setRotation(currentRotation);

        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          setResult(resultRef.current);
        }
      };

      animRef.current = requestAnimationFrame(animate);
    } catch (err: any) {
      setSpinning(false);
      setResult({ result: 'Error', isWin: false, message: err?.message || 'Something went wrong' });
    }
  };

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Wheel Container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="cursor-pointer select-none"
          onClick={handleSpin}
          style={{ filter: spinning ? 'none' : 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }}
        />

        {/* Spinning glow effect */}
        {spinning && (
          <div
            className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
            style={{
              boxShadow: `0 0 40px ${primaryColor}40, 0 0 80px ${primaryColor}20`,
            }}
          />
        )}
      </div>

      {/* Spin Button */}
      {!result && (
        <button
          onClick={handleSpin}
          disabled={spinning || disabled}
          className="px-8 py-3 rounded-xl font-black text-white text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
            boxShadow: `0 4px 20px ${primaryColor}40`,
          }}
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Spinning...
            </span>
          ) : disabled ? 'Play Limit Reached' : 'Spin the Wheel!'}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className={`text-center p-6 rounded-2xl border-2 w-full max-w-sm animate-in fade-in zoom-in duration-500 ${
          result.isWin
            ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300'
            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
        }`}>
          {result.isWin && (
            <div className="text-4xl mb-3 animate-bounce">🎉</div>
          )}
          <h3 className={`text-xl font-black mb-2 ${result.isWin ? 'text-amber-600' : 'text-gray-600'}`}>
            {result.isWin ? 'You Won!' : 'Better Luck Next Time'}
          </h3>
          <p className="text-gray-700 font-medium">{result.message}</p>
          {result.isWin && (
            <div className="mt-4 px-4 py-2 bg-white rounded-lg border border-amber-200 inline-block">
              <span className="text-sm text-gray-500">Your prize:</span>
              <span className="block text-lg font-black text-amber-600">{result.result}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
