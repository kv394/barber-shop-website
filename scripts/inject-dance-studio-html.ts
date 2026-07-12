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
    background: linear-gradient(90deg, var(--bollywood-orange), var(--bollywood-magenta));
    border: none;
    position: relative;
    overflow: hidden;
    z-index: 1;
    color: white;
    box-shadow: 0 10px 20px -5px rgba(255, 0, 127, 0.5);
    transition: all 0.3s ease;
  }
  .bollywood-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: all 0.5s ease;
    z-index: -1;
  }
  .bollywood-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 25px -5px rgba(255, 0, 127, 0.7);
  }
  .bollywood-btn:hover::before {
    left: 100%;
  }
</style>

<div class="min-h-screen text-neutral-100 font-sans selection:bg-pink-500/30 overflow-hidden relative" style="background-color: var(--bollywood-bg-dark)">
  
  <!-- Animated Background Orbs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div class="orb-1"></div>
    <div class="orb-2"></div>
    <div class="orb-3"></div>
  </div>

  <!-- Floating Header / Nav -->
  <header class="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-[100] px-4 md:px-8 py-3 flex justify-between items-center bg-[#120522]/70 backdrop-blur-2xl border border-pink-500/30 rounded-full shadow-[0_15px_40px_rgba(0,0,0,0.8)] transition-all">
    <!-- Left: Logo & Name (flex-1 forces center alignment for nav) -->
    <div class="flex-1 flex items-center gap-3 md:gap-4">
      {{#shop.logoUrl}}
      <img src="{{shop.logoUrl}}" alt="{{shop.name}}" class="w-10 h-10 md:w-12 md:h-12 rounded-full border border-yellow-400/50 shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-110 transition-transform duration-300 object-cover" />
      {{/shop.logoUrl}}
      <h1 class="text-sm md:text-xl font-black tracking-tighter text-white drop-shadow-md hidden sm:block whitespace-nowrap">{{shop.name}}</h1>
    </div>
    
    <!-- Center: Nav Links -->
    <nav class="hidden lg:flex items-center justify-center gap-10 text-pink-100 shrink-0">
      <a href="#classes" class="relative text-xs font-black uppercase tracking-[0.2em] hover:text-yellow-400 transition-colors group">
        Programs
        <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
      </a>
      <a href="#faculty" class="relative text-xs font-black uppercase tracking-[0.2em] hover:text-yellow-400 transition-colors group">
        Faculty
        <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
      </a>
      <a href="#testimonials" class="relative text-xs font-black uppercase tracking-[0.2em] hover:text-yellow-400 transition-colors group">
        Community
        <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></span>
      </a>
    </nav>
    
    <!-- Right: CTA (flex-1 forces center alignment for nav) -->
    <div class="flex-1 flex justify-end items-center">
      <button data-action="book" class="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-black font-black uppercase tracking-widest text-[10px] md:text-xs px-5 md:px-8 py-2.5 md:py-3 rounded-full shadow-[0_0_20px_rgba(255,165,0,0.5)] hover:shadow-[0_0_30px_rgba(255,0,127,0.7)] hover:scale-105 transition-all duration-300 shrink-0">
        Register
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <div class="relative min-h-screen flex items-center justify-center pt-32 z-10">
    <div class="absolute inset-0 z-0 rounded-b-[4rem] overflow-hidden">
      <!-- Video Background -->
      <div class="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <iframe 
          src="https://www.youtube.com/embed/BCaSpo2zZE4?autoplay=1&mute=1&loop=1&playlist=BCaSpo2zZE4&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1" 
          class="youtube-bg opacity-40 mix-blend-luminosity" 
          frameborder="0" 
          allow="autoplay; encrypted-media" 
          allowfullscreen>
        </iframe>
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
          <div class="w-28 h-28 rounded-full border-4 border-yellow-400/50 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,165,0,0.5)] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=2500&auto=format&fit=crop" class="w-full h-full object-cover" alt="Expert Choreography" />
          </div>
          <h3 class="text-2xl font-black text-white mb-4 uppercase tracking-wider">Expert Choreography</h3>
          <p class="text-pink-100/80 text-lg leading-relaxed">Learn authentic moves from industry professionals who bring movie magic to life.</p>
        </div>
        <div class="flex flex-col items-center group bollywood-glass p-10 rounded-[2.5rem] bollywood-card-hover border-t border-yellow-500/20 translate-y-0 md:-translate-y-8">
          <div class="w-28 h-28 rounded-full border-4 border-pink-500/50 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,0,127,0.5)] group-hover:-rotate-6 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=2574&auto=format&fit=crop" class="w-full h-full object-cover" alt="All Ages & Levels" />
          </div>
          <h3 class="text-2xl font-black text-white mb-4 uppercase tracking-wider">All Ages & Levels</h3>
          <p class="text-pink-100/80 text-lg leading-relaxed">From kids to adults, beginners to advanced performers, everyone is welcome.</p>
        </div>
        <div class="flex flex-col items-center group bollywood-glass p-10 rounded-[2.5rem] bollywood-card-hover border-t border-yellow-500/20">
          <div class="w-28 h-28 rounded-full border-4 border-teal-500/50 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.5)] group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2574&auto=format&fit=crop" class="w-full h-full object-cover" alt="Vibrant Community" />
          </div>
          <h3 class="text-2xl font-black text-white mb-4 uppercase tracking-wider">Vibrant Community</h3>
          <p class="text-pink-100/80 text-lg leading-relaxed">Join our festive performances, showcases, and celebrate the culture together.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Classes / Programs Section -->
  <section id="classes" class="py-16 md:py-32 px-4 md:px-12 max-w-7xl mx-auto relative z-10">
    <div class="flex flex-col text-center mb-10 md:mb-20 gap-2 md:gap-4">
      <h2 class="text-xs md:text-sm font-black tracking-[0.2em] uppercase text-yellow-400">Our Curriculum</h2>
      <h3 class="text-4xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">Classes & Pricing</h3>
      <div class="w-16 md:w-24 h-1 bg-gradient-to-r from-yellow-400 to-pink-500 mx-auto rounded-full mt-2 md:mt-4"></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-10">
      <!-- Advanced Choreography -->
      <div data-service-id="cmrh0fmyd0006neosdr91rc1q" class="bollywood-glass rounded-2xl lg:rounded-[2rem] p-0 bollywood-card-hover cursor-pointer group flex flex-col relative overflow-hidden h-auto">
        <div class="w-full aspect-video relative bg-black shrink-0 overflow-hidden">
          <!-- Video Player: Scaled up to hide top/bottom controls, disabled interaction -->
          <iframe 
            src="https://www.youtube.com/embed/8t_8QbsL-64?autoplay=1&mute=1&loop=1&playlist=8t_8QbsL-64&controls=0&rel=0&modestbranding=1&playsinline=1" 
            class="absolute w-[135%] h-[135%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            frameborder="0" 
            allow="autoplay; encrypted-media" 
            allowfullscreen>
          </iframe>
          <div class="absolute bottom-2 left-2 lg:bottom-4 lg:left-6 pointer-events-none">
            <div class="inline-block px-2 py-0.5 lg:px-4 lg:py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 text-[8px] lg:text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              90 Min
            </div>
          </div>
        </div>
        <div class="w-full p-6 lg:p-8 flex flex-col relative z-10 bg-transparent">
          <h4 class="text-sm lg:text-3xl font-black text-white mb-1 lg:mb-4 group-hover:text-yellow-400 transition-colors drop-shadow-md leading-tight">Advanced Choreography</h4>
          <p class="text-pink-100/80 text-[10px] lg:text-base leading-tight lg:leading-relaxed mb-2 lg:mb-6 line-clamp-2 lg:line-clamp-3">
            Master complex routines and elevate your performance skills with industry-leading choreographers. Perfect for experienced dancers looking to push their boundaries.
          </p>
          <div class="mt-auto pt-2 lg:pt-6 border-t border-white/10 flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[8px] lg:text-xs font-black uppercase tracking-widest text-yellow-400/80 mb-0 lg:mb-1">Tuition</span>
              <span class="text-sm lg:text-3xl font-black text-white drop-shadow-lg">$450</span>
            </div>
            <div class="w-7 h-7 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(255,0,127,0.4)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Beginner Ballet -->
      <div data-service-id="cmrh0fmxw0004neosd545vrtz" class="bollywood-glass rounded-2xl lg:rounded-[2rem] p-0 bollywood-card-hover cursor-pointer group flex flex-col relative overflow-hidden h-auto">
        <div class="w-full aspect-video relative bg-black shrink-0 overflow-hidden">
          <!-- Video Player: Scaled up to hide top/bottom controls, disabled interaction -->
          <iframe 
            src="https://www.youtube.com/embed/6Fz27G6WwWw?autoplay=1&mute=1&loop=1&playlist=6Fz27G6WwWw&controls=0&rel=0&modestbranding=1&playsinline=1" 
            class="absolute w-[135%] h-[135%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            frameborder="0" 
            allow="autoplay; encrypted-media" 
            allowfullscreen>
          </iframe>
          <div class="absolute bottom-2 left-2 lg:bottom-4 lg:left-6 pointer-events-none">
            <div class="inline-block px-2 py-0.5 lg:px-4 lg:py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 text-[8px] lg:text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              60 Min
            </div>
          </div>
        </div>
        <div class="w-full p-6 lg:p-8 flex flex-col relative z-10 bg-transparent">
          <h4 class="text-sm lg:text-3xl font-black text-white mb-1 lg:mb-4 group-hover:text-yellow-400 transition-colors drop-shadow-md leading-tight">Beginner Ballet</h4>
          <p class="text-pink-100/80 text-[10px] lg:text-base leading-tight lg:leading-relaxed mb-2 lg:mb-6 line-clamp-2 lg:line-clamp-3">
            Build a strong foundation in classical ballet techniques. Focus on posture, grace, and fundamental movements in a supportive environment.
          </p>
          <div class="mt-auto pt-2 lg:pt-6 border-t border-white/10 flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[8px] lg:text-xs font-black uppercase tracking-widest text-yellow-400/80 mb-0 lg:mb-1">Drop-in</span>
              <span class="text-sm lg:text-3xl font-black text-white drop-shadow-lg">$35</span>
            </div>
            <div class="w-7 h-7 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(255,0,127,0.4)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Bhangra Fitness -->
      <div data-service-id="cmrh0fmw00005neosp4505cxr" class="bollywood-glass rounded-2xl lg:rounded-[2rem] p-0 bollywood-card-hover cursor-pointer group flex flex-col relative overflow-hidden h-auto">
        <div class="w-full aspect-video relative bg-black shrink-0 overflow-hidden">
          <!-- Video Player: Scaled up to hide top/bottom controls, disabled interaction -->
          <iframe 
            src="https://www.youtube.com/embed/2iFSDqsAICI?autoplay=1&mute=1&loop=1&playlist=2iFSDqsAICI&controls=0&rel=0&modestbranding=1&playsinline=1" 
            class="absolute w-[135%] h-[135%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            frameborder="0" 
            allow="autoplay; encrypted-media" 
            allowfullscreen>
          </iframe>
          <div class="absolute bottom-2 left-2 lg:bottom-4 lg:left-6 pointer-events-none">
            <div class="inline-block px-2 py-0.5 lg:px-4 lg:py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 text-[8px] lg:text-xs font-bold uppercase tracking-wider text-white shadow-lg">
              45 Min
            </div>
          </div>
        </div>
        <div class="w-full p-6 lg:p-8 flex flex-col relative z-10 bg-transparent">
          <h4 class="text-sm lg:text-3xl font-black text-white mb-1 lg:mb-4 group-hover:text-yellow-400 transition-colors drop-shadow-md leading-tight">Bhangra Fitness</h4>
          <p class="text-pink-100/80 text-[10px] lg:text-base leading-tight lg:leading-relaxed mb-2 lg:mb-6 line-clamp-2 lg:line-clamp-3">
            A high-energy, cardio-intensive workout set to infectious Punjabi beats. Get fit while learning traditional and modern Bhangra steps!
          </p>
          <div class="mt-auto pt-2 lg:pt-6 border-t border-white/10 flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-[8px] lg:text-xs font-black uppercase tracking-widest text-yellow-400/80 mb-0 lg:mb-1">Drop-in</span>
              <span class="text-sm lg:text-3xl font-black text-white drop-shadow-lg">$25</span>
            </div>
            <div class="w-7 h-7 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(255,0,127,0.4)]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </div>
          </div>
        </div>
      </div>
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
      // In a DynamicTemplate sandbox, script.src relative paths may fail, so use window.location.origin
      var origin = window.location.origin;
      var scriptsToInject = ['booking-modal.js', 'booking-widget.js'];
      scriptsToInject.forEach(function(src) {
        var script = document.createElement('script');
        script.src = origin + '/' + src + '?v=' + Date.now();
        script.setAttribute('data-shop-id', '{{shop.id}}');
        script.async = true;
        document.body.appendChild(script);
      });
    })();
  </script>
  <script>
    // Force scroll to top on page refresh
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  </script>
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
