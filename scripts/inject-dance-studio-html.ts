import { prisma } from '../lib/prisma';

const customHtml = `
<style>
  :root {
    --bollywood-primary: {{primaryColor}}; /* Default could be a vibrant saffron or magenta */
    --bollywood-secondary: {{secondaryColor}}; /* Gold or Teal */
    --bollywood-bg-dark: #1a0b2e; /* Deep rich purple/indigo */
    --bollywood-bg-light: #2d164d;
    --bollywood-gold: #ffd700;
    --bollywood-magenta: #ff007f;
    --bollywood-orange: #ff6b00;
  }
  
  html {
    scroll-behavior: smooth;
  }
  
  /* Vibrant Bollywood Gradient Text */
  .bollywood-gradient-text {
    background: linear-gradient(135deg, var(--bollywood-gold) 0%, var(--bollywood-orange) 50%, var(--bollywood-magenta) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 40px rgba(255, 107, 0, 0.4);
  }
  
  /* Rich Glassmorphism */
  .bollywood-glass {
    background: rgba(45, 22, 77, 0.5);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 215, 0, 0.15);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  }
  
  /* Dynamic Card Hover Effects */
  .bollywood-card-hover {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .bollywood-card-hover:hover {
    transform: translateY(-8px) scale(1.02);
    background: rgba(45, 22, 77, 0.8);
    border-color: var(--bollywood-gold);
    box-shadow: 0 15px 45px -10px rgba(255, 0, 127, 0.4);
  }
  
  /* Perfect iframe cover for 16:9 videos, scaled 135% to hide controls */
  .youtube-bg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 135vw;
    height: 75.93vw;
    min-height: 135vh;
    min-width: 240vh;
    pointer-events: none;
  }

  /* Animated Glowing Orbs for Background */
  .orb-1, .orb-2, .orb-3 {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.5;
    z-index: 0;
    animation: float 20s infinite ease-in-out;
  }
  .orb-1 {
    width: 600px; height: 600px;
    background: var(--bollywood-magenta);
    top: -100px; left: -100px;
  }
  .orb-2 {
    width: 500px; height: 500px;
    background: var(--bollywood-orange);
    bottom: -100px; right: -100px;
    animation-delay: -5s;
  }
  .orb-3 {
    width: 700px; height: 700px;
    background: var(--bollywood-gold);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -10s;
    opacity: 0.3;
  }
  
  @keyframes float {
    0% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0, 0) scale(1); }
  }
  
  /* Custom Buttons */
  .bollywood-btn {
    background: var(--bollywood-magenta);
    border: none;
    position: relative;
    overflow: hidden;
    z-index: 1;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }
  .bollywood-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: all 0.5s ease;
    z-index: -1;
  }
  .bollywood-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.25);
    background: #e60072;
  }
  .bollywood-btn:hover::before {
    left: 100%;
  }

  /* Weekly Timetable */
  .timetable-day-tab {
    padding: 10px 20px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 215, 0, 0.2);
    background: rgba(45, 22, 77, 0.4);
    color: rgba(255, 200, 200, 0.7);
  }
  .timetable-day-tab:hover {
    border-color: rgba(255, 215, 0, 0.5);
    color: white;
  }
  .timetable-day-tab.active {
    background: linear-gradient(90deg, var(--bollywood-orange), var(--bollywood-magenta));
    border-color: transparent;
    color: white;
    box-shadow: 0 5px 15px rgba(255, 0, 127, 0.4);
  }
  .timetable-card {
    background: rgba(45, 22, 77, 0.5);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 215, 0, 0.1);
    border-radius: 1.5rem;
    padding: 24px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .timetable-card:hover {
    transform: translateY(-4px);
    border-color: var(--bollywood-gold);
    box-shadow: 0 10px 30px -5px rgba(255, 0, 127, 0.3);
  }
  .timetable-skeleton {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 1rem;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes gradient-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .theme-flow-bg {
    background: linear-gradient(270deg, var(--bollywood-magenta), var(--bollywood-gold), var(--bollywood-orange), var(--bollywood-magenta));
    background-size: 300% 300%;
    animation: gradient-flow 4s ease infinite;
  }
  .group:hover .theme-flow-text-hover {
    background: linear-gradient(270deg, var(--bollywood-magenta), var(--bollywood-gold), var(--bollywood-orange), var(--bollywood-magenta));
    background-size: 300% 300%;
    animation: gradient-flow 4s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
</style>

<div id="top" class="min-h-screen text-neutral-100 font-sans selection:bg-pink-500/30 overflow-hidden relative" style="background-color: var(--bollywood-bg-dark)">
  
  <!-- Animated Background Orbs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div class="orb-1"></div>
    <div class="orb-2"></div>
    <div class="orb-3"></div>
  </div>

  <!-- Floating Header / Nav -->
  <!-- Floating Header / Nav -->
  <header class="fixed top-0 left-0 w-full z-[100] px-6 md:px-10 py-5 md:py-7 flex justify-between items-center bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all">
    <!-- Left: Logo & Name -->
    <div class="flex-1 flex items-center gap-3 md:gap-4">
      {{#shop.logoUrl}}
      <img src="{{shop.logoUrl}}" alt="{{shop.name}}" class="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 shadow-lg object-cover" />
      {{/shop.logoUrl}}
      <h1 class="text-lg md:text-xl font-semibold tracking-tight text-white drop-shadow-sm hidden sm:block whitespace-nowrap">{{shop.name}}</h1>
    </div>
    <!-- Center: Navigation Links -->
    <nav class="hidden md:flex items-center justify-center gap-12 flex-1">
      <a href="#classes" class="relative group text-xl font-medium text-white/70 transition-all duration-300">
        <span class="relative z-10 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,0,127,0.8)] theme-flow-text-hover">Programs</span>
        <span class="absolute -bottom-1 left-0 w-full h-[2px] theme-flow-bg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full shadow-[0_0_8px_rgba(255,0,127,0.6)]"></span>
      </a>
      <a href="#schedule" class="relative group text-xl font-medium text-white/70 transition-all duration-300">
        <span class="relative z-10 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,0,127,0.8)] theme-flow-text-hover">Schedule</span>
        <span class="absolute -bottom-1 left-0 w-full h-[2px] theme-flow-bg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full shadow-[0_0_8px_rgba(255,0,127,0.6)]"></span>
      </a>
      <a href="#faculty" class="relative group text-xl font-medium text-white/70 transition-all duration-300">
        <span class="relative z-10 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,0,127,0.8)] theme-flow-text-hover">Faculty</span>
        <span class="absolute -bottom-1 left-0 w-full h-[2px] theme-flow-bg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full shadow-[0_0_8px_rgba(255,0,127,0.6)]"></span>
      </a>
      <a href="#testimonials" class="relative group text-xl font-medium text-white/70 transition-all duration-300">
        <span class="relative z-10 transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(255,0,127,0.8)] theme-flow-text-hover">Community</span>
        <span class="absolute -bottom-1 left-0 w-full h-[2px] theme-flow-bg scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full shadow-[0_0_8px_rgba(255,0,127,0.6)]"></span>
      </a>
    </nav>
    
    <!-- Right: CTA -->
    <div class="flex-1 flex justify-end items-center">
      <!-- Register button removed -->
    </div>
  </header>

  <!-- Hero Section -->
  <div class="relative min-h-[90vh] flex items-center justify-center pt-20 z-10">
    <div class="absolute inset-0 z-0 rounded-b-[4rem] overflow-hidden">
      <!-- Video Background -->
      <div class="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <video 
          src="/VIDEO-2026-07-13-22-04-43.mp4" 
          autoplay 
          muted 
          loop 
          playsinline
          class="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
        ></video>
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-[var(--bollywood-bg-dark)] via-transparent to-[var(--bollywood-bg-dark)] opacity-90"></div>
    </div>

    <!-- Hero Content -->
    <div class="relative z-10 text-center max-w-5xl px-6">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bollywood-glass border border-yellow-400/30 mb-8 animate-bounce">
        <span class="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
        <span class="text-xs font-bold uppercase tracking-widest text-yellow-400">Feel The Rhythm</span>
      </div>
      <h2 class="text-6xl md:text-8xl font-black tracking-tighter mb-6 bollywood-gradient-text leading-tight">
        {{#heroTitle}}{{heroTitle}}{{/heroTitle}}{{^heroTitle}}Dance With Passion.{{/heroTitle}}
      </h2>
      <p class="text-xl md:text-3xl text-pink-100 mb-12 max-w-3xl mx-auto font-light drop-shadow-xl" style="text-shadow: 0 4px 20px rgba(0,0,0,0.8)">
        {{#shop.description}}{{shop.description}}{{/shop.description}}{{^shop.description}}Experience the vibrant energy, vibrant colors, and infectious beats of Bollywood.{{/shop.description}}
      </p>
      <div class="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <button 
          data-action="book"
          class="bollywood-btn w-full sm:w-auto px-12 py-5 rounded-full text-lg font-black tracking-widest flex items-center justify-center gap-3"
        >
          Register Now 
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Features / Why Us -->
  <section class="py-24 relative z-10">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
        <div class="flex flex-col items-center group bollywood-glass p-10 rounded-[2.5rem] bollywood-card-hover border-t border-yellow-500/20">
          <div class="w-28 h-28 rounded-2xl border-4 border-yellow-400/50 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,165,0,0.5)] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=2500&auto=format&fit=crop" class="w-full h-full object-cover" alt="Expert Choreography" />
          </div>
          <h3 class="text-2xl font-black text-white mb-4 uppercase tracking-wider">Expert Choreography</h3>
          <p class="text-pink-100/80 text-lg leading-relaxed">Learn authentic moves from industry professionals who bring movie magic to life.</p>
        </div>
        <div class="flex flex-col items-center group bollywood-glass p-10 rounded-[2.5rem] bollywood-card-hover border-t border-yellow-500/20 translate-y-0 md:-translate-y-8">
          <div class="w-28 h-28 rounded-2xl border-4 border-pink-500/50 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,0,127,0.5)] group-hover:-rotate-6 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
            <img src="/all_ages.png" class="w-full h-full object-cover bg-white" alt="All Ages & Levels" />
          </div>
          <h3 class="text-2xl font-black text-white mb-4 uppercase tracking-wider">All Ages & Levels</h3>
          <p class="text-pink-100/80 text-lg leading-relaxed">From kids to adults, beginners to advanced performers, everyone is welcome.</p>
        </div>
        <div class="flex flex-col items-center group bollywood-glass p-10 rounded-[2.5rem] bollywood-card-hover border-t border-yellow-500/20">
          <div class="w-28 h-28 rounded-2xl border-4 border-teal-500/50 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.5)] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2574&auto=format&fit=crop" class="w-full h-full object-cover" alt="Vibrant Community" />
          </div>
          <h3 class="text-2xl font-black text-white mb-4 uppercase tracking-wider">Vibrant Community</h3>
          <p class="text-pink-100/80 text-lg leading-relaxed">Join our festive performances, showcases, and celebrate the culture together.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Classes / Programs Section (SDK-Powered) -->
  <section id="classes" class="py-16 md:py-32 px-4 md:px-12 max-w-7xl mx-auto relative z-10">
    <div class="flex flex-col text-center mb-10 md:mb-20 gap-2 md:gap-4">
      <h2 class="text-xs md:text-sm font-black tracking-[0.2em] uppercase text-yellow-400">Our Curriculum</h2>
      <h3 class="text-4xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">Classes & Pricing</h3>
      <div class="w-16 md:w-24 h-1 bg-gradient-to-r from-yellow-400 to-pink-500 mx-auto rounded-full mt-2 md:mt-4"></div>
    </div>

    <!-- Dynamic class cards populated by SDK -->
    <div id="sdk-class-cards" class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-10">
      <!-- Skeleton loaders while SDK loads -->
      <div class="timetable-skeleton h-80 lg:h-96"></div>
      <div class="timetable-skeleton h-80 lg:h-96"></div>
      <div class="timetable-skeleton h-80 lg:h-96"></div>
    </div>
  </section>

  <!-- Weekly Schedule / Timetable Section (SDK-Powered) -->
  <section id="schedule" class="py-16 md:py-32 px-4 md:px-12 max-w-7xl mx-auto relative z-10">
    <div class="flex flex-col text-center mb-10 md:mb-16 gap-2 md:gap-4">
      <h2 class="text-xs md:text-sm font-black tracking-[0.2em] uppercase text-yellow-400">Plan Your Week</h2>
      <h3 class="text-4xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">Weekly Schedule</h3>
      <div class="w-16 md:w-24 h-1 bg-gradient-to-r from-yellow-400 to-pink-500 mx-auto rounded-full mt-2 md:mt-4"></div>
    </div>

    <!-- Calendar Container -->
    <div id="calendar-container" class="mb-10 md:mb-14 max-w-4xl mx-auto bollywood-glass rounded-[2rem] p-4 md:p-8">
      <div class="flex justify-between items-center mb-6">
        <button id="cal-prev" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onclick="window.changeMonth(-1)">&lt;</button>
        <h4 id="cal-month-year" class="text-xl md:text-2xl font-black text-white tracking-widest uppercase"></h4>
        <button id="cal-next" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" onclick="window.changeMonth(1)">&gt;</button>
      </div>
      <!-- Days Header -->
      <div class="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-[10px] md:text-sm font-bold tracking-widest text-yellow-400 uppercase">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>
      <!-- Days Grid -->
      <div id="cal-grid" class="grid grid-cols-7 gap-1 md:gap-2 text-center"></div>
    </div>
    

    <!-- Timetable cards -->
    <div id="timetable-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <div class="timetable-skeleton h-44"></div>
      <div class="timetable-skeleton h-44"></div>
      <div class="timetable-skeleton h-44"></div>
    </div>

  </section>

  <!-- Instructors / Faculty Section -->
  <section id="faculty" class="py-32 relative z-10 overflow-hidden">
    <!-- Slanted background -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#3b0b4a] to-[var(--bollywood-bg-dark)] -skew-y-3 origin-top-left z-0 border-y border-pink-500/20"></div>
    
    <div class="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
      <div class="text-center mb-20">
        <h2 class="text-sm font-black tracking-[0.2em] uppercase text-yellow-400 mb-4">Meet The Stars</h2>
        <h3 class="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-lg">Our Choreographers</h3>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {{#shop.users}}
        <div class="group relative rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-yellow-400/50 transition-colors duration-500 shadow-2xl">
          <div class="aspect-[4/5] relative w-full bg-[#2d164d]">
            {{#imageUrl}}
            <img 
              src="{{imageUrl}}" 
              alt="{{name}}" 
              class="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity group-hover:mix-blend-normal"
            />
            {{/imageUrl}}
            {{^imageUrl}}
            <img 
              src="https://images.unsplash.com/photo-1543886567-3729d1c16768?q=80&w=2574&auto=format&fit=crop" 
              alt="{{name}}" 
              class="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 mix-blend-luminosity group-hover:mix-blend-normal"
            />
            {{/imageUrl}}
            
            <!-- Vibrant Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-[#1a0b2e] via-[#1a0b2e]/60 to-transparent opacity-90 group-hover:opacity-70 transition-opacity duration-500"></div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-8 text-center translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
            <h4 class="text-3xl font-black text-white mb-2 drop-shadow-md">{{name}}</h4>
            <p class="text-yellow-400 font-black tracking-widest uppercase text-sm mb-4">{{role}}</p>
            {{#bio}}
            <p class="text-sm text-pink-100/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 line-clamp-3">
              {{bio}}
            </p>
            {{/bio}}
          </div>
        </div>
        {{/shop.users}}
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-32 relative z-10">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="text-center mb-20">
        <h2 class="text-sm font-black tracking-[0.2em] uppercase text-yellow-400 mb-4">Community Love</h2>
        <h3 class="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-lg">Student Spotlight</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
        {{#shop.reviews}}
        <div class="bollywood-glass rounded-[2.5rem] p-10 border-t border-yellow-500/20 relative group hover:-translate-y-4 transition-transform duration-500">
          <!-- Big quote mark -->
          <div class="absolute -top-8 -right-4 text-9xl font-black text-white/5 group-hover:text-pink-500/10 transition-colors z-0">"</div>
          
          <div class="flex gap-2 mb-8 relative z-10">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="text-white text-xl leading-relaxed mb-10 font-light relative z-10 italic">
            "{{comment}}"
          </p>
          <div class="flex items-center gap-5 relative z-10">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-2xl font-black text-white shadow-lg border-2 border-white/20">
              {{user.name.[0]}}
            </div>
            <div>
              <h5 class="font-black text-white text-xl">{{user.name}}</h5>
              <span class="text-sm font-bold uppercase tracking-widest text-yellow-400">Student</span>
            </div>
          </div>
        </div>
        {{/shop.reviews}}
      </div>
    </div>
  </section>

  <!-- Footer / Contact -->
  <footer class="bg-[#120522] py-24 border-t-4 border-yellow-400 relative z-10">
    <div class="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-16">
      <div class="md:col-span-5">
        <div class="flex items-center gap-4 mb-8">
          {{#shop.logoUrl}}
          <img src="{{shop.logoUrl}}" alt="{{shop.name}}" width="64" height="64" class="rounded-full border-2 border-yellow-400" />
          {{/shop.logoUrl}}
          <h2 class="text-4xl font-black tracking-tight text-white">{{shop.name}}</h2>
        </div>
        <p class="text-pink-100/70 mb-10 max-w-sm text-lg leading-relaxed">
          Bringing the magic of cinema to the dance floor. Join our vibrant family today!
        </p>
        <div class="flex gap-4">
          <a href="#" class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 hover:bg-yellow-400 hover:text-[#120522] transition-all font-black">IG</a>
          <a href="#" class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 hover:bg-yellow-400 hover:text-[#120522] transition-all font-black">FB</a>
          <a href="#" class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 hover:bg-yellow-400 hover:text-[#120522] transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
        </div>
      </div>
      
      <div class="md:col-span-3">
        <h4 class="text-2xl font-black text-white mb-8">Explore</h4>
        <ul class="space-y-5">
          <li><a href="#classes" class="text-pink-100/70 hover:text-yellow-400 font-bold uppercase tracking-wider text-sm transition-colors">Programs</a></li>
          <li><a href="#faculty" class="text-pink-100/70 hover:text-yellow-400 font-bold uppercase tracking-wider text-sm transition-colors">Faculty</a></li>
          <li><a href="#" class="text-pink-100/70 hover:text-yellow-400 font-bold uppercase tracking-wider text-sm transition-colors">Performances</a></li>
          <li><a href="#" class="text-pink-100/70 hover:text-yellow-400 font-bold uppercase tracking-wider text-sm transition-colors">Contact</a></li>
        </ul>
      </div>
      
      <div class="md:col-span-4">
        <h4 class="text-2xl font-black text-white mb-8">Visit Us</h4>
        <div class="space-y-6">
          <div class="flex items-start gap-5">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <span class="text-lg text-pink-100/90 font-light mt-2">{{address.street}}, {{address.city}}</span>
          </div>
          {{#shop.phone}}
          <div class="flex items-center gap-5">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-yellow-400 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <span class="text-lg text-pink-100/90 font-light">{{shop.phone}}</span>
          </div>
          {{/shop.phone}}
          <div class="pt-8">
            <button 
              data-action="book"
              class="bollywood-btn w-full px-8 py-5 rounded-full text-lg font-black tracking-widest flex items-center justify-center gap-3"
            >
              Book A Trial 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>
  
  <script>
    (function() {
      // In a DynamicTemplate sandbox, the SDK (kutzapp-sdk.js) is already pre-loaded
      // and KutzApp.init() is already called by the DynamicTemplate before inline scripts run.
      // We only need to inject the booking modal/widget scripts.
      var origin = window.location.origin;
      var scriptsToInject = ['booking-modal.js', 'booking-widget.js'];
      scriptsToInject.forEach(function(src) {
        var script = document.createElement('script');
        script.src = origin + '/' + src + '?v=' + Date.now();
        script.setAttribute('data-shop-id', '{{shop.id}}');
        script.async = true;
        document.body.appendChild(script);
      });

      // KutzApp is already initialized by DynamicTemplate — load classes immediately
      initClassesFromSDK();
    })();

    var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var allSchedules = [];
    
    var currentMonthOffset = 0; // 0 = current, 1 = next, 2 = +2
    var selectedDate = new Date();
    selectedDate.setHours(0,0,0,0);
    var activeDayTab = selectedDate.getDay();

    function initClassesFromSDK() {
      if (typeof KutzApp === 'undefined') {
        // Fallback: SDK not yet available, retry after a short delay
        setTimeout(initClassesFromSDK, 200);
        return;
      }
      // KutzApp.init() is already called by DynamicTemplate, but ensure it's initialized
      if (!KutzApp.shopId) {
        KutzApp.init('{{shop.id}}');
      }

      KutzApp.getClassSchedules().then(function(schedules) {
        allSchedules = schedules;
        renderClassCards(schedules);
        
        var d = new Date();
        window.selectDate(d.getFullYear(), d.getMonth(), d.getDate());
      }).catch(function(err) {
        console.warn('SDK class load failed:', err);
      });
    }

    function formatPrice(price) {
      if (!price && price !== 0) return '';
      return '$' + Number(price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function renderClassCards(schedules) {
      var container = document.getElementById('sdk-class-cards');
      if (!container) return;

      // YouTube video mapping by class name (case-insensitive partial match)
      var CLASS_VIDEOS = {
        'bollywood': 'ZN7rzjEk_SA',
        'bhangra': 'eT3s-a_De-I',
        'kathak': 'd2L1aV9tRpQ'
      };

      function getVideoId(name) {
        var lower = (name || '').toLowerCase();
        var keys = Object.keys(CLASS_VIDEOS);
        for (var i = 0; i < keys.length; i++) {
          if (lower.indexOf(keys[i]) !== -1) return CLASS_VIDEOS[keys[i]];
        }
        return null;
      }

      // Deduplicate by serviceId to show unique class types
      var seen = {};
      var unique = [];
      schedules.forEach(function(s) {
        if (!seen[s.service.id]) {
          seen[s.service.id] = true;
          unique.push(s);
        }
      });

      if (unique.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-16"><div class="text-5xl mb-4 opacity-50">\ud83c\udfb6</div><p class="text-pink-100/60 text-lg">Classes coming soon!</p></div>';
        return;
      }

      var html = '';
      unique.forEach(function(s) {
        var svc = s.service;
        var priceLabel = svc.semesterPrice ? 'Semester' : (svc.dropInPrice ? 'Drop-in' : 'Tuition');
        var priceVal = svc.semesterPrice || svc.dropInPrice || svc.price || 0;
        var videoId = getVideoId(svc.name);

        // Build the media block: YouTube iframe if video available, fallback to image
        var mediaBlock;
        if (videoId) {
          mediaBlock = '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=1&loop=1&playlist=' + videoId + '&controls=0&rel=0&modestbranding=1&playsinline=1&start=20" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style="width: 135%; height: 135%;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
        } else {
          var imgSrc = svc.imageUrl || 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=800&auto=format&fit=crop';
          mediaBlock = '<img src="' + imgSrc + '" alt="' + svc.name + '" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />';
        }

        html += '<div data-service-id="' + svc.id + '" data-booking-service-id="' + svc.id + '" class="bollywood-glass rounded-2xl lg:rounded-[2rem] p-0 bollywood-card-hover cursor-pointer group flex flex-col relative overflow-hidden h-auto">'
          + '<div class="w-full aspect-video relative bg-black shrink-0 overflow-hidden">'
          + mediaBlock
          + '<div class="absolute inset-0 bg-gradient-to-t from-[#1a0b2e] via-transparent to-transparent opacity-80"></div>'
          + '<div class="absolute bottom-2 left-2 lg:bottom-4 lg:left-6 pointer-events-none">'
          + '<div class="inline-block px-2 py-0.5 lg:px-4 lg:py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 text-[8px] lg:text-xs font-bold uppercase tracking-wider text-white shadow-lg">'
          + svc.duration + ' Min</div></div></div>'
          + '<div class="w-full p-6 lg:p-8 flex flex-col relative z-10 bg-transparent">'
          + '<h4 class="text-sm lg:text-3xl font-black text-white mb-1 lg:mb-4 group-hover:text-yellow-400 transition-colors drop-shadow-md leading-tight">' + svc.name + '</h4>'
          + '<p class="text-pink-100/80 text-[10px] lg:text-base leading-tight lg:leading-relaxed mb-2 lg:mb-6 line-clamp-2 lg:line-clamp-3">' + (svc.description || '') + '</p>'
          + '<div class="mt-auto pt-2 lg:pt-6 border-t border-white/10 flex items-center justify-between">'
          + '<div class="flex flex-col">'
          + '<span class="text-[8px] lg:text-xs font-black uppercase tracking-widest text-yellow-400/80 mb-0 lg:mb-1">' + priceLabel + '</span>'
          + '<span class="text-sm lg:text-3xl font-black text-white drop-shadow-lg">' + formatPrice(priceVal) + '</span></div>'
          + '<div class="w-7 h-7 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(255,0,127,0.4)]">'
          + '<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'
          + '</div></div></div></div>';
      });

      container.innerHTML = html;
    }

    window.changeMonth = function(dir) {
      currentMonthOffset += dir;
      if (currentMonthOffset < 0) currentMonthOffset = 0;
      if (currentMonthOffset > 2) currentMonthOffset = 2;
      renderCalendar();
    };

    window.selectDate = function(y, m, d) {
      selectedDate = new Date(y, m, d);
      selectedDate.setHours(0,0,0,0);
      renderCalendar();
      activeDayTab = selectedDate.getDay();
      

      renderTimetableForDay(activeDayTab);
    };

    function renderCalendar() {
      var grid = document.getElementById('cal-grid');
      var monthLabel = document.getElementById('cal-month-year');
      var prevBtn = document.getElementById('cal-prev');
      var nextBtn = document.getElementById('cal-next');
      if (!grid) return;

      var daysWithClasses = {};
      allSchedules.forEach(function(s) { daysWithClasses[s.dayOfWeek] = true; });

      var targetDate = new Date();
      targetDate.setDate(1); // Set to 1st to avoid overflow issues
      targetDate.setMonth(targetDate.getMonth() + currentMonthOffset);
      
      var year = targetDate.getFullYear();
      var month = targetDate.getMonth();
      
      var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      monthLabel.innerText = monthNames[month] + ' ' + year;

      prevBtn.style.opacity = currentMonthOffset === 0 ? '0.3' : '1';
      prevBtn.style.pointerEvents = currentMonthOffset === 0 ? 'none' : 'auto';
      nextBtn.style.opacity = currentMonthOffset === 2 ? '0.3' : '1';
      nextBtn.style.pointerEvents = currentMonthOffset === 2 ? 'none' : 'auto';

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();

      var html = '';
      for (var i = 0; i < firstDay; i++) {
        html += '<div></div>';
      }

      var today = new Date();
      today.setHours(0,0,0,0);

      for (var d = 1; d <= daysInMonth; d++) {
        var cellDate = new Date(year, month, d);
        cellDate.setHours(0,0,0,0);
        var dayOfWeek = cellDate.getDay();
        var daySchedulesForCell = allSchedules.filter(function(s) { return s.dayOfWeek === dayOfWeek; });
        var hasClasses = daySchedulesForCell.length > 0;
        var isPast = cellDate < today;
        var isSelected = cellDate.getTime() === selectedDate.getTime();
        
        var baseClasses = "relative w-full flex flex-col rounded-lg md:rounded-xl transition-all duration-300 p-1 md:p-2 ";
        
        if (!isPast) {
          baseClasses += "group ";
        }
        
        if (hasClasses) {
          baseClasses += "min-h-[90px] md:min-h-[130px] justify-start items-start ";
        } else {
          baseClasses += "aspect-square justify-center items-center text-sm md:text-lg font-bold overflow-hidden ";
        }

        if (isSelected) {
          baseClasses += "bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg z-20 hover:z-[200] border border-white ";
        } else if (!isPast) {
          if (hasClasses) {
            baseClasses += "bg-white/10 hover:bg-white/20 text-white cursor-pointer z-10 hover:z-[200] border border-pink-500/30 hover:border-pink-500 ";
          } else {
            baseClasses += "bg-white/5 hover:bg-white/10 text-white cursor-pointer hover:scale-105 ";
          }
        } else {
          baseClasses += "bg-black/20 text-white/30 cursor-not-allowed overflow-hidden ";
        }

        var clickAttr = (isPast) ? '' : 'onclick="window.selectDate(' + year + ',' + month + ',' + d + ')"';

        html += '<div class="' + baseClasses + '" ' + clickAttr + '>';
        
        if (hasClasses) {
          // Standard View (visible normally)
          html += '<div class="w-full h-full flex flex-col overflow-hidden group-hover:opacity-0 transition-opacity duration-300">';
          html += '<span class="text-sm md:text-lg font-black mb-1 mx-auto">' + d + '</span>';
          html += '<div class="flex flex-col gap-1 w-full mt-1">';
          daySchedulesForCell.slice(0, 3).forEach(function(s) {
            var timeStr = s.startTime.substring(0, 5); // Format: 09:00
            
            // Adjust colors if selected so it's readable on the yellow/orange gradient
            var titleColor = isSelected ? 'text-black' : 'text-pink-200';
            var timeColor = isSelected ? 'text-black/80' : 'text-white/80';
            var bgColor = isSelected ? 'bg-white/30' : 'bg-black/30';
            var borderColor = isSelected ? 'border-black' : 'border-yellow-400';
            
            html += '<div class="text-[9px] md:text-xs ' + bgColor + ' rounded px-1 py-0.5 truncate text-left border-l-2 ' + borderColor + ' leading-tight">';
            html += '<div class="font-bold ' + titleColor + ' truncate" title="' + s.service.name + '">' + s.service.name + '</div>';
            html += '<div class="' + timeColor + '">' + timeStr + '</div>';
            html += '</div>';
          });
          if (daySchedulesForCell.length > 3) {
            html += '<div class="text-[10px] ' + (isSelected ? 'text-black' : 'text-yellow-400') + ' font-bold mt-1 text-center">+' + (daySchedulesForCell.length - 3) + ' more</div>';
          }
          html += '</div>';
          html += '</div>'; // End Standard View
          
          // Hover Popover View (Enlarged, Dynamic Details)
          html += '<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-2xl text-white shadow-[0_0_50px_rgba(255,0,127,1)] border border-pink-500/50 z-[100] p-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 ease-out scale-75 group-hover:scale-100 flex flex-col gap-2 overflow-y-auto scrollbar-hide cursor-default" style="width: 16rem; height: 16rem; background-color: #000000;">';
          html += '<span class="text-xl md:text-2xl font-black mb-2 text-center text-yellow-400 border-b border-pink-500/30 pb-2 shrink-0">' + monthNames[month] + ' ' + d + '</span>';
          daySchedulesForCell.forEach(function(s) {
            var timeStr = s.startTime.substring(0, 5);
            var endTimeStr = s.endTime.substring(0, 5);
            html += '<div class="text-xs md:text-sm bg-gray-900 p-2 text-left border-l-4 border-yellow-400 leading-tight w-full shrink-0" style="background-color: #111827;">';
            html += '<div class="font-black text-white mb-1 leading-snug whitespace-normal">' + s.service.name + '</div>';
            html += '<div class="text-white/80 font-medium flex justify-between items-center"><span class="flex items-center gap-1"><svg class="w-3 h-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' + timeStr + ' - ' + endTimeStr + '</span><span class="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-sm font-bold">' + s.service.duration + 'm</span></div>';
            html += '</div>';
          });
          html += '</div>'; // End Hover Popover View
          
        } else {
          html += '<span>' + d + '</span>';
        }
        html += '</div>';
      }
      grid.innerHTML = html;
    }

    function renderTimetableForDay(day) {
      var grid = document.getElementById('timetable-grid');
      if (!grid) return;

      var daySchedules = allSchedules.filter(function(s) { return s.dayOfWeek === day; });

      if (daySchedules.length === 0) {
        grid.innerHTML = '';
        return;
      }

      var html = '';
      daySchedules.forEach(function(s) {
        var svc = s.service;
        var maxCap = svc.maxCapacity || 999;
        var spotsText = s.availableSpots > 0 ? (s.availableSpots + ' spots left') : 'Full';
        var spotsColor = s.availableSpots > 3 ? 'text-emerald-400' : (s.availableSpots > 0 ? 'text-yellow-400' : 'text-red-400');
        var staffImg = s.staff.imageUrl
          ? '<img src="' + s.staff.imageUrl + '" class="w-10 h-10 rounded-full object-cover border-2 border-yellow-400/40" alt="' + s.staff.name + '" />'
          : '<div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-sm font-black text-white border-2 border-yellow-400/40">' + (s.staff.name ? s.staff.name[0] : '?') + '</div>';

        html += '<div class="timetable-card cursor-pointer" data-booking-service-id="' + svc.id + '">'
          + '<div class="flex items-start gap-4">'
          + staffImg
          + '<div class="flex-1 min-w-0">'
          + '<h4 class="text-lg font-black text-white truncate">' + svc.name + '</h4>'
          + '<p class="text-sm text-pink-100/60">' + s.staff.name + '</p>'
          + '</div>'
          + '<div class="text-right shrink-0">'
          + '<div class="text-lg font-black text-white">' + s.startTime + '</div>'
          + '<div class="text-xs text-pink-100/50">' + s.startTime + ' – ' + s.endTime + '</div>'
          + '</div></div>'
          + '<div class="flex items-center justify-between mt-4 pt-4 border-t border-white/10">'
          + '<div class="flex items-center gap-3">'
          + '<span class="text-xs font-bold uppercase tracking-wider text-pink-100/50">' + svc.duration + ' min</span>'
          + (s.term ? '<span class="text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">' + s.term.name + '</span>' : '')
          + '</div>'
          + '<div class="flex items-center gap-2">'
          + '<span class="text-xs font-bold ' + spotsColor + '">' + spotsText + '</span>'
          + (svc.dropInPrice ? '<span class="text-xs font-black text-white ml-2">' + formatPrice(svc.dropInPrice) + '</span>' : '')
          + '</div></div></div>';
      });

      grid.innerHTML = html;
    }

    // Event delegation for booking clicks on dynamically rendered class cards
    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document) {
        var serviceId = target.getAttribute && target.getAttribute('data-booking-service-id');
        if (serviceId) {
          if (typeof BarberBooking !== 'undefined') {
            BarberBooking.open(serviceId);
          }
          return;
        }
        target = target.parentElement;
      }
    });
  </script>
  <script>
    // Force scroll to top on page refresh
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  </script>

  <!-- Floating Home Button -->
  <a href="#top" class="hover:-translate-y-2 transition-transform duration-300 group" style="position: fixed; bottom: 8rem; right: 2rem; z-index: 9999; display: block;">
    <svg xmlns="http://www.w3.org/2000/svg" style="width: 3.5rem; height: 3.5rem; stroke: var(--bollywood-magenta); filter: drop-shadow(0 0 15px rgba(255,0,127,0.8));" fill="none" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 15l7-7 7 7" />
    </svg>
  </a>
  
</div>
`;

async function main() {
  console.log('Injecting Custom HTML for Rhythm & Motion Dance Studio...');

  const shopName = 'Rhythm & Motion Dance Studio';
  let shop = await prisma.shop.findFirst({
    where: { name: shopName }
  });

  if (!shop) {
    console.log('Shop not found.');
    return;
  }

  const customization = typeof shop.customization === 'object' && shop.customization !== null 
    ? { ...(shop.customization as any), customHtml: customHtml }
    : { customHtml: customHtml };

  await prisma.shop.update({
    where: { id: shop.id },
    data: { customization }
  });

  console.log('Successfully injected Custom HTML!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
