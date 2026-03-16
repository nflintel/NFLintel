import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';

const THEME_STORAGE_KEY = 'deepsite_theme';
const CONFIG_STORAGE_KEY = 'deepsite_config';

const DEFAULT_CONFIG: ThemeConfig = {
  primaryColor: '#10b981',
  darkSlate: '#0f172a',
  fontSans: 'Inter, sans-serif',
  fontMono: 'JetBrains Mono, monospace',
};

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty('--accent-custom', themeConfig.primaryColor);
    root.style.setProperty('--color-primary-custom', themeConfig.primaryColor);
    root.style.setProperty('--color-slate-dark-custom', themeConfig.darkSlate);
    root.style.setProperty('--bg-base-custom', themeConfig.darkSlate);
    root.style.setProperty('--font-sans-custom', themeConfig.fontSans);
    root.style.setProperty('--font-mono-custom', themeConfig.fontMono);
    
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(themeConfig));
  }, [themeConfig]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return { theme, toggleTheme, themeConfig, setThemeConfig };
}
