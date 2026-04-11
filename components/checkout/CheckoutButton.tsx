'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
}: {
  shopId: string;
  appointmentId: string;
  price: number;
  serviceName?: string;
  serviceId?: string;
  shopName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();

  const TIP_PRESETS = [0, 2, 5, 10];

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

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const effectiveDiscount = Math.min(discount, subtotal);
  const finalTotal = Math.max(0, subtotal - effectiveDiscount + tipAmount);

  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipAmount,
          discount: effectiveDiscount,
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
        className="bg-green-600 hover:bg-green-500 text-botanical-text text-xs font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors"
      >
        Checkout
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-botanical-surface z-[200] flex items-center justify-center p-3 backdrop-blur-sm"
          onClick={() => !isProcessing && setIsOpen(false)}
        >
          <div
            className="bg-botanical-surface border border-botanical-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-botanical-border sticky top-0 bg-botanical-surface z-10">
              <h2 className="text-lg font-bold text-botanical-text">💳 Point of Sale</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-botanical-muted hover:text-botanical-text w-8 h-8 flex items-center justify-center rounded-full bg-botanical-surface text-sm"
              >✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* ── Cart ── */}
              <section>
                <h3 className="text-[11px] font-semibold text-botanical-muted uppercase tracking-wider mb-2">Cart</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-botanical-surface rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-botanical-text font-medium truncate">{item.name}</p>
                        <p className="text-xs text-botanical-muted">${item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-botanical-text shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                      {item.id !== 'primary-service' && (
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 text-xs shrink-0 w-5 h-5 flex items-center justify-center"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add products */}
                {products.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] text-botanical-muted mb-2 uppercase tracking-wider">Add Products</p>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                      {products.map(p => {
                        const inCart = cart.find(i => i.productId === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className="text-left bg-botanical-surface hover:bg-botanical-surface border border-botanical-border rounded-lg p-2 transition-colors relative"
                          >
                            {inCart && (
                              <span className="absolute top-1 right-1 bg-botanical-primary text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                {inCart.quantity}
                              </span>
                            )}
                            <p className="text-xs font-medium text-botanical-text truncate pr-4">{p.name}</p>
                            <p className="text-xs text-botanical-accent">${p.price.toFixed(2)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Tip ── */}
              <section>
                <h3 className="text-[11px] font-semibold text-botanical-muted uppercase tracking-wider mb-2">Tip</h3>
                <div className="flex gap-2 flex-wrap">
                  {TIP_PRESETS.map(t => (
                    <button
                      key={t}
                      onClick={() => { setTipAmount(t); setCustomTip(''); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        tipAmount === t && customTip === ''
                          ? 'bg-botanical-primary text-black'
                          : 'bg-botanical-surface text-botanical-muted hover:bg-botanical-surface'
                      }`}
                    >
                      {t === 0 ? 'No Tip' : `$${t}`}
                    </button>
                  ))}
                  <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 border transition-colors ${customTip ? 'bg-botanical-primary/10 border-brand-gold/40' : 'bg-botanical-surface border-transparent'}`}>
                    <span className="text-botanical-muted text-sm">$</span>
                    <input
                      type="number" min={0} step={0.5}
                      value={customTip}
                      onChange={e => {
                        setCustomTip(e.target.value);
                        setTipAmount(parseFloat(e.target.value) || 0);
                      }}
                      placeholder="Custom"
                      className="w-16 bg-transparent text-botanical-text text-sm focus:outline-none placeholder-gray-600"
                    />
                  </div>
                </div>
              </section>

              {/* ── Discount ── */}
              <section>
                <h3 className="text-[11px] font-semibold text-botanical-muted uppercase tracking-wider mb-2">Discount</h3>
                <div className="flex items-center gap-1 bg-botanical-surface rounded-lg px-3 py-2 w-36 border border-transparent focus-within:border-brand-gold/40 transition-colors">
                  <span className="text-botanical-muted text-sm">$</span>
                  <input
                    type="number" min={0} step={0.5} max={subtotal}
                    value={discount || ''}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-botanical-text text-sm focus:outline-none placeholder-gray-600"
                  />
                </div>
              </section>

              {/* ── Payment Method ── */}
              <section>
                <h3 className="text-[11px] font-semibold text-botanical-muted uppercase tracking-wider mb-2">Payment Method</h3>
                <div className="flex gap-2">
                  {(['CASH', 'CARD', 'MOBILE'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        paymentMethod === m ? 'bg-green-600 text-botanical-text shadow-lg' : 'bg-botanical-surface text-botanical-muted hover:text-botanical-text'
                      }`}
                    >
                      {m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '📱 Mobile'}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Total Summary ── */}
              <section className="bg-botanical-surface rounded-xl p-4 space-y-1.5 border border-botanical-border">
                <div className="flex justify-between text-sm text-botanical-muted">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-sm text-red-400">
                    <span>Discount</span><span>−${effectiveDiscount.toFixed(2)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm text-amber-400">
                    <span>Tip</span><span>+${tipAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black text-botanical-text border-t border-botanical-border pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-botanical-accent">${finalTotal.toFixed(2)}</span>
                </div>
              </section>

              {/* ── Confirm Button ── */}
              <button
                onClick={handleMarkAsPaid}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-botanical-text font-bold py-3.5 rounded-xl text-sm uppercase tracking-wider transition-colors"
              >
                {isProcessing ? 'Processing…' : `Confirm ${paymentMethod === 'CASH' ? '💵' : paymentMethod === 'CARD' ? '💳' : '📱'} · $${finalTotal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
