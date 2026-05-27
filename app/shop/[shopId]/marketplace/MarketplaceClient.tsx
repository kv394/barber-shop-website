'use client';

import React, { useState } from 'react';

type Product = {
  id: string;
  name: string;
  description: string;
  msrp: number;
  wholesalePrice: number;
  imageColor: string;
  category: string;
};

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Premium Matte Pomade',
    description: 'High hold, low shine water-based pomade perfect for textured styles.',
    msrp: 25.0,
    wholesalePrice: 12.0,
    imageColor: 'bg-stone-800',
    category: 'Styling',
  },
  {
    id: 'p2',
    name: 'Artisan Beard Oil',
    description: 'Nourishing blend of argan and jojoba oils with a sandalwood scent.',
    msrp: 22.0,
    wholesalePrice: 10.0,
    imageColor: 'bg-amber-900',
    category: 'Beard Care',
  },
  {
    id: 'p3',
    name: 'Japanese Steel Shears',
    description: 'Professional grade 6.5" offset shears made from VG-10 Japanese steel.',
    msrp: 250.0,
    wholesalePrice: 120.0,
    imageColor: 'bg-slate-300',
    category: 'Tools',
  },
  {
    id: 'p4',
    name: 'Ergonomic Neck Dusters',
    description: 'Soft bristles with a comfortable wooden handle for easy sweeping.',
    msrp: 15.0,
    wholesalePrice: 6.0,
    imageColor: 'bg-orange-800',
    category: 'Accessories',
  },
  {
    id: 'p5',
    name: 'Texture Styling Powder',
    description: 'Weightless powder for instant volume and a matte finish.',
    msrp: 20.0,
    wholesalePrice: 9.0,
    imageColor: 'bg-zinc-200',
    category: 'Styling',
  },
  {
    id: 'p6',
    name: 'Professional Clippers',
    description: 'Cordless clippers with a rotary motor and diamond-carbon blade.',
    msrp: 180.0,
    wholesalePrice: 95.0,
    imageColor: 'bg-neutral-900',
    category: 'Tools',
  },
];

export default function MarketplaceClient() {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta;
          return newQ > 0 ? { ...item, quantity: newQ } : item;
        }
        return item;
      })
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.wholesalePrice * item.quantity, 0);
  const cartMsrpTotal = cart.reduce((sum, item) => sum + item.product.msrp * item.quantity, 0);
  const totalMargin = cartMsrpTotal - cartTotal;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    // Simulate checkout
    setTimeout(() => {
      setCart([]);
      setIsCheckoutOpen(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative min-h-[calc(100vh-8rem)]">
      
      {/* Main Content */}
      <div className="flex-1 transition-all duration-300">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-crm-text tracking-tight mb-2">KutzApp Supply</h1>
          <p className="text-crm-muted text-lg max-w-2xl">
            Stock your shelves with premium products at wholesale prices. 
            Maximize your retail margins with exclusive deals for KutzApp partners.
          </p>
        </div>

        {isSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-lg">Order placed successfully! We'll ship your supply out shortly.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => {
            const margin = product.msrp - product.wholesalePrice;
            const marginPercent = Math.round((margin / product.msrp) * 100);

            return (
              <div 
                key={product.id} 
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Product Image Mock */}
                <div className={`h-48 ${product.imageColor} relative p-4 flex flex-col justify-between overflow-hidden group-hover:scale-[1.02] transition-transform duration-500`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-0"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      {product.category}
                    </span>
                    <span className="bg-[#ea580c] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                      {marginPercent}% Retail Margin
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-white text-xl font-bold tracking-tight">{product.name}</h3>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex justify-between items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <div className="text-xs text-gray-500 font-medium mb-1">Wholesale Cost</div>
                        <div className="text-2xl font-black text-[#ea580c]">
                          ${product.wholesalePrice.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-medium mb-1">Retail MSRP</div>
                        <div className="text-lg font-bold text-gray-400 line-through">
                          ${product.msrp.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-emerald-600 font-bold px-1">
                      <span>Potential Profit:</span>
                      <span>+${margin.toFixed(2)} per unit</span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 group-hover:bg-[#ea580c]"
                    >
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add to Order
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Cart Button (Mobile/Small Screens) */}
      {!isCheckoutOpen && itemCount > 0 && (
        <button
          onClick={() => setIsCheckoutOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-[#ea580c] text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-3 hover:scale-105 transition-transform"
        >
          <div className="relative">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-white text-[#ea580c] text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
              {itemCount}
            </span>
          </div>
          <span className="font-bold">${cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Sidebar Checkout */}
      {isCheckoutOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsCheckoutOpen(false)}
        />
      )}
      
      <div 
        className={`
          fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col
          lg:relative lg:h-[calc(100vh-8rem)] lg:w-96 lg:max-w-none lg:shadow-none lg:border lg:border-gray-200 lg:rounded-2xl lg:transform-none lg:z-10
          ${isCheckoutOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          ${itemCount === 0 ? 'lg:hidden' : 'lg:flex'}
        `}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 lg:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#ea580c]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Your Order</h2>
          </div>
          <button 
            onClick={() => setIsCheckoutOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <p className="text-lg">Your cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex gap-4 items-start">
                <div className={`w-16 h-16 rounded-xl ${item.product.imageColor} flex-shrink-0 shadow-inner`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{item.product.name}</h4>
                  <div className="text-sm text-[#ea580c] font-semibold">${item.product.wholesalePrice.toFixed(2)}</div>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded-l-lg transition-colors"
                      >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                        </svg>
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-200 rounded-r-lg transition-colors"
                      >
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </button>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 lg:rounded-b-2xl">
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className="font-medium text-emerald-600">Free</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-black text-gray-900">${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-start gap-2">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600 mt-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Projected Retail Value</div>
                  <div className="text-lg font-black text-emerald-600">${cartMsrpTotal.toFixed(2)}</div>
                  <div className="text-xs text-emerald-700 font-medium mt-1">
                    You'll make <span className="font-bold bg-emerald-200 px-1 rounded">${totalMargin.toFixed(2)}</span> in pure profit!
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleCheckout}
              className="w-full py-4 bg-[#ea580c] hover:bg-orange-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Checkout Now
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
