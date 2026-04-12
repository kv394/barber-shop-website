'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const BarcodeScanner = dynamic(() => import('@/components/checkout/BarcodeScanner'), { ssr: false });

interface Service {
  id: string;
  name: string;
  barcode: string | null;
  inventoryCount: number;
}

// How long (ms) to show the attendance result before auto-dismissing
const ATTENDANCE_AUTO_DISMISS_MS = 3500;

export default function BarcodeScannerWrapper({ shopId, services = [] }: { shopId?: string, services?: Service[] }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedService, setMatchedService] = useState<Service | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{ text: string, type: 'success' | 'error', user: string | null } | null>(null);
  const [unmatchedServices, setUnmatchedServices] = useState<Service[]>([]);
  const [selectedServiceToAssign, setSelectedServiceToAssign] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Auto-dismiss attendance success results so kiosk is ready for the next person
  useEffect(() => {
    if (attendanceMessage?.type === 'success') {
      autoDismissTimer.current = setTimeout(() => {
        setAttendanceMessage(null);
        setScannedCode(null);
      }, ATTENDANCE_AUTO_DISMISS_MS);
    }
    return () => {
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, [attendanceMessage]);

  const resetAll = () => {
    setScannedCode(null);
    setMatchedService(null);
    setAttendanceMessage(null);
    setUnmatchedServices([]);
    setSelectedServiceToAssign('');
    setActionError(null);
  };

  const handleScan = async (decodedText: string) => {
    setIsScanning(false);
    resetAll();

    if (shopId) {
      // 1. Inventory barcode match
      const foundService = services.find(s => s.barcode === decodedText);
      if (foundService) {
        setScannedCode(decodedText);
        setMatchedService(foundService);
        return;
      }

      // 2. Attendance / check-in
      try {
        setIsUpdating(true);
        const response = await fetch(`/api/shops/${shopId}/attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode: decodedText }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.role === 'CLIENT') {
            setAttendanceMessage({ text: `Client Arrived: ${data.user.name}`, type: 'success', user: 'Please direct them to the waiting area.' });
          } else {
            setAttendanceMessage({
              text: `${data.action === 'IN' ? '🟢 Clocked In' : '🔴 Clocked Out'}`,
              type: 'success',
              user: data.user.name,
            });
          }
          router.refresh();
        } else if (response.status === 404) {
          setScannedCode(decodedText);
          setUnmatchedServices(services);
        } else {
          setAttendanceMessage({ text: data.error || 'Failed to process scan.', type: 'error', user: null });
        }
      } catch (error) {
        setAttendanceMessage({ text: 'Network error while processing scan.', type: 'error', user: null });
      } finally {
        setIsUpdating(false);
      }
    } else {
      setScannedCode(decodedText);
    }
  };

  const handleUpdateInventory = async (change: number) => {
    if (!matchedService || !shopId) return;
    const newCount = matchedService.inventoryCount + change;
    if (newCount < 0) return;

    setIsUpdating(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/shops/${shopId}/services/${matchedService.id}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newCount }),
      });
      if (response.ok) {
        setMatchedService({ ...matchedService, inventoryCount: newCount });
        router.refresh();
      } else {
        setActionError('Failed to update inventory.');
      }
    } catch {
      setActionError('Network error updating inventory.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignBarcode = async () => {
    if (!scannedCode || !selectedServiceToAssign || !shopId) return;
    setIsUpdating(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/shops/${shopId}/services/${selectedServiceToAssign}/barcode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: scannedCode }),
      });
      if (response.ok) {
        resetAll();
        router.refresh();
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to assign barcode.');
      }
    } catch {
      setActionError('Network error while assigning barcode.');
    } finally {
      setIsUpdating(false);
    }
  };

  const showOverlay = (scannedCode !== null || attendanceMessage !== null) && !isScanning;

  return (
    <>
      <button
        onClick={() => { resetAll(); setIsScanning(true); }}
        className="bg-botanical-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors flex items-center gap-2"
      >
        <span>📷</span> Scan QR / Barcode
      </button>

      {isScanning && (
        <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
      )}

      {/* Results overlay */}
      {showOverlay && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-[60] flex justify-center pointer-events-none">
          <div className="bg-botanical-surface border border-brand-gold rounded-xl p-5 shadow-2xl max-w-sm w-full pointer-events-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-botanical-text">Scan Result</h3>
              <button onClick={resetAll} className="text-botanical-muted hover:text-botanical-text text-xl leading-none">✕</button>
            </div>

            {isUpdating && (
              <div className="flex items-center gap-2 text-botanical-accent mb-4 text-sm animate-pulse">
                <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                Processing…
              </div>
            )}

            {/* Attendance result */}
            {attendanceMessage && (
              <div className={`p-5 rounded-lg text-center border ${attendanceMessage.type === 'success' ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                {attendanceMessage.type === 'success' && <div className="text-4xl mb-3">✅</div>}
                <h4 className={`text-xl font-bold mb-1 ${attendanceMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {attendanceMessage.text}
                </h4>
                {attendanceMessage.user && <p className="text-botanical-text text-base">{attendanceMessage.user}</p>}
                {attendanceMessage.type === 'success' && (
                  <p className="text-xs text-botanical-muted mt-3">Auto-closing in {ATTENDANCE_AUTO_DISMISS_MS / 1000}s…</p>
                )}
              </div>
            )}

            {/* Scan again button always visible at bottom for kiosk speed */}
            {attendanceMessage && (
              <button
                onClick={() => { resetAll(); setIsScanning(true); }}
                className="w-full mt-4 bg-botanical-primary text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors"
              >
                Scan Next Person
              </button>
            )}

            {/* Inventory match */}
            {scannedCode && !attendanceMessage && shopId && (
              <>
                <p className="text-xs text-botanical-accent font-mono mb-4 bg-botanical-surface p-2 rounded truncate">Code: {scannedCode}</p>

                {actionError && (
                  <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">
                    {actionError}
                  </div>
                )}

                {matchedService ? (
                  <div>
                    <div className="bg-botanical-surface p-4 rounded-lg mb-4 border-2 border-b-[6px] border-botanical-border">
                      <h4 className="font-semibold text-botanical-text">{matchedService.name}</h4>
                      <p className="text-botanical-muted text-sm mt-1">Stock: <span className="font-mono text-botanical-text text-lg ml-1">{matchedService.inventoryCount}</span></p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleUpdateInventory(-1)} disabled={isUpdating || matchedService.inventoryCount <= 0}
                        className="flex-1 bg-red-900/50 hover:bg-red-800 text-red-200 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors border border-red-500/30">
                        − Remove 1
                      </button>
                      <button onClick={() => handleUpdateInventory(1)} disabled={isUpdating}
                        className="flex-1 bg-green-900/50 hover:bg-green-800 text-green-200 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors border border-green-500/30">
                        + Add 1
                      </button>
                    </div>
                    <button onClick={() => { resetAll(); setIsScanning(true); }}
                      className="w-full mt-3 text-sm text-botanical-muted hover:text-botanical-text transition-colors py-2">
                      Scan Another
                    </button>
                  </div>
                ) : (
                  <div className="bg-botanical-surface border-2 border-b-[6px] border-botanical-border p-4 rounded-lg">
                    <p className="text-amber-400 font-semibold mb-1">Item not recognized.</p>
                    <p className="text-xs text-botanical-muted mb-4">Map this barcode to an inventory item:</p>
                    {unmatchedServices.length > 0 ? (
                      <div className="space-y-3">
                        <select className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2.5 text-sm text-botanical-text focus:ring-1 focus:ring-botanical-primary"
                          value={selectedServiceToAssign} onChange={(e) => setSelectedServiceToAssign(e.target.value)}>
                          <option value="">-- Select Item --</option>
                          {unmatchedServices.map(s => (
                            <option key={s.id} value={s.id}>{s.name} {s.barcode ? `(replace)` : ''}</option>
                          ))}
                        </select>
                        <button onClick={handleAssignBarcode} disabled={!selectedServiceToAssign || isUpdating}
                          className="w-full bg-botanical-primary text-white py-2.5 rounded font-semibold disabled:opacity-50 hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors text-sm">
                          {isUpdating ? 'Linking…' : 'Map Barcode to Item'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-red-400 bg-red-900/20 p-3 rounded">No inventory items found. Create one in the dashboard first.</p>
                    )}
                  </div>
                )}
              </>
            )}

            {scannedCode && !attendanceMessage && !shopId && (
              <div className="bg-botanical-surface border-2 border-b-[6px] border-botanical-border p-4 rounded-lg">
                <p className="text-xs text-botanical-text font-mono break-all">{scannedCode}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
