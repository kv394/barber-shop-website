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
        className="bg-status-confirmed hover:bg-status-confirmed text-crm-text text-xs font-bold px-4 py-2 rounded uppercase tracking-wider transition-colors"
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
              <h2 className="font-bold text-crm-text text-3xl md:text-4xl">💳 Point of Sale</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-crm-muted hover:text-crm-text w-8 h-8 flex items-center justify-center rounded-full bg-crm-surface text-sm"
              >✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* ── Cart ── */}
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-2xl md:text-3xl">Cart</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-crm-surface rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-crm-text font-medium truncate text-base md:text-lg">{item.name}</p>
                        <p className="text-crm-muted text-base md:text-lg">${item.price.toFixed(2)} × {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-crm-text shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
                      {item.id !== 'primary-service' && (
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-status-cancelled hover:text-status-cancelled text-xs shrink-0 w-5 h-5 flex items-center justify-center"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add products */}
                {products.length > 0 && (
                  <div className="mt-3">
                    <p className="text-crm-muted mb-2 uppercase tracking-wider text-base md:text-lg">Add Products</p>
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
                              <span className="absolute top-1 right-1 bg-crm-primary text-white text-xs font-black w-4 h-4 rounded-full flex items-center justify-center hover:opacity-90">
                                {inCart.quantity}
                              </span>
                            )}
                            <p className="font-medium text-crm-text truncate pr-4 text-base md:text-lg">{p.name}</p>
                            <p className="text-crm-accent text-base md:text-lg">${p.price.toFixed(2)}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* ── Tip ── */}
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-2xl md:text-3xl">Tip</h3>
                <div className="flex gap-2 flex-wrap">
                  {TIP_PRESETS.map(t => (
                    <button
                      key={t}
                      onClick={() => { setTipAmount(t); setCustomTip(''); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        tipAmount === t && customTip === ''
                          ? 'bg-crm-primary text-white'
                          : 'bg-crm-surface text-crm-muted hover:bg-crm-surface'
                      }`}
                    >
                      {t === 0 ? 'No Tip' : `$${t}`}
                    </button>
                  ))}
                  <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 border transition-colors ${customTip ? 'bg-crm-primary/10 border-brand-gold/40' : 'bg-crm-surface border-transparent'} hover:opacity-90 text-white`}>
                    <span className="text-crm-muted text-sm">$</span>
                    <input
                      type="number" min={0} step={0.5}
                      value={customTip}
                      onChange={e => {
                        setCustomTip(e.target.value);
                        setTipAmount(parseFloat(e.target.value) || 0);
                      }}
                      placeholder="Custom"
                      className="w-16 bg-transparent text-crm-text text-sm focus:outline-none placeholder-gray-600"
                    />
                  </div>
                </div>
              </section>

              {/* ── Discount ── */}
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-2xl md:text-3xl">Discount</h3>
                <div className="flex items-center gap-1 bg-crm-surface rounded-lg px-3 py-2 w-36 border border-transparent focus-within:border-brand-gold/40 transition-colors">
                  <span className="text-crm-muted text-sm">$</span>
                  <input
                    type="number" min={0} step={0.5} max={subtotal}
                    value={discount || ''}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-crm-text text-sm focus:outline-none placeholder-gray-600"
                  />
                </div>
              </section>

              {/* ── Payment Method ── */}
              <section>
                <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-2xl md:text-3xl">Payment Method</h3>
                <div className="flex gap-2">
                  {(['CASH', 'CARD', 'MOBILE'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
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
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm text-crm-muted">
                  <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm text-status-cancelled">
                    <span>Discount</span><span>−${effectiveDiscount.toFixed(2)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 text-sm text-status-pending">
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
                className="w-full bg-status-confirmed hover:bg-status-confirmed disabled:opacity-50 text-crm-text font-bold py-3.5 rounded-xl text-sm uppercase tracking-wider transition-colors"
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
