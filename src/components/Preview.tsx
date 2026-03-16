import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PreviewProps {
  html: string;
  css: string;
  js: string;
  react?: string;
  md?: string;
  activeTab?: string;
}

export const Preview: React.FC<PreviewProps> = ({ html, css, js, react, md, activeTab }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const srcDoc = useMemo(() => {
    if (react && react.trim().length > 0) {
      return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { margin: 0; }
            ${css}
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            try {
              ${react.replace('export default', 'const App =')}
              const root = ReactDOM.createRoot(document.getElementById('root'));
              root.render(<App />);
            } catch (err) {
              console.error('React Preview Error:', err);
              document.getElementById('root').innerHTML = '<pre style="color: red; padding: 20px;">' + err.message + '</pre>';
            }
          </script>
        </body>
      </html>
      `;
    }

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { margin: 0; padding: 1rem; }
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>
          try {
            ${js}
          } catch (err) {
            console.error('Preview Script Error:', err);
          }
        <\/script>
      </body>
    </html>
  `;
  }, [html, css, js, react]);

  useEffect(() => {
    setIsLoading(true);
  }, [srcDoc]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black dark:bg-zinc-950 border-2 border-black dark:border-white overflow-hidden border border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-black dark:bg-zinc-900 border-b border-black dark:border-white">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 border-2 border-black dark:border-white bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 border-2 border-black dark:border-white bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 border-2 border-black dark:border-white bg-green-500/20 border border-green-500/50" />
        </div>
        
        <div className="flex bg-white dark:bg-black dark:bg-black border-2 border-black dark:border-white p-1">
          <button 
            onClick={() => setViewMode('desktop')}
            className={cn(
              "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
              viewMode === 'desktop' ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]" : "text-slate-400 hover:text-black dark:hover:text-white"
            )}
          >
            Desktop
          </button>
          <button 
            onClick={() => setViewMode('mobile')}
            className={cn(
              "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all",
              viewMode === 'mobile' ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]" : "text-slate-400 hover:text-black dark:hover:text-white"
            )}
          >
            Mobile
          </button>
        </div>

        <div className="w-12" />
      </div>

      <div className="flex-1 relative bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 p-4 flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-50/80 dark:bg-black dark:bg-zinc-900/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 text-accent animate-spin" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 animate-pulse">
                Forging Live View
              </p>
            </div>
          </div>
        )}
        
        <div 
          className={cn(
            "bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all duration-500 ease-in-out overflow-hidden",
            viewMode === 'desktop' ? "w-full h-full border-2 border-black dark:border-white" : "w-[375px] h-[667px] rounded-[3rem] border-[8px] border-black dark:border-zinc-800"
          )}
        >
          {activeTab === 'md' && md !== undefined ? (
            <div className="w-full h-full p-8 overflow-y-auto bg-white dark:bg-black dark:bg-zinc-900 text-black dark:text-white">
              <div className="markdown-body prose prose-slate dark:prose-invert max-w-none">
                <Markdown>{md}</Markdown>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={srcDoc}
              title="preview"
              onLoad={() => setIsLoading(false)}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-modals allow-same-origin"
            />
          )}
        </div>
      </div>
    </div>
  );
};
