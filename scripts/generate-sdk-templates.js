const fs = require('fs');
const path = require('path');

const templates = ['modern', 'classic', 'minimal', 'vibrant', 'noir', 'sunset', 'corporate', 'sporty', 'editorial'];

const outputDir = path.join(__dirname, '../public/sdk-templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const baseHtml = (tmpl) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tmpl.charAt(0).toUpperCase() + tmpl.slice(1)} Barber Shop</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: 'var(--theme-color)',
            secondary: '#1a1a1a',
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    /* Dynamic theme variables */
    :root {
      --theme-color: #c0a05b;
    }
  </style>
</head>
<body class="bg-gray-50 text-gray-900 transition-colors duration-300">

  <div id="app-container" class="min-h-screen flex flex-col">
    <!-- Loading State -->
    <div id="loading" class="flex-1 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  </div>

  <script src="../../kutzapp-sdk.js"></script>

  <script>
    const templateType = '${tmpl}';
    
    window.addEventListener('load', async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shopId = urlParams.get('shopId') || 'cmn9kj24n0000lqzc7kcsmpst';

      const modalScript = document.createElement('script');
      modalScript.src = '../../booking-modal.js';
      modalScript.setAttribute('data-shop-id', shopId);
      document.head.appendChild(modalScript);

      try {
        if (typeof KutzApp === 'undefined') throw new Error("SDK failed to load");
        
        KutzApp.init(shopId);
        const data = await KutzApp.getPublicData();
        renderApp(data);
      } catch (err) {
        document.getElementById('app-container').innerHTML = 
          '<div class="p-8 text-center text-red-500">Error loading SDK: ' + err.message + '</div>';
      }
    });

    function renderApp(data) {
      const shop = data.shop || {};
      const services = (data.services || []).filter(s => s.duration > 0);
      const products = data.products || [];
      const reviews = data.reviews || [];
      
      const themeColor = shop.customization?.primaryColor || '#c0a05b';
      document.documentElement.style.setProperty('--theme-color', themeColor);

      const nameEl = document.getElementById('shop-name');
      if (nameEl) nameEl.textContent = shop.name;
      
      const descEl = document.getElementById('shop-desc');
      if (descEl) descEl.textContent = shop.description || 'Welcome';

      const servicesContainer = document.getElementById('services-container');
      if (servicesContainer && window.renderServices) {
        servicesContainer.innerHTML = window.renderServices(services);
      }

      const productsContainer = document.getElementById('products-container');
      if (productsContainer && window.renderProducts) {
        productsContainer.innerHTML = window.renderProducts(products);
      }
      
      const loadingEl = document.getElementById('loading');
      if (loadingEl) loadingEl.remove();
      
      const appContent = document.getElementById('app-content');
      if (appContent) appContent.classList.remove('hidden');
      
      // Wire up buttons
      document.querySelectorAll('.book-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          if (window.BarberBooking) {
            window.BarberBooking.open(btn.dataset.id);
          }
        };
      });

      document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault();
          const originalAlert = window.alert;
          window.alert = () => {};
          KutzApp.buyProduct(btn.dataset.id, 1).then(res => {
            window.alert = originalAlert;
            alert('Added ' + res.quantity + 'x ' + res.product.name + ' to cart!');
          }).catch(err => {
            window.alert = originalAlert;
            alert('Error: ' + err.message);
          });
        };
      });
    }
  </script>
</body>
</html>`;

const renderers = {
  modern: `
    <div id="app-content" class="hidden bg-white text-gray-900 font-sans min-h-screen">
      <header class="bg-white shadow-sm py-16 border-b border-gray-100 text-center">
        <h1 id="shop-name" class="text-5xl font-extrabold mb-4" style="color: var(--theme-color)"></h1>
        <p id="shop-desc" class="text-gray-500 text-xl max-w-2xl mx-auto"></p>
      </header>
      <main class="max-w-6xl mx-auto px-4 py-16 space-y-20">
        <section>
          <h2 class="text-3xl font-bold mb-10 text-center" style="color: var(--theme-color)">Services</h2>
          <div id="services-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
        </section>
        <section>
          <h2 class="text-3xl font-bold mb-10 text-center" style="color: var(--theme-color)">Products</h2>
          <div id="products-container" class="grid grid-cols-1 md:grid-cols-4 gap-8"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 flex flex-col hover:-translate-y-1 transition-transform">
          <h3 class="text-2xl font-bold mb-3">\${s.name}</h3>
          <p class="text-gray-500 mb-6 flex-1">\${s.description || ''}</p>
          <div class="flex justify-between items-center mt-auto">
            <span class="text-2xl font-bold" style="color: var(--theme-color)">$\${s.price.toFixed(2)}</span>
            <button class="book-btn bg-[var(--theme-color)] text-white px-8 py-3 rounded-full font-bold hover:opacity-90" data-id="\${s.id}">Book</button>
          </div>
        </div>
      \`).join('');
      
      window.renderProducts = (products) => products.map(p => \`
        <div class="bg-white rounded-2xl shadow border border-gray-100 p-6 flex flex-col">
          <h3 class="text-lg font-bold mb-2">\${p.name}</h3>
          <p class="text-gray-500 mb-4 flex-1 text-sm">\${p.description || ''}</p>
          <div class="flex justify-between items-center mt-auto">
            <span class="text-lg font-bold" style="color: var(--theme-color)">$\${p.price.toFixed(2)}</span>
            <button class="buy-btn border border-[var(--theme-color)] text-[var(--theme-color)] px-4 py-1 rounded-full font-bold hover:bg-[var(--theme-color)] hover:text-white" data-id="\${p.id}">Buy</button>
          </div>
        </div>
      \`).join('');
    </script>
  `,
  classic: `
    <div id="app-content" class="hidden bg-[#fdfbf7] text-[#2c1e16] font-serif min-h-screen">
      <header class="py-24 text-center border-b-4 border-[var(--theme-color)] bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
        <h1 id="shop-name" class="text-6xl font-bold uppercase tracking-widest mb-6"></h1>
        <p id="shop-desc" class="text-xl italic opacity-80 max-w-2xl mx-auto"></p>
      </header>
      <main class="max-w-5xl mx-auto px-6 py-20 space-y-32">
        <section>
          <h2 class="text-4xl font-bold mb-16 text-center uppercase tracking-widest border-b border-[#2c1e16] pb-6">Our Services</h2>
          <div id="services-container" class="grid grid-cols-1 md:grid-cols-2 gap-12"></div>
        </section>
        <section>
          <h2 class="text-4xl font-bold mb-16 text-center uppercase tracking-widest border-b border-[#2c1e16] pb-6">Apothecary</h2>
          <div id="products-container" class="grid grid-cols-1 md:grid-cols-3 gap-8"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="border border-[#2c1e16] p-10 flex flex-col items-center text-center">
          <h3 class="text-2xl font-bold mb-3 uppercase">\${s.name}</h3>
          <div class="text-2xl font-bold mb-6" style="color: var(--theme-color)">$\${s.price.toFixed(2)} \${s.duration ? ' • '+s.duration+' MINS' : ''}</div>
          <p class="opacity-80 mb-10 flex-1">\${s.description || ''}</p>
          <button class="book-btn border-2 border-[var(--theme-color)] text-[var(--theme-color)] px-10 py-4 uppercase tracking-widest hover:bg-[var(--theme-color)] hover:text-white transition-colors font-sans text-sm font-bold w-full" data-id="\${s.id}">Book Appointment</button>
        </div>
      \`).join('');
      
      window.renderProducts = (products) => products.map(p => \`
        <div class="border border-[#2c1e16] p-8 flex flex-col items-center text-center">
          <h3 class="text-xl font-bold mb-3 uppercase">\${p.name}</h3>
          <div class="text-xl font-bold mb-8" style="color: var(--theme-color)">$\${p.price.toFixed(2)}</div>
          <button class="buy-btn bg-[#2c1e16] text-[#fdfbf7] px-8 py-3 uppercase tracking-widest hover:bg-[var(--theme-color)] transition-colors font-sans text-xs w-full mt-auto" data-id="\${p.id}">Purchase</button>
        </div>
      \`).join('');
    </script>
  `,
  minimal: `
    <div id="app-content" class="hidden bg-[#fafafa] text-[#333] font-sans min-h-screen">
      <header class="py-20 px-8 flex flex-col md:flex-row md:justify-between md:items-end border-b border-gray-200 gap-6">
        <div>
          <h1 id="shop-name" class="text-4xl font-light tracking-wide" style="color: var(--theme-color)"></h1>
        </div>
        <div id="shop-desc" class="text-sm uppercase tracking-widest opacity-50 md:max-w-sm md:text-right"></div>
      </header>
      <main class="max-w-4xl mx-auto px-8 py-24 space-y-32">
        <section>
          <h2 class="text-sm font-bold uppercase tracking-widest mb-16 opacity-50">Services</h2>
          <div id="services-container" class="space-y-6"></div>
        </section>
        <section>
          <h2 class="text-sm font-bold uppercase tracking-widest mb-16 opacity-50">Products</h2>
          <div id="products-container" class="space-y-6"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="flex flex-col md:flex-row md:items-center justify-between py-8 border-b border-gray-200 group">
          <div class="flex-1 pr-8">
            <h3 class="text-2xl font-medium mb-2">\${s.name}</h3>
            <p class="text-gray-500">\${s.description || ''}</p>
          </div>
          <div class="flex items-center gap-10 mt-6 md:mt-0">
            <span class="text-xl">$\${s.price.toFixed(2)}</span>
            <button class="book-btn text-[var(--theme-color)] font-medium hover:underline uppercase text-sm tracking-wide" data-id="\${s.id}">Book</button>
          </div>
        </div>
      \`).join('');
      
      window.renderProducts = (products) => products.map(p => \`
        <div class="flex flex-col md:flex-row md:items-center justify-between py-6 border-b border-gray-100">
          <div class="flex-1 pr-8">
            <h3 class="text-xl font-medium">\${p.name}</h3>
          </div>
          <div class="flex items-center gap-8 mt-4 md:mt-0">
            <span class="text-lg">$\${p.price.toFixed(2)}</span>
            <button class="buy-btn text-gray-500 hover:text-black uppercase text-xs tracking-wide" data-id="\${p.id}">Buy</button>
          </div>
        </div>
      \`).join('');
    </script>
  `,
  sporty: `
    <div id="app-content" class="hidden bg-gray-100 text-gray-900 font-sans min-h-screen pb-20">
      <header class="bg-red-600 text-white py-16 px-4 text-center transform -skew-y-2 mb-20 shadow-xl border-b-[16px] border-black">
        <h1 id="shop-name" class="text-7xl md:text-8xl font-black italic uppercase transform skew-y-2 mb-4"></h1>
        <p id="shop-desc" class="text-2xl font-bold uppercase tracking-widest transform skew-y-2 opacity-90 max-w-3xl mx-auto"></p>
      </header>
      <main class="max-w-6xl mx-auto px-4 py-8 space-y-24">
        <section>
          <div class="flex items-center justify-center mb-12 gap-6">
            <div class="h-2 flex-1 bg-red-600"></div>
            <h2 class="text-5xl font-black italic uppercase text-red-600 tracking-tighter">Services</h2>
            <div class="h-2 flex-1 bg-red-600"></div>
          </div>
          <div id="services-container" class="grid grid-cols-1 md:grid-cols-3 gap-8"></div>
        </section>
        <section>
          <div class="flex items-center justify-center mb-12 gap-6">
            <div class="h-2 flex-1 bg-black"></div>
            <h2 class="text-5xl font-black italic uppercase text-black tracking-tighter">Gear</h2>
            <div class="h-2 flex-1 bg-black"></div>
          </div>
          <div id="products-container" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="bg-white border-8 border-black p-8 flex flex-col transform hover:-translate-y-2 transition-transform shadow-[8px_8px_0_0_#dc2626]">
          <h3 class="text-3xl font-black italic uppercase mb-4 leading-tight">\${s.name}</h3>
          <div class="text-4xl font-black mb-6 text-red-600">$\${s.price.toFixed(2)}</div>
          <p class="text-base font-bold text-gray-500 mb-8 flex-1 uppercase tracking-wide">\${s.description || ''}</p>
          <button class="book-btn w-full bg-red-600 text-white font-black italic uppercase py-5 text-xl hover:bg-black transition-colors" data-id="\${s.id}">BOOK IT</button>
        </div>
      \`).join('');
      
      window.renderProducts = (products) => products.map(p => \`
        <div class="bg-white border-4 border-black p-6 flex flex-col text-center shadow-[4px_4px_0_0_#000]">
          <h3 class="text-xl font-black uppercase mb-2 leading-tight">\${p.name}</h3>
          <div class="text-2xl font-black mb-6 text-red-600">$\${p.price.toFixed(2)}</div>
          <button class="buy-btn w-full bg-black text-white font-bold uppercase py-3 hover:bg-red-600 transition-colors mt-auto text-lg" data-id="\${p.id}">BUY</button>
        </div>
      \`).join('');
    </script>
  `,
  editorial: `
    <div id="app-content" class="hidden bg-[#f4f4f0] text-black font-sans min-h-screen selection:bg-black selection:text-white">
      <header class="py-32 px-8 border-b-[3px] border-black text-center">
        <h1 id="shop-name" class="text-6xl md:text-8xl font-bold tracking-tighter mb-8 uppercase leading-none"></h1>
        <p id="shop-desc" class="text-2xl max-w-2xl mx-auto font-serif opacity-80 italic"></p>
      </header>
      <main class="max-w-4xl mx-auto px-8 py-32 space-y-40">
        <section>
          <h2 class="text-5xl font-bold tracking-tighter mb-20 text-center uppercase">The Collection</h2>
          <div id="services-container" class="space-y-0 border-t-[3px] border-black"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center py-12 border-b-[3px] border-black group">
          <div class="flex-1 md:pr-16 mb-8 md:mb-0">
            <h3 class="text-4xl font-bold tracking-tight mb-4 group-hover:italic transition-all uppercase">\${s.name}</h3>
            <p class="text-xl font-serif opacity-80 leading-relaxed">\${s.description || ''}</p>
          </div>
          <div class="flex flex-col md:items-end w-full md:w-auto">
            <span class="text-3xl font-bold mb-6 tracking-tighter">$\${s.price.toFixed(2)}</span>
            <button class="book-btn bg-black text-white px-12 py-5 uppercase tracking-[0.2em] text-sm font-bold hover:bg-gray-800 transition-colors w-full md:w-auto" data-id="\${s.id}">RESERVE</button>
          </div>
        </div>
      \`).join('');
      window.renderProducts = () => ''; 
    </script>
  `,
  vibrant: `
    <div id="app-content" class="hidden bg-gray-50 text-gray-900 font-sans min-h-screen pb-20">
      <header class="bg-gradient-to-r from-purple-600 to-pink-500 text-white py-32 text-center shadow-2xl relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <h1 id="shop-name" class="relative text-7xl font-black tracking-tight mb-6 drop-shadow-lg"></h1>
        <p id="shop-desc" class="relative text-2xl font-medium opacity-90 max-w-3xl mx-auto drop-shadow"></p>
      </header>
      <main class="max-w-6xl mx-auto px-6 py-16 space-y-24 -mt-16 relative z-10">
        <section>
          <div id="services-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"></div>
        </section>
        <section>
          <h2 class="text-4xl font-black text-center mb-12 text-purple-600">Products</h2>
          <div id="products-container" class="grid grid-cols-2 md:grid-cols-4 gap-6"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map((s, i) => \`
        <div class="bg-white rounded-[2rem] shadow-xl p-10 transform hover:scale-105 transition-transform flex flex-col text-center border border-gray-100 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/20 to-purple-600/0 rounded-bl-[4rem]"></div>
          <div class="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-3xl font-bold shadow-inner">\${['✨','🔥','💈','✂️','💈','🔥'][i%6]}</div>
          <h3 class="text-3xl font-black mb-4 tracking-tight">\${s.name}</h3>
          <p class="text-gray-500 mb-10 flex-1 leading-relaxed text-lg">\${s.description || ''}</p>
          <div class="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">$\${s.price.toFixed(2)}</div>
          <button class="book-btn w-full bg-black text-white px-8 py-5 rounded-[1.5rem] font-bold text-lg hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all" data-id="\${s.id}">Book Now</button>
        </div>
      \`).join('');
      
      window.renderProducts = (products) => products.map(p => \`
        <div class="bg-white rounded-3xl shadow-lg p-6 flex flex-col text-center border border-purple-100">
          <h3 class="text-lg font-bold mb-2 tracking-tight">\${p.name}</h3>
          <div class="text-xl font-black mb-6 text-pink-500">$\${p.price.toFixed(2)}</div>
          <button class="buy-btn w-full bg-purple-100 text-purple-700 font-bold py-3 rounded-xl hover:bg-purple-600 hover:text-white transition-colors mt-auto" data-id="\${p.id}">Buy</button>
        </div>
      \`).join('');
    </script>
  `,
  noir: `
    <div id="app-content" class="hidden bg-black text-white font-sans min-h-screen">
      <header class="py-32 px-8 text-center border-b border-zinc-900 bg-zinc-950">
        <h1 id="shop-name" class="text-6xl tracking-[0.2em] font-light uppercase mb-8" style="color: var(--theme-color)"></h1>
        <p id="shop-desc" class="text-xl text-zinc-400 tracking-widest max-w-3xl mx-auto uppercase leading-loose"></p>
      </header>
      <main class="max-w-5xl mx-auto px-6 py-24 space-y-32">
        <section>
          <h2 class="text-center text-sm tracking-[0.4em] uppercase text-zinc-600 mb-20 font-bold">Services</h2>
          <div id="services-container" class="grid grid-cols-1 md:grid-cols-2 gap-12"></div>
        </section>
        <section>
          <h2 class="text-center text-sm tracking-[0.4em] uppercase text-zinc-600 mb-20 font-bold">Products</h2>
          <div id="products-container" class="grid grid-cols-1 md:grid-cols-3 gap-8"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="bg-black border border-zinc-800 p-12 flex flex-col items-center text-center hover:border-zinc-600 transition-colors shadow-2xl">
          <h3 class="text-2xl font-medium tracking-widest uppercase mb-6">\${s.name}</h3>
          <div class="text-3xl font-light mb-8 tracking-wider" style="color: var(--theme-color)">$\${s.price.toFixed(2)}</div>
          <p class="text-zinc-500 mb-12 flex-1 leading-loose tracking-wide text-sm">\${s.description || ''}</p>
          <button class="book-btn w-full bg-white text-black font-bold uppercase tracking-[0.2em] py-5 text-sm hover:bg-gray-300 transition-colors" data-id="\${s.id}">Reserve</button>
        </div>
      \`).join('');
      
      window.renderProducts = (products) => products.map(p => \`
        <div class="border border-zinc-800 p-8 flex flex-col items-center text-center">
          <h3 class="text-lg tracking-widest uppercase mb-4 text-zinc-300">\${p.name}</h3>
          <div class="text-xl font-light mb-8 text-white">$\${p.price.toFixed(2)}</div>
          <button class="buy-btn w-full border border-zinc-600 text-zinc-400 font-bold uppercase tracking-[0.2em] py-3 text-xs hover:bg-zinc-800 hover:text-white transition-colors mt-auto" data-id="\${p.id}">Purchase</button>
        </div>
      \`).join('');
    </script>
  `,
  sunset: `
    <div id="app-content" class="hidden bg-gradient-to-br from-purple-900 via-gray-900 to-orange-900 text-white font-sans min-h-screen">
      <header class="py-32 text-center relative overflow-hidden">
        <div class="absolute inset-0 bg-black/40"></div>
        <h1 id="shop-name" class="relative text-7xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-purple-400"></h1>
        <p id="shop-desc" class="relative text-2xl font-medium text-purple-200/80 max-w-3xl mx-auto"></p>
      </header>
      <main class="max-w-6xl mx-auto px-6 py-16 space-y-24">
        <section>
          <div id="services-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="bg-white/10 backdrop-blur-xl rounded-3xl p-10 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col hover:border-orange-500/50 hover:bg-white/20 transition-all">
          <h3 class="text-3xl font-bold mb-4 tracking-tight">\${s.name}</h3>
          <div class="text-2xl font-bold mb-8 text-orange-400">$\${s.price.toFixed(2)}</div>
          <p class="text-purple-100/80 mb-10 flex-1 leading-relaxed text-lg">\${s.description || ''}</p>
          <button class="book-btn w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all" data-id="\${s.id}">Book</button>
        </div>
      \`).join('');
      window.renderProducts = () => '';
    </script>
  `,
  corporate: `
    <div id="app-content" class="hidden bg-slate-50 text-slate-900 font-sans min-h-screen">
      <header class="bg-slate-900 text-white py-24 px-8 text-center border-b-4 border-blue-500 shadow-xl">
        <h1 id="shop-name" class="text-5xl md:text-6xl font-bold mb-6 tracking-tight"></h1>
        <p id="shop-desc" class="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"></p>
      </header>
      <main class="max-w-6xl mx-auto px-4 py-24 space-y-24">
        <section>
          <h2 class="text-4xl font-bold mb-12 text-slate-900 border-l-4 border-blue-500 pl-4">Professional Services</h2>
          <div id="services-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>
        </section>
      </main>
    </div>
    <script>
      window.renderServices = (services) => services.map(s => \`
        <div class="bg-white rounded-xl shadow-md border border-slate-200 p-10 flex flex-col hover:shadow-xl transition-shadow">
          <h3 class="text-2xl font-bold mb-3 text-slate-900">\${s.name}</h3>
          <p class="text-slate-500 text-base mb-8 flex-1 leading-relaxed">\${s.description || ''}</p>
          <div class="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
            <span class="text-2xl font-bold text-blue-600">$\${s.price.toFixed(2)}</span>
            <button class="book-btn bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md" data-id="\${s.id}">Book</button>
          </div>
        </div>
      \`).join('');
      window.renderProducts = () => '';
    </script>
  `
};

templates.forEach(tmpl => {
  const filePath = path.join(outputDir, `${tmpl}.html`);
  const content = renderers[tmpl] || renderers.modern; 
  
  const finalHtml = baseHtml(tmpl).replace(
    '<div id="app-container" class="min-h-screen flex flex-col">',
    `<div id="app-container" class="min-h-screen flex flex-col">\n${content}`
  );
  
  fs.writeFileSync(filePath, finalHtml);
  console.log(`Generated ${tmpl}.html`);
});

console.log('Done generating all templates!');