'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';

const BarcodeScanner = dynamic(() => import('@/components/checkout/BarcodeScanner'), { ssr: false });

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
}: {
  shopId: string;
  appointmentId: string;
  price: number;
  serviceName?: string;
  serviceId?: string;
  shopName?: string;
  clientName?: string;
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
  const scanProcessedRef = useRef(false);
  const router = useRouter();

  const TIP_PRESETS = [0, 2, 5, 10];

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const effectiveDiscount = Math.min(discount, subtotal);
  const finalTotal = Math.max(0, subtotal - effectiveDiscount + tipAmount);

  // When modal opens, seed cart with primary service and load retail products
  useEffect(() => {
    if (!isOpen) return;

    setCart([{
      id: 'primary-service',
      serviceId: serviceId || null,
      name: serviceName || 'Service',
      price: servicePrice,
      quantity: 1,
      type: 'SERVICE',
    }]);
    setTipAmount(0);
    setCustomTip('');
    setDiscount(0);
    setDiscountCode(null);
    setPaymentMethod('CASH');

    fetch(`/api/shops/${shopId}/products`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data.filter((p: any) => p.type !== 'BACKBAR'));
        }
      })
      .catch(() => {});
  }, [isOpen, shopId, serviceName, servicePrice, serviceId]);

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
              
              await channel.send({
                type: 'broadcast',
                event: 'DISCOUNT_SCAN_RESULT',
                payload: { appointmentId, success: true, message: data.message }
              });
            } else {
              await channel.send({
                type: 'broadcast',
                event: 'DISCOUNT_SCAN_RESULT',
                payload: { appointmentId, success: false, message: data.error || 'Invalid discount code.' }
              });
            }
          } catch (e) {
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
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Cart</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-crm-surface rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-crm-text font-medium truncate text-[13px]">{item.name}</p>
                        <p className="text-crm-muted text-[13px]">${item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <span className="text-[13px] font-bold text-crm-text shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                      {item.id !== 'primary-service' && (
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-status-cancelled hover:text-status-cancelled text-[11px] shrink-0 w-5 h-5 flex items-center justify-center"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add products */}
                {products.length > 0 && (
                  <div className="mt-3">
                    <p className="text-crm-muted mb-2 uppercase tracking-wider text-[13px]">Add Products</p>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                      {products.map(p => {
                        const inCart = cart.find(i => i.productId === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className="text-left bg-crm-surface hover:bg-crm-surface border border-crm-border shadow-sm rounded-lg p-2 transition-colors relative"
                          >
                            {inCart && (
                              <span className="absolute top-1 right-1 bg-crm-primary text-white text-[11px] font-black w-4 h-4 rounded-full flex items-center justify-center hover:opacity-90">
                                {inCart.quantity}
                              </span>
                            )}
                            <p className="font-medium text-crm-text truncate pr-4 text-[13px]">{p.name}</p>
                            <p className="text-crm-accent text-[13px]">${p.price.toFixed(2)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Tip ── */}
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Tip</h3>
                <div className="flex gap-2 flex-wrap">
                  {TIP_PRESETS.map(t => (
                    <button
                      key={t}
                      onClick={() => { setTipAmount(t); setCustomTip(''); }}
                      className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors ${
                        tipAmount === t && customTip === ''
                          ? 'bg-crm-primary text-white'
                          : 'bg-crm-surface text-crm-muted hover:bg-crm-surface'
                      }`}
                    >
                      {t === 0 ? 'No Tip' : `$${t}`}
                    </button>
                  ))}
                  <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 border transition-colors ${customTip ? 'bg-crm-primary/10 border-brand-gold/40' : 'bg-crm-surface border-transparent'} hover:opacity-90 text-white`}>
                    <span className="text-crm-muted text-[13px]">$</span>
                    <input
                      type="number" min={0} step={0.5}
                      value={customTip}
                      onChange={e => {
                        setCustomTip(e.target.value);
                        setTipAmount(parseFloat(e.target.value) || 0);
                      }}
                      placeholder="Custom"
                      className="w-16 bg-transparent text-crm-text text-[13px] focus:outline-none placeholder-gray-600"
                    />
                  </div>
                </div>
              </section>

              {/* ── Discount ── */}
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Discount</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 bg-crm-surface rounded-lg px-3 py-2 w-36 border border-transparent focus-within:border-brand-gold/40 transition-colors shadow-sm">
                    <span className="text-crm-muted text-[13px]">$</span>
                    <input
                      type="number" min={0} step={0.5} max={subtotal}
                      value={discount || ''}
                      onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-crm-text text-[13px] focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <button
                    onClick={() => setIsScanningDiscount(true)}
                    className="px-4 py-2 bg-crm-surface shadow-sm border border-crm-border rounded-lg text-[13px] font-semibold text-crm-text hover:bg-crm-primary/10 hover:text-crm-primary hover:border-crm-primary/40 transition-colors flex items-center gap-2"
                  >
                    📷 Scan QR
                  </button>
                </div>
              </section>

              {/* ── Payment Method ── */}
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Payment Method</h3>
                <div className="flex gap-2">
                  {(['CASH', 'CARD', 'MOBILE'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                        paymentMethod === m ? 'bg-status-confirmed text-crm-text shadow-lg' : 'bg-crm-surface text-crm-muted hover:text-crm-text'
                      }`}
                    >
                      {m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '📱 Mobile'}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Total Summary ── */}
              <section className="bg-crm-surface rounded-xl p-4 space-y-1.5 border border-crm-border shadow-sm">
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-[13px] text-crm-muted">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-[13px] text-status-cancelled">
                    <span>Discount</span><span>−${effectiveDiscount.toFixed(2)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-[13px] text-status-pending">
                    <span>Tip</span><span>+${tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-xl font-black text-crm-text border-t border-crm-border pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-crm-accent">${finalTotal.toFixed(2)}</span>
                </div>
              </section>

              {/* ── Confirm Button ── */}
              <button
                onClick={handleMarkAsPaid}
                disabled={isProcessing}
                className="w-full bg-status-confirmed hover:bg-status-confirmed disabled:opacity-50 text-crm-text font-bold py-3.5 rounded-xl text-[13px] uppercase tracking-wider transition-colors"
              >
                {isProcessing ? 'Processing…' : `Confirm ${paymentMethod === 'CASH' ? '💵' : paymentMethod === 'CARD' ? '💳' : '📱'} · $${finalTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── QR Scanner Overlay for Discount ── */}
      {isScanningDiscount && (
        <div className="fixed inset-0 bg-black/90 z-[110] flex flex-col items-center justify-center pointer-events-auto backdrop-blur-sm p-4">
          <div className="w-full max-w-sm relative flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-6"></div>
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
