'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BarcodeDetector } from 'barcode-detector';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

/* ────────────────────────────────────────────
 * Module-level singleton – guarantees only ONE
 * camera stream can be active at a time, even
 * when React Strict Mode double-fires effects.
 * ──────────────────────────────────────────── */
let globalStream: MediaStream | null = null;

function killGlobalStream() {
  if (globalStream) {
    globalStream.getTracks().forEach((t) => {
      t.stop();
      t.enabled = false;
    });
    globalStream = null;
  }
}

const BARCODE_FORMATS = [
  'qr_code',
  'ean_13',
  'ean_8',
  'code_128',
  'code_39',
  'upc_a',
  'upc_e',
  'itf',
  'codabar',
  'code_93',
  'data_matrix',
] as const;

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const hasScannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);
  const [debugMsg, setDebugMsg] = useState('Init');

  /* Guaranteed cleanup — kills camera globally */
  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    killGlobalStream();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // force release on iOS
    }
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  useEffect(() => {
    let cancelled = false;
    hasScannedRef.current = false;

    // Always kill any lingering stream first (Strict Mode re-mount)
    killGlobalStream();

    // The barcode-detector polyfill uses native BarcodeDetector when
    // available, falls back to ZXing-WASM otherwise. Both handle QR
    // codes AND 1-D barcodes reliably.
    let detector: InstanceType<typeof BarcodeDetector>;
    try {
      detector = new BarcodeDetector({ formats: [...BARCODE_FORMATS] });
    } catch (e) {
      console.warn('[BarcodeScanner] Formats not supported, falling back to default formats:', e);
      try {
        detector = new BarcodeDetector();
      } catch (e2) {
        console.error('[BarcodeScanner] Failed to create BarcodeDetector:', e2);
        setError('Barcode detection is not supported on this browser.');
        setIsStarting(false);
        return;
      }
    }

    const decode = async (source: HTMLCanvasElement): Promise<string | null> => {
      try {
        const results = await detector.detect(source);
        if (results.length > 0) {
          console.log('[BarcodeScanner] Detected:', results[0].format, results[0].rawValue);
          return results[0].rawValue;
        }
        return null;
      } catch (err) {
        // Log detection errors once for debugging, but don't spam
        console.warn('[BarcodeScanner] detect() error:', err);
        return null;
      }
    };

    const startCamera = async () => {
      try {
        // Higher resolution helps 1-D barcode detection
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setDebugMsg('Got stream');
        // Store in global singleton & kill any prior stream
        killGlobalStream();
        globalStream = stream;

        const video = videoRef.current;
        if (!video) {
          killGlobalStream();
          return;
        }

        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        
        setDebugMsg('Calling play()');
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((playErr) => {
            console.warn('[BarcodeScanner] video.play() error/interrupted:', playErr);
            setDebugMsg('play() rejected');
            setNeedsUserGesture(true);
          });
        }

        // If Safari hangs on the play promise without rejecting, force the button after 1s
        setTimeout(() => {
          if (videoRef.current && videoRef.current.paused) {
            setDebugMsg('play() timeout fallback');
            setNeedsUserGesture(true);
          }
        }, 1000);

        if (cancelled) {
          killGlobalStream();
          video.srcObject = null;
          return;
        }

        setIsStarting(false);
        setDebugMsg('Loop started');

        // Scan loop
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let lastScanTime = 0;
        const SCAN_INTERVAL = 200; // ms between scans — gives detector enough time

        const scanFrame = async (timestamp: number) => {
          if (cancelled || hasScannedRef.current) return;

          if (timestamp - lastScanTime > SCAN_INTERVAL && video.readyState >= 2) {
            lastScanTime = timestamp;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            const result = await decode(canvas);
            if (result && !cancelled && !hasScannedRef.current) {
              hasScannedRef.current = true;
              cleanup();
              onScan(result);
              return;
            }
          }

          if (!cancelled && !hasScannedRef.current) {
            rafRef.current = requestAnimationFrame(scanFrame);
          }
        };

        rafRef.current = requestAnimationFrame(scanFrame);
      } catch (err) {
        if (cancelled) return;
        console.error('[BarcodeScanner] Camera error:', err);
        const isInsecure =
          typeof window !== 'undefined' &&
          window.location.protocol === 'http:' &&
          window.location.hostname !== 'localhost';
        setError(
          isInsecure
            ? 'Camera requires HTTPS. Run "npm run dev:https" and access via https:// to use the scanner from this device.'
            : 'Could not start camera. Please grant camera permissions and try again.',
        );
        setIsStarting(false);
      }
    };

    // Small delay lets Strict Mode's cleanup finish before we acquire the camera
    const timer = setTimeout(startCamera, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      killGlobalStream();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []); // mount once

  return (
    <div className="fixed inset-0 bg-crm-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-crm-surface rounded-xl p-5 w-full max-w-sm border border-crm-border shadow-sm shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-crm-muted hover:text-crm-text bg-crm-surface rounded-full w-8 h-8 flex items-center justify-center z-10 text-[13px]"
        >
          ✕
        </button>

        <h3 className="font-bold text-crm-text mb-1 text-lg font-bold">Scan QR / Barcode</h3>
        <p className="text-crm-muted mb-4 text-[13px]">
          Point the camera at a barcode or QR code.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-status-cancelled/20 border border-status-cancelled text-red-200 rounded text-[13px]">
            {error}
          </div>
        )}

        <div className="text-[10px] text-crm-muted font-mono mb-2 text-right">Debug: {debugMsg}</div>

        <div className="relative bg-crm-surface rounded-lg overflow-hidden border border-crm-border shadow-sm" style={{ minHeight: 280 }}>
          <video
            ref={videoRef}
            className={`w-full h-auto transition-opacity duration-300 ${isStarting ? 'opacity-0' : 'opacity-100'}`}
            autoPlay
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {isStarting && !error && !needsUserGesture && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-crm-surface text-crm-text gap-3">
              <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-crm-muted text-[13px]">Starting camera…</p>
            </div>
          )}

          {needsUserGesture && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    setDebugMsg('User tapped button');
                    videoRef.current.play().then(() => {
                      setDebugMsg('Button play() success');
                      setNeedsUserGesture(false);
                      setIsStarting(false);
                    }).catch(e => {
                      console.error(e);
                      setDebugMsg('Button play() error: ' + String(e));
                    });
                  }
                }}
                className="bg-brand-gold text-crm-bg px-6 py-3 rounded-full font-bold text-base shadow-[0_0_20px_rgba(212,175,55,0.4)] animate-pulse hover:scale-105 active:scale-95 transition-all"
              >
                Tap to Start Camera
              </button>
            </div>
          )}

          {!isStarting && !error && !needsUserGesture && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[260px] h-[260px]">
                <span className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-gold rounded-tl" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-gold rounded-tr" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-gold rounded-bl" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-gold rounded-br" />
                <div className="absolute inset-x-0 top-0 h-0.5 bg-crm-primary/70 animate-[scan_2s_linear_infinite] hover:opacity-90 text-white" />
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-crm-muted mt-3 text-[13px]">
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
