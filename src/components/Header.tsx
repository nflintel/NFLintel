import React from 'react';
import { Code2, Share2, Play, Download, Github, User, ChevronRight, Sun, Moon, Palette, Undo2, Redo2, Search, LogIn, Shield, Save, RefreshCw, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { Tooltip } from './Tooltip';
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
}

export const Header: React.FC<HeaderProps> = ({ 
  theme,
  onToggleTheme,
  onOpenProfile,
  onOpenTheme,
  onOpenAuth,
  onOpenSearch,
  user,
  activeProjectName,
  onRun,
  onSave,
  isSaving,
  onToggleSecurity,
  showSecurity,
  onOpenShare
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
    <header className="h-16 md:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all hover:rotate-12">
          <Code2 className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="font-bold text-lg md:text-xl leading-none dark:text-white">DIRTNAPP</h1>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            <span className="text-emerald-500">{activeProjectName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2">
          <button 
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all shadow-lg",
              isSaving 
                ? "bg-emerald-500/20 text-emerald-500 cursor-not-allowed" 
                : showSaved
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-500"
            )}
            title="Save Project"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : showSaved ? (
              <Check size={16} />
            ) : (
              <Save size={16} />
            )}
            <span className="hidden lg:inline">
              {isSaving ? 'Saving...' : showSaved ? 'Saved' : 'Save Project'}
            </span>
          </button>

          <button 
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 hover:border-emerald-500/50 transition-all group"
            title="Search Projects (Ctrl+K)"
          >
            <Search size={16} className="group-hover:text-emerald-500 transition-colors" />
            <span className="text-xs font-medium">Search projects...</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <button 
            onClick={onOpenSearch}
            className="md:hidden p-2 text-slate-400 hover:text-emerald-500 transition-colors"
            title="Search Projects"
          >
            <Search size={20} />
          </button>

          <button 
            onClick={onOpenShare}
            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
            title="Share Project"
          >
            <Share2 size={20} />
          </button>

          <button 
            onClick={onToggleSecurity}
            className={cn(
              "p-2 transition-colors",
              showSecurity ? "text-emerald-500" : "text-slate-400 hover:text-emerald-500"
            )}
            title="Security Dashboard"
          >
            <Shield size={20} />
          </button>

          <button 
            onClick={onToggleTheme}
            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
            title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          <button 
            onClick={onOpenTheme}
            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
            title="Theme Settings"
          >
            <Palette size={20} />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        <button 
          onClick={onRun}
          className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Play size={14} fill="currentColor" />
          Run
        </button>

        {user ? (
          <button 
            onClick={onOpenProfile}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <User size={20} />
              </div>
            )}
          </button>
        ) : (
          <button 
            onClick={onOpenAuth}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors px-2"
          >
            <LogIn size={20} />
            <span className="hidden md:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
