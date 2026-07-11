import { prisma } from '../lib/prisma';

const customHtml = `
<style>
  :root {
    --studio-primary: {{primaryColor}};
    --studio-secondary: {{secondaryColor}};
  }
  .studio-gradient-text {
    background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .studio-glass {
    background: rgba(25, 25, 25, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .studio-card-hover {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .studio-card-hover:hover {
    transform: translateY(-5px);
    background: rgba(35, 35, 35, 0.8);
    border-color: var(--studio-primary);
    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
  }
</style>

<div class="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-white/20">

  <!-- Header / Nav -->
  <header class="fixed top-0 left-0 right-0 z-50 p-4 md:px-12 flex justify-between items-center studio-glass border-b border-white/5 transition-all">
    <div class="flex items-center gap-3">
      {{#shop.logoUrl}}
      <img src="{{shop.logoUrl}}" alt="{{shop.name}}" width="48" height="48" class="rounded-xl" />
      {{/shop.logoUrl}}
      <h1 class="text-2xl font-black tracking-tight text-white hidden sm:block">{{shop.name}}</h1>
    </div>
    <div class="flex items-center gap-6">
      <div class="hidden lg:flex items-center gap-4 text-neutral-400">
        <a href="#classes" class="text-sm font-medium hover:text-white transition-colors">Programs</a>
        <a href="#faculty" class="text-sm font-medium hover:text-white transition-colors">Faculty</a>
        <a href="#testimonials" class="text-sm font-medium hover:text-white transition-colors">Testimonials</a>
      </div>
      <button 
        onclick="if(window.BarberBooking) window.BarberBooking.open()"
        style="background-color: {{primaryColor}}"
        class="px-6 py-2.5 rounded-full text-white text-sm font-bold shadow-[0_0_20px_rgba(var(--studio-primary),0.3)] hover:scale-105 transition-transform"
      >
        Client Portal
      </button>
    </div>
  </header>

  <!-- Hero Section -->
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
    <div class="absolute inset-0 z-0">
      {{#shop.heroImageUrl}}
      <img 
        src="{{shop.heroImageUrl}}" 
        alt="Studio" 
        class="object-cover w-full h-full opacity-60 scale-105 animate-[pulse_20s_ease-in-out_infinite]"
      />
      {{/shop.heroImageUrl}}
      {{^shop.heroImageUrl}}
      <div class="absolute inset-0 bg-neutral-900"></div>
      {{/shop.heroImageUrl}}
      <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-neutral-950 via-transparent to-neutral-950 opacity-80"></div>
    </div>

    <!-- Hero Content -->
    <div class="relative z-10 text-center max-w-5xl px-6">
      <h2 class="text-5xl md:text-8xl font-black tracking-tighter mb-6 studio-gradient-text leading-tight drop-shadow-2xl">
        {{#heroTitle}}{{heroTitle}}{{/heroTitle}}{{^heroTitle}}Discover the Dancer in You.{{/heroTitle}}
      </h2>
      <p class="text-lg md:text-2xl text-neutral-200 mb-10 max-w-3xl mx-auto font-light drop-shadow-md">
        {{#shop.description}}{{shop.description}}{{/shop.description}}{{^shop.description}}Join our studio and experience world-class training in a supportive community environment.{{/shop.description}}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button 
          onclick="if(window.BarberBooking) window.BarberBooking.open()"
          style="background-color: {{primaryColor}}"
          class="w-full sm:w-auto px-10 py-5 rounded-full text-white text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(var(--studio-primary),0.4)]"
        >
          View Schedule & Register 
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        <a 
          href="#classes"
          class="w-full sm:w-auto px-10 py-5 rounded-full text-white text-lg font-bold studio-glass hover:bg-white/10 transition-colors border border-white/20 flex items-center justify-center"
        >
          Explore Programs
        </a>
      </div>
      
      <!-- Social Icons Hero -->
      <div class="mt-16 flex items-center justify-center gap-6">
        <a href="#" class="w-12 h-12 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm">IG</a>
        <a href="#" class="w-12 h-12 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm">FB</a>
        <a href="#" class="w-12 h-12 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm">YT</a>
      </div>
    </div>
  </div>

  <!-- Features / Why Us -->
  <section class="py-24 border-b border-white/5 bg-neutral-900/30 relative z-10">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
        <div class="flex flex-col items-center group">
          <div class="w-20 h-20 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform" style="color: {{primaryColor}}">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-3">Expert Faculty</h3>
          <p class="text-neutral-400 text-lg leading-relaxed">Train with industry professionals who are passionate about nurturing talent.</p>
        </div>
        <div class="flex flex-col items-center group">
          <div class="w-20 h-20 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform" style="color: {{primaryColor}}">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-3">Flexible Schedules</h3>
          <p class="text-neutral-400 text-lg leading-relaxed">Multiple class times per week to fit your busy family schedule.</p>
        </div>
        <div class="flex flex-col items-center group">
          <div class="w-20 h-20 rounded-2xl studio-glass flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform" style="color: {{primaryColor}}">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-3">Premium Studios</h3>
          <p class="text-neutral-400 text-lg leading-relaxed">State-of-the-art flooring, mirrors, and sound systems for the best experience.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Classes / Programs Section -->
  <section id="classes" class="py-32 px-6 md:px-12 max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
      <div>
        <h2 class="text-sm font-bold tracking-widest uppercase mb-3" style="color: {{primaryColor}}">Our Curriculum</h2>
        <h3 class="text-4xl md:text-6xl font-black tracking-tight text-white">Programs & Classes</h3>
      </div>
      <button 
        onclick="if(window.BarberBooking) window.BarberBooking.open()"
        class="text-neutral-400 hover:text-white transition-colors flex items-center gap-2 font-medium text-lg border-b border-transparent hover:border-white pb-1"
      >
        See Full Schedule 
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {{#shop.services}}
      <div 
        onclick="if(window.BarberBooking) window.BarberBooking.open('{{id}}')"
        class="studio-glass rounded-3xl p-8 studio-card-hover cursor-pointer group flex flex-col h-full relative overflow-hidden border border-white/10"
      >
        <!-- Decorative accent -->
        <div 
          class="absolute top-0 right-0 w-48 h-48 opacity-10 group-hover:opacity-30 transition-opacity blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"
          style="background-color: {{primaryColor}}"
        ></div>

        <div class="flex-1 relative z-10">
          <h4 class="text-3xl font-bold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 transition-all">
            {{name}}
          </h4>
          {{#description}}
          <p class="text-neutral-400 text-base leading-relaxed mb-8 line-clamp-4">
            {{description}}
          </p>
          {{/description}}
          
          <div class="flex flex-wrap items-center gap-3 text-sm text-neutral-300 font-medium">
            <div class="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{duration}} min
            </div>
            {{#maxCapacity}}
            <div class="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Max {{maxCapacity}}
            </div>
            {{/maxCapacity}}
          </div>
        </div>

        <div class="mt-10 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
          <div class="flex flex-col">
            {{#semesterPrice}}
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Semester Tuition</span>
            <span class="text-2xl font-black text-white">\\$\{{semesterPrice}}</span>
            {{/semesterPrice}}
            {{^semesterPrice}}
            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Drop-in Rate</span>
            <span class="text-2xl font-black text-white">\\$\{{price}}</span>
            {{/semesterPrice}}
          </div>
          <div class="w-12 h-12 rounded-full studio-glass flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </div>
      </div>
      {{/shop.services}}
    </div>
  </section>

  <!-- Instructors / Faculty Section -->
  <section id="faculty" class="py-32 border-t border-b border-white/5 bg-neutral-900/50">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="text-center mb-16">
        <h2 class="text-sm font-bold tracking-widest uppercase mb-3" style="color: {{primaryColor}}">Meet the Team</h2>
        <h3 class="text-4xl md:text-6xl font-black tracking-tight text-white">Our Faculty</h3>
      </div>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {{#shop.users}}
        <div class="group relative rounded-3xl overflow-hidden studio-glass border border-white/5">
          <div class="aspect-[3/4] relative w-full bg-neutral-800">
            {{#imageUrl}}
            <img 
              src="{{imageUrl}}" 
              alt="{{name}}" 
              class="absolute inset-0 object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
            />
            {{/imageUrl}}
            {{^imageUrl}}
            <div class="absolute inset-0 flex items-center justify-center text-neutral-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            {{/imageUrl}}
            <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-80"></div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 p-6">
            <h4 class="text-2xl font-bold text-white mb-1">{{name}}</h4>
            <p class="text-neutral-300 font-medium" style="color: {{primaryColor}}">{{role}}</p>
            {{#bio}}
            <p class="text-sm text-neutral-400 mt-3 line-clamp-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
              {{bio}}
            </p>
            {{/bio}}
          </div>
        </div>
        {{/shop.users}}
      </div>
    </div>
  </section>

  <!-- Additional Services / Studio Rental -->
  <section class="py-24 px-6 md:px-12 max-w-7xl mx-auto relative">
    <div class="studio-glass rounded-[3rem] p-12 border border-white/10 relative overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-gradient-to-br from-neutral-900 to-neutral-950 opacity-90"></div>
        <div 
          class="absolute -top-40 -right-40 w-96 h-96 opacity-20 blur-[100px] rounded-full"
          style="background-color: {{primaryColor}}"
        ></div>
      </div>
      
      <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        <div class="max-w-2xl">
          <h3 class="text-4xl md:text-5xl font-black text-white mb-6">More Than Just Classes</h3>
          <p class="text-xl text-neutral-300 mb-8 leading-relaxed">
            Looking for rehearsal space, private event choreography, or the perfect gift for a dancer? We offer studio rentals and gift cards to support our vibrant community.
          </p>
          <div class="flex flex-wrap gap-4">
            <button class="px-8 py-3 rounded-full text-white font-bold bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
              Studio Rental
            </button>
            <button class="px-8 py-3 rounded-full text-white font-bold bg-white/10 hover:bg-white/20 transition-colors border border-white/20">
              Buy Gift Card
            </button>
          </div>
        </div>
        
        <div class="flex-shrink-0 grid grid-cols-2 gap-4">
           <div class="w-32 h-32 rounded-2xl studio-glass flex items-center justify-center flex-col gap-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
             <span class="text-sm font-bold text-white">Weddings</span>
           </div>
           <div class="w-32 h-32 rounded-2xl studio-glass flex items-center justify-center flex-col gap-3 translate-y-8">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <span class="text-sm font-bold text-white">Events</span>
           </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials -->
  <section id="testimonials" class="py-32 border-t border-white/5">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="text-center mb-16">
        <h2 class="text-sm font-bold tracking-widest uppercase mb-3" style="color: {{primaryColor}}">Community</h2>
        <h3 class="text-4xl md:text-6xl font-black tracking-tight text-white">What Dancers Say</h3>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {{#shop.reviews}}
        <div class="studio-glass rounded-3xl p-8 border border-white/5 relative">
          <div class="flex gap-1 mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <p class="text-neutral-300 text-lg leading-relaxed mb-8">
            "{{content}}"
          </p>
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold" style="color: {{primaryColor}}">
              👤
            </div>
            <div>
              <h5 class="font-bold text-white">{{authorName}}</h5>
              <span class="text-sm text-neutral-500">Student</span>
            </div>
          </div>
        </div>
        {{/shop.reviews}}
      </div>
    </div>
  </section>

  <!-- Footer / Contact -->
  <footer class="bg-neutral-950 py-20 border-t border-white/10 relative overflow-hidden">
    <div 
      class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10 blur-[120px] rounded-[100%]"
      style="background-color: {{primaryColor}}"
    ></div>
    
    <div class="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
      <div class="md:col-span-5">
        <div class="flex items-center gap-3 mb-6">
          {{#shop.logoUrl}}
          <img src="{{shop.logoUrl}}" alt="{{shop.name}}" width="48" height="48" class="rounded-xl" />
          {{/shop.logoUrl}}
          <h2 class="text-3xl font-black tracking-tight text-white">{{shop.name}}</h2>
        </div>
        <p class="text-neutral-400 mb-8 max-w-sm text-lg leading-relaxed">
          Inspiring the next generation of artists. Join our family today and discover your true potential.
        </p>
        <div class="flex gap-4">
          <a href="#" class="w-10 h-10 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-xs font-bold">IG</a>
          <a href="#" class="w-10 h-10 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white transition-colors text-xs font-bold">FB</a>
          <a href="#" class="w-10 h-10 rounded-full studio-glass flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </a>
        </div>
      </div>
      
      <div class="md:col-span-3">
        <h4 class="text-lg font-bold text-white mb-6">Explore</h4>
        <ul class="space-y-4">
          <li><a href="#classes" class="text-neutral-400 hover:text-white transition-colors">Programs & Classes</a></li>
          <li><a href="#faculty" class="text-neutral-400 hover:text-white transition-colors">Faculty</a></li>
          <li><a href="#" class="text-neutral-400 hover:text-white transition-colors">Studio Rental</a></li>
          <li><a href="#" class="text-neutral-400 hover:text-white transition-colors">Class Policies</a></li>
          <li><a href="#" class="text-neutral-400 hover:text-white transition-colors">FAQ</a></li>
        </ul>
      </div>
      
      <div class="md:col-span-4">
        <h4 class="text-lg font-bold text-white mb-6">Contact Us</h4>
        <div class="space-y-6">
          <div class="flex items-start gap-4 text-neutral-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-1" style="color: {{primaryColor}}"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span class="text-lg">{{address.street}}, {{address.city}}</span>
          </div>
          {{#shop.phone}}
          <div class="flex items-center gap-4 text-neutral-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: {{primaryColor}}"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span class="text-lg">{{shop.phone}}</span>
          </div>
          {{/shop.phone}}
          <div class="pt-6">
            <button 
              onclick="if(window.BarberBooking) window.BarberBooking.open()"
              style="background-color: {{primaryColor}}"
              class="w-full px-8 py-4 rounded-full text-white text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg"
            >
              Register Now 
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="max-w-7xl mx-auto px-6 md:px-12 mt-20 pt-8 border-t border-white/10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4 text-neutral-500 text-sm">
      <p>© 2026 {{shop.name}}. All rights reserved.</p>
      <div class="flex gap-6">
        <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
        <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
      </div>
    </div>
  </footer>
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
