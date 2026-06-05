'use client';;
import Image from 'next/image';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

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

 const foundProduct = products.find(p => p.barcode === decodedText || p.id === decodedText);
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
 className="bg-crm-primary text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors flex items-center gap-2"
 >
 <span>📷</span> Scan Product
 </button>

 {isScanning && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[100] bg-crm-bg/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
 <BarcodeScanner onScan={handleScan} onClose={() => setIsScanning(false)} />
 </div>, document.body
 )}

 {/* Results overlay */}
 {showOverlay && typeof document !== 'undefined' && createPortal(
 <div className="fixed bottom-0 left-0 right-0 p-4 z-[60] flex justify-center pointer-events-none">
 <div className="bg-crm-surface border border-brand-indigo rounded-xl p-5 shadow-2xl max-w-sm w-full pointer-events-auto relative">
 <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-4">
 <h3 className="font-bold text-crm-primary text-lg">Scan Result</h3>
 <button onClick={resetAll} className="absolute top-3 right-4 text-crm-primary bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
 </div>

 {isUpdating && (
 <div className="flex items-center gap-2 text-crm-accent mb-4 text-[13px] animate-pulse">
 <div className="w-4 h-4 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
 Processing…
 </div>
 )}

 {/* Inventory match */}
 {scannedCode && (
 <>
 <p className="text-crm-accent font-mono mb-4 bg-crm-surface p-2 rounded truncate text-[13px]">Code: {scannedCode}</p>

 {actionError && (
 <div className="bg-status-cancelled/20 border border-status-cancelled/50 text-status-cancelled p-3 rounded-lg mb-4 text-[13px]">
 {actionError}
 </div>
 )}

 {matchedProduct ? (
 <div>
 <div className="bg-crm-surface p-4 rounded-lg mb-4 border border-crm-border shadow-sm">
 <h4 className="font-semibold text-crm-text text-base font-semibold">{matchedProduct.name}</h4>
 <p className="text-crm-muted mt-1 text-[13px]">Stock: <span className="font-mono text-crm-text text-lg ml-1">{matchedProduct.inventoryCount}</span></p>
 </div>
 <div className="flex gap-3">
 <button onClick={() => handleUpdateInventory(-1)} disabled={isUpdating || matchedProduct.inventoryCount <= 0}
 className="flex-1 bg-status-cancelled/20 hover:bg-red-800 text-red-200 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors border border-status-cancelled/30">
 − Remove 1
 </button>
 <button onClick={() => handleUpdateInventory(1)} disabled={isUpdating}
 className="flex-1 bg-status-confirmed/20 hover:bg-green-800 text-green-200 py-3 rounded-lg font-bold disabled:opacity-50 transition-colors border border-status-confirmed/30">
 + Add 1
 </button>
 </div>
 <button onClick={() => { resetAll(); setIsScanning(true); }}
 className="w-full mt-3 text-[13px] text-crm-muted hover:text-crm-text transition-colors py-2">
 Scan Another
 </button>
 </div>
 ) : (
 <div className="bg-crm-surface border border-crm-border shadow-sm p-4 rounded-lg">
 <p className="text-status-pending font-semibold mb-1 text-[13px]">Product not recognized.</p>
 <p className="text-crm-muted mb-4 text-[13px]">Map this barcode to a product:</p>
 {unmatchedProducts.length > 0 ? (
 <div className="space-y-3">
 <select className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-2.5 text-[13px] text-crm-text focus:ring-1 focus:ring-crm-primary"
 value={selectedProductToAssign} onChange={(e) => setSelectedProductToAssign(e.target.value)}>
 <option value="">-- Select Product --</option>
 {unmatchedProducts.map(s => (
 <option key={s.id} value={s.id}>{s.name} {s.barcode ? `(replace)` : ''}</option>
 ))}
 </select>
 <button onClick={handleAssignBarcode} disabled={!selectedProductToAssign || isUpdating}
 className="w-full bg-crm-primary text-white py-2.5 rounded font-semibold disabled:opacity-50 hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors text-[13px]">
 {isUpdating ? 'Linking…' : 'Map Barcode to Product'}
 </button>
 </div>
 ) : (
 <p className="text-status-cancelled bg-status-cancelled/20 p-3 rounded text-[13px]">No products found. Create one first.</p>
 )}
 </div>
 )}
 </>
 )}
 </div>
 </div>, document.body
 )}
 </>
 );
}
