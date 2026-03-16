import React from 'react';
import { Code2, Menu, Save, Check, RefreshCw, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenTheme: () => void;
  onOpenAuth: () => void;
  onOpenSearch: () => void;
  user: UserProfile | null;
  activeProjectName: string;
  onRun: () => void;
  onSave: () => void;
  isSaving: boolean;
  onToggleSecurity: () => void;
  showSecurity: boolean;
  onOpenShare: () => void;
  mainView: 'editor' | 'explore' | 'dashboard' | 'profile';
  setMainView: (view: 'editor' | 'explore' | 'dashboard' | 'profile') => void;
  onOpenMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProjectName,
  onSave,
  isSaving,
  mainView,
  setMainView,
  onOpenMenu,
  onRun
}) => {
  const [showSaved, setShowSaved] = React.useState(false);
  const prevIsSaving = React.useRef(isSaving);

  React.useEffect(() => {
    if (prevIsSaving.current && !isSaving) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    prevIsSaving.current = isSaving;
  }, [isSaving]);

  return (
    <header className="h-16 bg-white dark:bg-black border-b-2 border-black dark:border-white flex items-center justify-between px-2 sm:px-4 z-50 sticky top-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="w-10 h-10 bg-black dark:bg-white flex items-center justify-center border-2 border-black dark:border-white shrink-0">
          <Code2 className="w-6 h-6 text-white dark:text-black" />
        </div>
        <div className="hidden md:flex items-center border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-black dark:bg-zinc-900">
          {['editor', 'explore', 'dashboard'].map(view => (
            <button
              key={view}
              onClick={() => setMainView(view as any)}
              className={cn(
                "px-4 lg:px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors border-r-2 border-black dark:border-white last:border-r-0",
                mainView === view ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-xs font-bold uppercase tracking-widest hidden sm:block mr-2 px-4 py-2 border-2 border-black dark:border-white truncate max-w-[150px] lg:max-w-[300px]">
          {activeProjectName}
        </div>
        {onRun && (
          <button onClick={onRun} className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0">
            <Play size={18} />
          </button>
        )}
        <button onClick={onSave} disabled={isSaving} className="w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0">
          {isSaving ? <RefreshCw size={18} className="animate-spin" /> : showSaved ? <Check size={18} /> : <Save size={18} />}
        </button>
        <button onClick={onOpenMenu} className="w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors bg-emerald-400 dark:bg-emerald-500 text-black shrink-0">
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
};
