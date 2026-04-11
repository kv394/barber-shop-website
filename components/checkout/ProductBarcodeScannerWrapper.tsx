'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const BarcodeScanner = dynamic(() => import('@/components/checkout/BarcodeScanner'), { ssr: false });

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  inventoryCount: number;
}

export default function ProductBarcodeScannerWrapper({ shopId, products = [] }: { shopId: string, products: Product[] }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [unmatchedProducts, setUnmatchedProducts] = useState<Product[]>([]);
  const [selectedProductToAssign, setSelectedProductToAssign] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const router = useRouter();

  const resetAll = () => {
    setScannedCode(null);
    setMatchedProduct(null);
    setUnmatchedProducts([]);
    setSelectedProductToAssign('');
    setActionError(null);
  };

  const handleScan = async (decodedText: string) => {
    setIsScanning(false);
    resetAll();

    const foundProduct = products.find(p => p.barcode === decodedText);
    if (foundProduct) {
      setScannedCode(decodedText);
      setMatchedProduct(foundProduct);
    } else {
      setScannedCode(decodedText);
      setUnmatchedProducts(products);
    }
  };

  const handleUpdateInventory = async (change: number) => {
    if (!matchedProduct || !shopId) return;
    const newCount = matchedProduct.inventoryCount + change;
    if (newCount < 0) return;

    setIsUpdating(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/shops/${shopId}/products/${matchedProduct.id}/inventory`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newCount }),
      });
      if (response.ok) {
        setMatchedProduct({ ...matchedProduct, inventoryCount: newCount });
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
    if (!scannedCode || !selectedProductToAssign || !shopId) return;
    setIsUpdating(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/shops/${shopId}/products/${selectedProductToAssign}/barcode`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: scannedCode }),
      });
      if (response.ok) {
        resetAll();
        router.refresh();
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to map barcode.');
      }
    } catch {
      setActionError('Network error while mapping barcode.');
    } finally {
      setIsUpdating(false);
    }
  };

  const showOverlay = scannedCode !== null && !isScanning;

  return (
    <>
      <button
        onClick={() => { resetAll(); setIsScanning(true); }}
        className="bg-botanical-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition-colors flex items-center gap-2"
      >
        <span>📷</span> Scan Product
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

            {/* Inventory match */}
            {scannedCode && (
              <>
                <p className="text-xs text-botanical-accent font-mono mb-4 bg-botanical-surface p-2 rounded truncate">Code: {scannedCode}</p>

                {actionError && (
                  <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg mb-4 text-sm">
                    {actionError}
                  </div>
                )}

                {matchedProduct ? (
                  <div>
                    <div className="bg-botanical-surface p-4 rounded-lg mb-4 border-2 border-b-[6px] border-botanical-border">
                      <h4 className="font-semibold text-botanical-text">{matchedProduct.name}</h4>
                      <p className="text-botanical-muted text-sm mt-1">Stock: <span className="font-mono text-botanical-text text-lg ml-1">{matchedProduct.inventoryCount}</span></p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => handleUpdateInventory(-1)} disabled={isUpdating || matchedProduct.inventoryCount <= 0}
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
                    <p className="text-amber-400 font-semibold mb-1">Product not recognized.</p>
                    <p className="text-xs text-botanical-muted mb-4">Map this barcode to a product:</p>
                    {unmatchedProducts.length > 0 ? (
                      <div className="space-y-3">
                        <select className="w-full bg-botanical-surface border-2 border-b-[6px] border-botanical-border rounded p-2.5 text-sm text-botanical-text focus:ring-1 focus:ring-botanical-primary"
                          value={selectedProductToAssign} onChange={(e) => setSelectedProductToAssign(e.target.value)}>
                          <option value="">-- Select Product --</option>
                          {unmatchedProducts.map(s => (
                            <option key={s.id} value={s.id}>{s.name} {s.barcode ? `(replace)` : ''}</option>
                          ))}
                        </select>
                        <button onClick={handleAssignBarcode} disabled={!selectedProductToAssign || isUpdating}
                          className="w-full bg-botanical-primary text-white py-2.5 rounded font-semibold disabled:opacity-50 hover:bg-white transition-colors text-sm">
                          {isUpdating ? 'Linking…' : 'Map Barcode to Product'}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-red-400 bg-red-900/20 p-3 rounded">No products found. Create one first.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
