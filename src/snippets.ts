export interface Snippet {
  id: string;
  name: string;
  category: 'buttons' | 'forms' | 'nav' | 'cards' | 'layouts';
  code: string;
  description: string;
}

export const SNIPPETS: Snippet[] = [
  // Buttons
  {
    id: 'btn-primary',
    name: 'Primary Button',
    category: 'buttons',
    description: 'Standard rounded button with hover effect',
    code: `<button class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all active:scale-95">
  Primary Action
</button>`
  },
  {
    id: 'btn-outline',
    name: 'Outline Button',
    category: 'buttons',
    description: 'Bordered button for secondary actions',
    code: `<button class="px-6 py-3 border-2 border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-900 dark:text-white font-semibold rounded-lg transition-all">
  Secondary Action
</button>`
  },
  {
    id: 'btn-ghost',
    name: 'Ghost Button',
    category: 'buttons',
    description: 'Minimal button with background on hover',
    code: `<button class="px-6 py-3 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 font-medium rounded-lg transition-all">
  Ghost Action
</button>`
  },

  // Forms
  {
    id: 'form-input',
    name: 'Text Input',
    category: 'forms',
    description: 'Styled text input with label',
    code: `<div class="space-y-2">
  <label class="block text-sm font-medium text-slate-700 dark:text-zinc-300">Email Address</label>
  <input 
    type="email" 
    placeholder="you@example.com" 
    class="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
  />
</div>`
  },
  {
    id: 'form-contact',
    name: 'Contact Form',
    category: 'forms',
    description: 'Complete contact form layout',
    code: `<form class="space-y-4 p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
  <div class="grid grid-cols-2 gap-4">
    <div class="space-y-1">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-400">First Name</label>
      <input type="text" class="w-full px-4 py-2 bg-slate-50 dark:bg-black border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 outline-none transition-all dark:text-white" />
    </div>
    <div class="space-y-1">
      <label class="text-xs font-bold uppercase tracking-wider text-slate-400">Last Name</label>
      <input type="text" class="w-full px-4 py-2 bg-slate-50 dark:bg-black border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 outline-none transition-all dark:text-white" />
    </div>
  </div>
  <div class="space-y-1">
    <label class="text-xs font-bold uppercase tracking-wider text-slate-400">Message</label>
    <textarea rows="4" class="w-full px-4 py-2 bg-slate-50 dark:bg-black border border-transparent rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 outline-none transition-all dark:text-white resize-none"></textarea>
  </div>
  <button type="submit" class="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all">Send Message</button>
</form>`
  },

  // Navigation
  {
    id: 'nav-simple',
    name: 'Simple Navbar',
    category: 'nav',
    description: 'Basic navigation with logo and links',
    code: `<nav class="flex items-center justify-between px-6 py-4 bg-white dark:bg-black border-b border-slate-100 dark:border-zinc-900">
  <div class="flex items-center gap-2">
    <div class="w-8 h-8 bg-blue-600 rounded-lg"></div>
    <span class="font-bold text-xl dark:text-white">Brand</span>
  </div>
  <div class="hidden md:flex items-center gap-8">
    <a href="#" class="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors">Product</a>
    <a href="#" class="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors">Features</a>
    <a href="#" class="text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-blue-600 transition-colors">Pricing</a>
  </div>
  <button class="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg">Sign Up</button>
</nav>`
  },

  // Cards
  {
    id: 'card-feature',
    name: 'Feature Card',
    category: 'cards',
    description: 'Card with icon, title and text',
    code: `<div class="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:shadow-xl transition-all group">
  <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </div>
  <h3 class="text-lg font-bold mb-2 dark:text-white">Lightning Fast</h3>
  <p class="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">Experience unprecedented speed with our optimized rendering engine.</p>
</div>`
  }
];
