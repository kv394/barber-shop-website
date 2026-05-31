import React from 'react';
import { fmtPrice } from '@/lib/formatters';

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

export default function CheckoutCart({
  cart,
  products,
  addToCart,
  removeFromCart,
  currency,
}: {
  cart: CartItem[];
  products: any[];
  addToCart: (p: any) => void;
  removeFromCart: (id: string) => void;
  currency: string;
}) {
  return (
    <section>
      <h3 className="font-semibold text-crm-muted uppercase tracking-wider mb-2 text-lg font-bold">Cart</h3>
      <div className="space-y-2">
        {cart.map(item => (
          <div key={item.id} className="flex items-center gap-3 bg-crm-surface rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-crm-text font-medium truncate text-[13px]">{item.name}</p>
              <p className="text-crm-muted text-[13px]">{fmtPrice(item.price, currency)} × {item.quantity}</p>
            </div>
            <span className="text-[13px] font-bold text-crm-text shrink-0">{fmtPrice(item.price * item.quantity, currency)}</span>
            {item.id !== 'primary-service' && (
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-status-cancelled hover:text-status-cancelled text-[11px] shrink-0 w-5 h-5 flex items-center justify-center"
              >✕</button>
            )}
          </div>
        ))}
      </div>

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
                  <p className="text-crm-accent text-[13px]">{fmtPrice(p.price, currency)}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
