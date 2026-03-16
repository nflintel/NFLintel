import React, { useState } from 'react';
import { X, Palette, Save, RotateCcw } from 'lucide-react';
import { ThemeConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ThemeConfig;
  onSave: (config: ThemeConfig) => void;
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#10b981',
  darkSlate: '#0f172a',
  fontSans: 'Inter, sans-serif',
  fontMono: 'JetBrains Mono, monospace',
};

export const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<ThemeConfig>(config);

  const handleChange = (key: keyof ThemeConfig, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFormData(DEFAULT_THEME);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] overflow-hidden border border-black dark:border-white"
        >
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-black dark:bg-white border-2 border-black dark:border-white">
                  <Palette className="w-5 h-5 text-white dark:text-black" />
                </div>
                <div>
                  <h2 className="font-black uppercase tracking-widest text-2xl dark:text-white">Theme Lab</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Custom Variables</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white dark:bg-black dark:hover:bg-zinc-800 border-2 border-black dark:border-white transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Presets</label>
                <div className="flex gap-2">
                  {[
                    { name: 'Emerald', color: '#10b981' },
                    { name: 'Blue', color: '#3b82f6' },
                    { name: 'Purple', color: '#a855f7' },
                    { name: 'Green', color: '#22c55e' },
                    { name: 'Rose', color: '#f43f5e' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleChange('primaryColor', preset.color)}
                      className="w-8 h-8 border-2 border-black dark:border-white border-2 border-white dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transition-transform hover:scale-110"
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Primary Color</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-12 h-12 border-2 border-black dark:border-white border-none cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 bg-white dark:bg-black dark:bg-zinc-950 border border-black dark:border-white border-2 border-black dark:border-white px-4 text-sm font-mono dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Dark Slate Color</label>
                <div className="flex gap-3">
                  <input 
                    type="color" 
                    value={formData.darkSlate}
                    onChange={(e) => handleChange('darkSlate', e.target.value)}
                    className="w-12 h-12 border-2 border-black dark:border-white border-none cursor-pointer bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={formData.darkSlate}
                    onChange={(e) => handleChange('darkSlate', e.target.value)}
                    className="flex-1 bg-white dark:bg-black dark:bg-zinc-950 border border-black dark:border-white border-2 border-black dark:border-white px-4 text-sm font-mono dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Sans Font Family</label>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) handleChange('fontSans', e.target.value);
                      e.target.value = ''; // Reset select after choosing
                    }}
                    className="text-[10px] uppercase tracking-widest font-bold bg-transparent border-none text-emerald-500 outline-none cursor-pointer dark:bg-black dark:bg-zinc-900"
                  >
                    <option value="">Presets...</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                    <option value="Open Sans, sans-serif">Open Sans</option>
                    <option value="Montserrat, sans-serif">Montserrat</option>
                    <option value="system-ui, -apple-system, sans-serif">System UI</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={formData.fontSans}
                  onChange={(e) => handleChange('fontSans', e.target.value)}
                  className="w-full bg-white dark:bg-black dark:bg-zinc-950 border border-black dark:border-white border-2 border-black dark:border-white px-4 py-3 text-sm font-medium dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all"
                  placeholder="Inter, sans-serif"
                />
                <div 
                  className="p-4 mt-2 bg-white dark:bg-black dark:bg-zinc-950/50 border-2 border-black dark:border-white border border-slate-100 dark:border-zinc-800/50"
                  style={{ fontFamily: formData.fontSans }}
                >
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mb-1">The quick brown fox</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Jumps over the lazy dog.</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Mono Font Family</label>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) handleChange('fontMono', e.target.value);
                      e.target.value = ''; // Reset select after choosing
                    }}
                    className="text-[10px] uppercase tracking-widest font-bold bg-transparent border-none text-emerald-500 outline-none cursor-pointer dark:bg-black dark:bg-zinc-900"
                  >
                    <option value="">Presets...</option>
                    <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                    <option value="Fira Code, monospace">Fira Code</option>
                    <option value="Roboto Mono, monospace">Roboto Mono</option>
                    <option value="Source Code Pro, monospace">Source Code Pro</option>
                    <option value="Consolas, Monaco, monospace">Consolas / Monaco</option>
                  </select>
                </div>
                <input 
                  type="text" 
                  value={formData.fontMono}
                  onChange={(e) => handleChange('fontMono', e.target.value)}
                  className="w-full bg-white dark:bg-black dark:bg-zinc-950 border border-black dark:border-white border-2 border-black dark:border-white px-4 py-3 text-sm font-medium dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-all"
                  placeholder="JetBrains Mono, monospace"
                />
                <div 
                  className="p-4 mt-2 bg-white dark:bg-black dark:bg-zinc-950/50 border-2 border-black dark:border-white border border-slate-100 dark:border-zinc-800/50"
                  style={{ fontFamily: formData.fontMono }}
                >
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">function <span className="text-slate-900 dark:text-white">helloWorld</span>() {'{'}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 ml-4">console.log("Hello!");</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{'}'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button 
                onClick={() => onSave(formData)}
                className="flex-1 flex items-center justify-center gap-2 py-4 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:scale-[0.98] transition-all shadow-xl"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
