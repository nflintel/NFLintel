export const TEMPLATES = [
  {
    id: 'hero-elite',
    name: 'Elite Hero',
    description: 'Responsive hero with background image and CTA',
    html: `<section class="relative h-screen flex items-center justify-center overflow-hidden">
  <!-- Background Image with Overlay -->
  <div class="absolute inset-0 z-0">
    <img 
      src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80" 
      alt="Hero Background" 
      class="w-full h-full object-cover"
      referrerpolicy="no-referrer"
    />
    <div class="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
  </div>

  <!-- Content -->
  <div class="relative z-10 container mx-auto px-6 text-center">
    <h1 class="nike-text text-5xl md:text-8xl text-white mb-6 tracking-tighter leading-none">
      DESIGN THE <span class="text-accent">FUTURE.</span>
    </h1>
    <p class="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
      Experience the next generation of web development with our elite AI-powered design suite. Precision, speed, and absolute style.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button class="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all shadow-2xl">
        Get Started
      </button>
      <button class="px-10 py-4 bg-transparent border border-white/30 text-white font-bold uppercase tracking-widest rounded-full hover:bg-white/10 transition-all">
        Learn More
      </button>
    </div>
  </div>
</section>`
  },
  {
    id: 'features-grid',
    name: 'Bento Features',
    description: 'Modern grid layout for features',
    html: `<section class="py-24 bg-white dark:bg-black px-6">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 p-10 bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem] border border-black/5 dark:border-white/5">
        <h3 class="nike-text text-4xl mb-4 dark:text-white">Precision Engineering.</h3>
        <p class="text-slate-500 dark:text-zinc-400 max-w-md">Every pixel is placed with intent. Our system ensures absolute consistency across all devices.</p>
      </div>
      <div class="p-10 bg-accent rounded-[2.5rem] text-white">
        <h3 class="nike-text text-4xl mb-4">Speed.</h3>
        <p class="opacity-80">Built for performance. Optimized for the modern web.</p>
      </div>
      <div class="p-10 bg-black dark:bg-white rounded-[2.5rem] text-white dark:text-black">
        <h3 class="nike-text text-4xl mb-4">Style.</h3>
        <p class="opacity-80 dark:opacity-60">Iconic design language that commands attention.</p>
      </div>
      <div class="md:col-span-2 p-10 bg-zinc-100 dark:bg-zinc-900 rounded-[2.5rem] border border-black/5 dark:border-white/5">
        <h3 class="nike-text text-4xl mb-4 dark:text-white">AI Integration.</h3>
        <p class="text-slate-500 dark:text-zinc-400 max-w-md">Leverage the power of Gemini to generate components instantly.</p>
      </div>
    </div>
  </div>
</section>`
  },
  {
    id: 'contact-form',
    name: 'Modern Contact Form',
    description: 'Clean, responsive contact form with validation styles',
    html: `<section class="py-24 bg-zinc-50 dark:bg-zinc-950 px-6">
  <div class="max-w-3xl mx-auto">
    <div class="bg-white dark:bg-black p-10 md:p-16 rounded-[2.5rem] shadow-2xl border border-black/5 dark:border-white/10">
      <div class="text-center mb-12">
        <h2 class="nike-text text-5xl mb-4 dark:text-white">GET IN TOUCH.</h2>
        <p class="text-slate-500 dark:text-zinc-400">We're here to help and answer any question you might have.</p>
      </div>
      
      <form class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-slate-400">First Name</label>
            <input type="text" class="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent dark:text-white transition-colors" placeholder="John" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-widest text-slate-400">Last Name</label>
            <input type="text" class="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent dark:text-white transition-colors" placeholder="Doe" />
          </div>
        </div>
        
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
          <input type="email" class="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent dark:text-white transition-colors" placeholder="john@example.com" />
        </div>
        
        <div class="space-y-2">
          <label class="text-xs font-bold uppercase tracking-widest text-slate-400">Message</label>
          <textarea rows="4" class="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-accent dark:text-white transition-colors resize-none" placeholder="How can we help you?"></textarea>
        </div>
        
        <button type="submit" class="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-xl">
          Send Message
        </button>
      </form>
    </div>
  </div>
</section>`
  }
];
