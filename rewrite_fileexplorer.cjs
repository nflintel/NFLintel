const fs = require('fs');
let content = fs.readFileSync('src/components/FileExplorer.tsx', 'utf8');

// Replace rounded corners
content = content.replace(/rounded-2xl/g, 'border-2 border-black dark:border-white');
content = content.replace(/rounded-\[2\.5rem\]/g, 'border-2 border-black dark:border-white');
content = content.replace(/rounded-full/g, 'border-2 border-black dark:border-white');
content = content.replace(/rounded-lg/g, 'border-2 border-black dark:border-white');
content = content.replace(/rounded-xl/g, 'border-2 border-black dark:border-white');

// Replace backgrounds
content = content.replace(/bg-slate-50/g, 'bg-white dark:bg-black');
content = content.replace(/bg-zinc-100/g, 'bg-white dark:bg-black');
content = content.replace(/bg-zinc-900/g, 'bg-black dark:bg-zinc-900');
content = content.replace(/bg-slate-800/g, 'bg-black dark:bg-zinc-900');
content = content.replace(/bg-slate-100/g, 'bg-white dark:bg-black');
content = content.replace(/bg-bg-surface/g, 'bg-white dark:bg-black');
content = content.replace(/bg-slate-dark/g, 'bg-black');

// Replace borders
content = content.replace(/border-border-base/g, 'border-black');
content = content.replace(/border-white\/10/g, 'border-white');
content = content.replace(/border-white\/5/g, 'border-white');
content = content.replace(/border-black\/5/g, 'border-black');

// Replace shadows
content = content.replace(/shadow-lg/g, 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]');
content = content.replace(/shadow-2xl/g, 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]');
content = content.replace(/shadow-sm/g, 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]');

// Replace hover effects
content = content.replace(/hover:scale-105/g, 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]');
content = content.replace(/hover:scale-\[1\.02\]/g, 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]');

// Replace typography
content = content.replace(/nike-text/g, 'font-black uppercase tracking-widest');

fs.writeFileSync('src/components/FileExplorer.tsx', content);
