'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    const scannerId = 'qr-reader';
    const html5QrCode = new Html5Qrcode(scannerId);
    scannerRef.current = html5QrCode;
    hasScannedRef.current = false;

    const onScanSuccess = (decodedText: string) => {
      // Prevent double-triggers from the same frame burst
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;
      onScan(decodedText);
    };

    // Start with rear camera immediately — no camera picker UI
    html5QrCode
      .start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        onScanSuccess,
        () => {} // Ignore per-frame non-match noise
      )
      .then(() => setIsStarting(false))
      .catch((err) => {
        // Fallback: try any camera if rear isn't available
        html5QrCode
          .start(
            { facingMode: 'user' },
            { fps: 15, qrbox: { width: 260, height: 260 } },
            onScanSuccess,
            () => {}
          )
          .then(() => setIsStarting(false))
          .catch(() => {
            setError('Could not start camera. Please grant camera permissions and try again.');
            setIsStarting(false);
          });
        console.error(err);
      });

    return () => {
      html5QrCode
        .stop()
        .catch(() => {})
        .finally(() => {
          try { html5QrCode.clear(); } catch (_) {}
        });
    };
  }, []); // intentionally empty — mount once

  return (
    <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl p-5 w-full max-w-sm border border-slate-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center z-10 text-sm"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Scan QR / Barcode</h3>
        <p className="text-xs text-gray-400 mb-4">
          Point the camera at a barcode or QR code.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        <div className="relative bg-black rounded-lg overflow-hidden border border-slate-700" style={{ minHeight: 280 }}>
          {/* Camera feed renders here */}
          <div id="qr-reader" className="w-full" />

          {/* Starting overlay */}
          {isStarting && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-3">
              <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-300">Starting camera…</p>
            </div>
          )}

          {/* Scan target corners */}
          {!isStarting && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[260px] h-[260px]">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-gold rounded-tl" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-gold rounded-tr" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-gold rounded-bl" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-gold rounded-br" />
                {/* Scanning line animation */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-brand-gold/70 animate-[scan_2s_linear_infinite]" />
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-3">
          Hold steady — scanning automatically
        </p>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(260px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
