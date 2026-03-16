import React from 'react';

export const Tabs: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col h-full">{children}</div>
);

export const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex border-b border-black bg-white dark:bg-black/50">{children}</div>
);

export const TabsTrigger: React.FC<{ value: string; active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
      active ? 'text-primary-light border-b-2 border-primary-light bg-bg-elevated/50' : 'text-slate-500 hover:text-slate-300'
    }`}
  >
    {children}
  </button>
);

export const TabsContent: React.FC<{ value: string; active: boolean; children: React.ReactNode }> = ({ active, children }) => (
  <div className={`flex-1 ${active ? 'block' : 'hidden'}`}>{children}</div>
);
