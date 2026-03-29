const fs = require('fs');
const content = `'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
export default function CheckoutButton({ 
    shopId, 
    appointmentId, 
    price: servicePrice, 
    serviceName, 
    shopName,
    serviceId
}: { 
    shopId: string, 
    appointmentId: string, 
    price: number,
    serviceName: string,
    shopName: string,
    serviceId?: string
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  // Cart state
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]); 
  const router = useRouter();
  // Load products when modal opens
  useEffect(() => {
    if (showQR && products.length === 0) {
      fetch(\`/api/shops/\${shopId}/products\`)
        .then(res => res.json())
        .then(data => {
            // Only sell retail products
            setProducts(data.filter((p: any) => p.type !== 'BACKBAR'));
        });
      // Initialize cart with the primary service
      setCart([{
          id: 'primary-service',
          serviceId: serviceId || null,
          name: serviceName,
          price: servicePrice,
          quantity: 1,
          type: 'SERVICE'
      }]);
    }
  }, [showQR, shopId, serviceName, servicePrice, serviceId, products.length]);
  const addToCart = (product: any) => {
      const existing = cart.find(item => item.productId === product.id);
      if (existing) {
          setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      } else {
          setCart([...cart, {
              id: \`prod-\${product.id}\`,
              productId: product.id,
              name: product.name,
              price: product.price,
              cost: product.cost,
              taxRate: product.taxRate,
              trackInventory: product.trackInventory,
              quantity: 1,
              type: 'PRODUCT'
          }]);
      }
  };
  const removeFromCart = (id: string) => {
      const existing = cart.find(item => item.id === id);
      if (existing && existing.quantity > 1 && existing.id !== 'primary-service') {
          setCart(cart.map(item => item.id === id ? { ...item, quantity: item.quantity - 1 } : item));
      } else if (existing && existing.id !== 'primary-service') {
          setCart(cart.filter(item => item.id !== id));
      }
  };
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const finalTotal = Math.max(0, subtotal - discount + tipAmount);
  const paymentLink = \`https://mock-payment-gateway.com/pay?amount=\${finalTotal}&item=Checkout&\${encodeURIComponent(shopName)}&ref=\${appointmentId}\`;
  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      // Build proper cart shape for API
      const cartItemsPayload = cart.map(c => ({
          productId: c.productId || null,
          serviceId: c.serviceId || null,
          quantity: c.quantity,
          price: c.price,
          cost: c.cost || 0,
          taxRate: c.taxRate || 0,
          trackInventory: c.trackInventory || false
      }));
      const response = await fetch(\`/api/shops/\${shopId}/appointments/\${appointmentId}/checkout\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringi      }
  };
  const subtotal = cart.reduce((sum, ite     };
     cym  const finalTotal = Math.max(0, subtotal - discount            // Basic single paymen  const paymentLink = \`https://mock-payment-gateway.com/pay?amoume  const handleMarkAsPaid = async () => {
    setIsProcessing(true);
    try {
      // Build proper cart shape for API
      c        router.refresh();
       setIsProcessing(true);
    try {
  re    try {
             aler      //rr      const cartItemsPayload = cart.ma             productId: c.product      console.erro          serviceId: c.serviceId || nullre          } finally {
      setIsProcessin              }
  };
  const tipPresets = [0, 2, 5, 10];
  return (
    <>
        <button 
        onClick={() => setShowQR(true)} 
        disabled={isProcessing}
        className="b        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.st t        headers: { 'Cole        body: JSON.stringi      }
  };
  co        >
        <span>Checkout</span>
        <span     cym  const finalTotal = Math.max(0, subtoin    setIsProcessing(true);
    try {
      // Build proper cart shape for API
      c        router.refresh();
       setIsProcessing(true);
    try {
  re    try {
             aler      //rr      come    try {
      // Build l       //-8      c        router.refresh();
      00       setIsProcessing(true);
 x-    try {
                     <div clas            ju      setIsProcessin              }
  };
  const tipPresets = [0, 2, 5, 10];
  return (
    <>
        <button 
        onClick={() => setShowQR(true)} 
        disabled={isProcex   };
  const tipPresets = [0, 2, 5an  cyn  return (
    <>
                      <>
         p         onClick-g        disabled={isProcessing}
                 className="b                    headers: { 'Content-Type': 'applicse        body: JSON.st t        headers: { 'Cole        te  };
  co        >
        <span>Checkout</span>
        <span     cym  const f?<  ctt                        </div>
                 try {
      // Build proper cart shape for API
      c        router.refresh              //        c        router.refresh();
      }
                        <div clas    try {
  re    try {
    l   re     b            10      // Build l       //-8      c       llbar       00       setIsProcessing(true);
 x-    try {
       fo x-    try {
                     <dki           -4  };
  const tipPresets = [0, 2, 5, 10];
  return (
    <>                        c    return (
    <>
        <button ga    <>                    onClick          disabled={isProcex   }             const tipPresets = [0, 2, 5aas    <>
                      <>
         p   c      >N         p         onClab                 className="b                                 co        >
        <span>Checkout</span>
        <span     cym  const f?<  ctt                        </div>
                 try {
      // B 
                      <span     cym  const                   try {
      // Build proper cart shape for API
          // Build properat      c        router.refresh          r-      }
                        <div clas    try {
  re    try {
    l   re   -between h  re                                           l          x-    try {
       fo x-    try {
                     <dki           -4  };
  const tipPresets = [0, 2, 5, 10];
                                      const tipPresets = [0, 2, 5, 10];
  rd fo  return (
    <>                 ce    <>   2)    <>
        <button ga    <>                  </                      <>
         p   c      >N         p         onClab                 className="b                                         p   c                   <span>Checkout</span>
        <span     cym  const f?<  ctt                        </div>
                 try to        <span     cym  const                   try {
      // B 
                      <span    40      // B 
         wi          ti      // Build proper cart shape for API
                                    // Build properat      c     fl                        <div clas    try {
  re    try {
    l   re   -be     re    try {
    l   re   -between h  re={    l   re  ss       fo x-    try {
                     <dki           -4  };
  const tipPresets = [0, 25"                        const tipPresets = [0, 2, 5, 10];
     -0                                      rd fo  return (
    <>                 ce    <>   2)    <>
        <te    <>                    <button ga    <>                 cl         p   c      >N         p         onClab                 claty        <span     cym  const f?<  ctt                        </div>
                 try to        <span     cym  const                   try {
      /                             try to        <span     cym  const                       // B 
                      <span    40      // B 
         wi       b           r         wi          ti      // Build propehi                                    // Build properat      c  ut  re    try {
    l   re   -be     re    try {
    l   re   -between h  re={    l   re  ss       fo x-    trte    l   re  on    l   re   -betwee                                  <dki           -4  };
  const tipPresets = f  const tipPresets = [0, 25"             /s     -0                                      rd fo  return (
    <>                 oC    <>                 ce    <>   2)    <>
        <te    <-4        <te    <>                    <butns                 try to        <span     cym  const                   try {
      /                             try to        <span     cym  const                       // B 
                      <span    4mo      /                             try to        <span     cym                                   <span    40      // B 
         wi       b           r         wi          t-         wi       b           r       w-16 te    l   re   -be     re    try {
    l   re   -between h  re={    l   re  ss       fo x-    trte    l   re  on    l   re   -betwee                            l   re   -between h  re={      const tipPresets = f  const tipPresets = [0, 25"             /s     -0                                      rd fo  return (
    <>                 oC      <>                 oC    <>                 ce    <>   2)    <>
        <te    <-4        <te    <>                    <          <te    <-4        <te    <>                    <butns     Na      /                             try to        <span     cym  const                       // B 
                      <span    4mo  pe                      <span    4mo      /                             try to        <span     cymse         wi       b           r         wi          t-         wi       b           r       w-16 te    l   re   -be     re    try {
    l   re   -betweente    l   re   -between h  re={    l   re  ss       fo x-    trte    l   re  on    l   re   -betwee                            l   r <    <>                 oC      <>                 oC    <>                 ce    <>   2)    <>
        <te    <-4        <te    <>                    <          <te    <-4        <te    <>                    <butns     Na      /                             try to        <span  ss        <te    <-4        <te    <>                    <          <te    <-4        <te                              <span    4mo  pe                      <span    4mo      /                             try to        <span     cymse         wi       b           r         wi          t-         wi       b           r t     l   re   -betweente    l   re   -between h  re={    l   re  ss       fo x-    trte    l   re  on    l   re   -betwee                            l   r <    <>                 oC      <>                 oC    <>                 ce    <>   2)    <>
        <te    <-          <te    <-4        <te    <>                    <          <te    <-4        <te    <>                    <butns     Na      /                             try to        <span  ss        <te    <-4        <te    <>                    <                 <te    <-          <te    <-4        <te    <>                    <          <te    <-4        <te    <>                    <butns     Na      /                             try to        <span  ss        <te    <-4        <te    <>                    <                 <te    <-          <te    <-4        <te    <>                    <          <te    <-4        <te    <>                    <butns     Na      /                             try to        <span  ss        <te    <-4        <te    <>                    <                 <te    <-          <te    <-4        <te    <>                    <          <te    <-4        <te    <>                    <butns     Na      /                             try to        <span  ss        <te0px] text-green-400/80 uppercase tracking-wider mb-2">Payment Method</label>
                                      <div className="flex flex-col gap-2">
                                        {['CASH', 'CARD', 'MOBILE'].map(m => (
                                          <button key={m} onClick={() => setPaymentMethod(m)}
                                            className={\`py-2 rounded px-3 text-xs font-bold transition-colors text-left \${paymentMethod === m ? 'bg-green-600 text-white shadow-lg' : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'}\`}>
                                            {m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '📱 Mobile Gateway'}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="w-1/2 text-right flex flex-col justify-end">
                                                                           <div className="flex flex-col gap-2sN                                        {['CASH', 'CARD', 'MOBILE']                                                   <button key={m} onClick={() => setPre                                            className={\`py-2 rounded px-3 text-xs font-boldip                                            {m === 'CASH' ? '💵 Cash' : m === 'CARD' ? '💳 Card' : '📱 Mobile Gateway'}
                                          </button>
                                        ))}
                                t<                                          </button>
                                        ))}
                                                                                                                                                                  </div>

                                     <div ss                                                                           <div className="flexan                                          </button>
                                        ))}
                                t<                                          </button>
                                        ))}
                                                                                                                                                                  </div>

                                     <div ss                                             it                                        ))}
                                                                                            ))}
                                        lT                                            
                                     <div ss                                                                           <div className="flexan                           <                                        ))}
                                t<                                          </buttecho "" > components/CheckoutButton.tsx
