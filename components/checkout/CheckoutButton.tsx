'use client';;
import Image from 'next/image';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { fmtPrice, getCurrencySymbol } from '@/lib/formatters';

const BarcodeScanner = dynamic(() => import('@/components/checkout/BarcodeScanner'), { ssr: false });

import CheckoutCart from './CheckoutCart';
import CheckoutTip from './CheckoutTip';
import CheckoutDiscount from './CheckoutDiscount';
import CheckoutPaymentMethod from './CheckoutPaymentMethod';
import CheckoutSummary from './CheckoutSummary';

interface CartItem {
 id: string;
 productId?: string | null;
 serviceId?: string | null;
 name: string;
 price: number;
 quantity: number;
 cost?: number;
 taxRate?: number;
 trackInventory?: boolean;
 type: 'SERVICE' | 'PRODUCT';
}

export default function CheckoutButton({
 shopId,
 appointmentId,
 price: servicePrice,
 serviceName,
 serviceId,
 shopName: _shopName,
 clientName,
 addons,
 currency,
}: {
 shopId: string;
 appointmentId: string;
 price: number;
 serviceName?: string;
 serviceId?: string;
 shopName?: string;
 clientName?: string;
 addons?: any;
 currency: string;
}) {
 const [isOpen, setIsOpen] = useState(false);
 const [isProcessing, setIsProcessing] = useState(false);
 const [tipAmount, setTipAmount] = useState(0);
 const [customTip, setCustomTip] = useState('');
 const [discount, setDiscount] = useState(0);
 const [discountCode, setDiscountCode] = useState<string | null>(null);
 const [paymentMethod, setPaymentMethod] = useState('CASH');
 const [products, setProducts] = useState<any[]>([]);
 const [cart, setCart] = useState<CartItem[]>([]);
 const [isScanningDiscount, setIsScanningDiscount] = useState(false);
 const [discountMessage, setDiscountMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
 const scanProcessedRef = useRef(false);
 const router = useRouter();

 const TIP_PRESETS = [0, 2, 5, 10];

 const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
 const effectiveDiscount = Math.min(discount, subtotal);
 const finalTotal = Math.max(0, subtotal - effectiveDiscount + tipAmount);

 // When modal opens, seed cart with primary service and load retail products
 useEffect(() => {
 if (!isOpen) return;

 const initialCart: CartItem[] = [{
 id: 'primary-service',
 serviceId: serviceId || null,
 name: serviceName || 'Service',
 price: servicePrice,
 quantity: 1,
 type: 'SERVICE',
 }];

 if (Array.isArray(addons)) {
 addons.forEach((addon: any) => {
 initialCart.push({
 id: `addon-${addon.id}`,
 serviceId: null, // Depending on if we want to link it
 name: `+ ${addon.name}`,
 price: addon.price,
 quantity: 1,
 type: 'SERVICE',
 });
 });
 }

 setCart(initialCart);
 setTipAmount(0);
 setCustomTip('');
 setDiscount(0);
 setDiscountCode(null);
 setDiscountMessage(null);
 setPaymentMethod('CASH');

 fetch(`/api/shops/${shopId}/products`)
 .then(r => r.json())
 .then(data => {
 if (Array.isArray(data)) {
 setProducts(data.filter((p: any) => p.type !== 'BACKBAR'));
 }
 })
 .catch(() => {});
 }, [isOpen, shopId, serviceName, servicePrice, serviceId, addons]);

 useEffect(() => {
 if (!isScanningDiscount || !shopId) return;

 scanProcessedRef.current = false;
 const supabase = createClient();
 const channel = supabase.channel(`kiosk-commands-${shopId}`);

 channel.on('broadcast', { event: 'DISCOUNT_CODE_SCANNED' }, async (payload) => {
 if (payload.payload?.appointmentId === appointmentId) {
 scanProcessedRef.current = true;
 const code = payload.payload.code;
 
 try {
 const res = await fetch(`/api/shops/${shopId}/gift-cards/validate`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ code })
 });
 const data = await res.json();
 
 if (res.ok && data.valid) {
 setDiscountCode(data.code);
 setDiscount(Math.min(data.balance, subtotal));
 setDiscountMessage({ text: data.message, type: 'success' });
 
 await channel.send({
 type: 'broadcast',
 event: 'DISCOUNT_SCAN_RESULT',
 payload: { appointmentId, success: true, message: data.message }
 });
 } else {
 const errMsg = data.error || 'Invalid discount code.';
 setDiscountMessage({ text: errMsg, type: 'error' });
 await channel.send({
 type: 'broadcast',
 event: 'DISCOUNT_SCAN_RESULT',
 payload: { appointmentId, success: false, message: errMsg }
 });
 }
 } catch (e) {
 setDiscountMessage({ text: 'Network error validating discount code.', type: 'error' });
 await channel.send({
 type: 'broadcast',
 event: 'DISCOUNT_SCAN_RESULT',
 payload: { appointmentId, success: false, message: 'Network error validating discount code.' }
 });
 }

 setIsScanningDiscount(false);
 }
 });

 channel.on('broadcast', { event: 'DISCOUNT_SCAN_CANCELLED' }, (payload) => {
 if (payload.payload?.appointmentId === appointmentId) {
 scanProcessedRef.current = true; // also prevent secondary cancel broadcast
 setIsScanningDiscount(false);
 }
 });

 channel.subscribe(async (status) => {
 if (status === 'SUBSCRIBED') {
 await channel.send({
 type: 'broadcast',
 event: 'REQUEST_DISCOUNT_SCAN',
 payload: { appointmentId, clientName: clientName || 'Guest' }
 });
 }
 });

 return () => {
 if (!scanProcessedRef.current) {
 channel.send({
 type: 'broadcast',
 event: 'CANCEL_DISCOUNT_SCAN',
 payload: { appointmentId }
 }).then(() => supabase.removeChannel(channel));
 } else {
 supabase.removeChannel(channel);
 }
 };
 }, [isScanningDiscount, shopId, appointmentId, subtotal, clientName]);

 const addToCart = (product: any) => {
 setCart(prev => {
 const existing = prev.find(i => i.productId === product.id);
 if (existing) {
 return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
 }
 return [...prev, {
 id: `prod-${product.id}`,
 productId: product.id,
 name: product.name,
 price: product.price,
 cost: product.cost,
 taxRate: product.taxRate,
 trackInventory: product.trackInventory,
 quantity: 1,
 type: 'PRODUCT' as const,
 }];
 });
 };

 const removeFromCart = (id: string) => {
 if (id === 'primary-service') return;
 setCart(prev => {
 const item = prev.find(i => i.id === id);
 if (!item) return prev;
 if (item.quantity > 1) return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
 return prev.filter(i => i.id !== id);
 });
 };

 const handleMarkAsPaid = async () => {
 setIsProcessing(true);
 try {
 const res = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}/checkout`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 tipAmount,
 discount: effectiveDiscount,
 discountCode,
 paymentMethod,
 cartItems: cart.map(c => ({
 productId: c.productId || null,
 serviceId: c.serviceId || null,
 name: c.name,
 quantity: c.quantity,
 price: c.price,
 cost: c.cost || 0,
 taxRate: c.taxRate || 0,
 trackInventory: c.trackInventory || false,
 })),
 }),
 });

 if (res.ok) {
 setIsOpen(false);
 router.refresh();
 } else {
 const data = await res.json();
 alert(data.error || 'Failed to process checkout.');
 }
 } catch {
 alert('Network error — please try again.');
 } finally {
 setIsProcessing(false);
 }
 };

 return (
 <>
 <button
 onClick={() => setIsOpen(true)}
 className="bg-status-confirmed hover:bg-status-confirmed text-crm-text text-[11px] font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors"
 >
 Checkout
 </button>

 {isOpen && (
 <div
 className="fixed inset-0 bg-crm-surface z-[200] flex items-center justify-center p-3 backdrop-blur-sm"
 onClick={() => !isProcessing && setIsOpen(false)}
 >
 <div
 className="bg-crm-surface border border-crm-border shadow-sm rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
 onClick={e => e.stopPropagation()}
 >
 {/* ── Header ── */}
 <div className="flex items-center justify-between px-5 py-4 border-b border-crm-border sticky top-0 bg-crm-surface z-10">
 <h2 className="font-bold text-crm-text text-xl font-bold">💳 Point of Sale</h2>
 <button
 onClick={() => setIsOpen(false)}
 className="text-crm-muted hover:text-crm-text w-8 h-8 flex items-center justify-center rounded-full bg-crm-surface text-[13px]"
 >✕</button>
 </div>

 <div className="p-5 space-y-5">
 {/* ── Cart ── */}
 <CheckoutCart
 cart={cart}
 products={products}
 addToCart={addToCart}
 removeFromCart={removeFromCart}
 currency={currency}
 />

 {/* ── Tip ── */}
 <CheckoutTip
 tipAmount={tipAmount}
 setTipAmount={setTipAmount}
 customTip={customTip}
 setCustomTip={setCustomTip}
 currency={currency}
 />

 {/* ── Discount ── */}
 <CheckoutDiscount
 discount={discount}
 setDiscount={setDiscount}
 subtotal={subtotal}
 setIsScanningDiscount={setIsScanningDiscount}
 discountMessage={discountMessage}
 currency={currency}
 />

 {/* ── Payment Method ── */}
 <CheckoutPaymentMethod
 paymentMethod={paymentMethod}
 setPaymentMethod={setPaymentMethod}
 />

 {/* ── Total Summary ── */}
 <CheckoutSummary
 subtotal={subtotal}
 effectiveDiscount={effectiveDiscount}
 tipAmount={tipAmount}
 finalTotal={finalTotal}
 currency={currency}
 />

 {/* ── Confirm Button ── */}
 <button
 onClick={handleMarkAsPaid}
 disabled={isProcessing}
 className="w-full bg-status-confirmed hover:bg-status-confirmed disabled:opacity-50 text-crm-text font-bold py-3.5 rounded-xl text-[13px] uppercase tracking-wider transition-colors"
 >
 {isProcessing ? 'Processing…' : `Confirm ${paymentMethod === 'CASH' ? '💵' : paymentMethod === 'CARD' ? '💳' : '📱'} · ${fmtPrice(finalTotal, currency)}`}
 </button>
 </div>
 </div>
 </div>
 )}
 {/* ── QR Scanner Overlay for Discount ── */}
 {isScanningDiscount && (
 <div className="fixed inset-0 bg-black/90 z-[110] flex flex-col items-center justify-center pointer-events-auto backdrop-blur-sm p-4">
 <div className="w-full max-w-sm relative flex flex-col items-center">
 <div className="w-16 h-16 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin mb-6"></div>
 <h2 className="text-white text-center font-bold text-2xl mb-2 tracking-wide">Waiting for Kiosk</h2>
 <p className="text-gray-300 text-center text-[15px] mb-12">Please ask the client to scan their discount code at the kiosk.</p>
 <button
 onClick={() => setIsScanningDiscount(false)}
 className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-colors shadow-sm"
 >
 Cancel Scan
 </button>
 </div>
 </div>
 )}
 </>
 );
}
