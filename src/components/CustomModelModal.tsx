import React, { useState } from 'react';
import { X, Plus, Key, Link, Cpu, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIModel, AIProvider } from '../types';

interface CustomModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModel: (model: AIModel) => void;
}

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: 'openai', label: 'OpenAI / Custom API' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'gemini', label: 'Google Gemini' },
  { id: 'huggingface', label: 'Hugging Face' },
  { id: 'ollama', label: 'Ollama (Local)' },
  { id: 'openrouter', label: 'OpenRouter' },
];

export const CustomModelModal: React.FC<CustomModelModalProps> = ({ isOpen, onClose, onAddModel }) => {
  const [name, setName] = useState('');
  const [modelId, setModelId] = useState('');
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [contextWindow, setContextWindow] = useState('8192');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !modelId.trim()) return;

    const newModel: AIModel = {
      id: modelId.trim(),
      name: name.trim(),
      provider,
      description: `Custom ${provider} model`,
      contextWindow: parseInt(contextWindow) || 8192,
      isCustom: true,
      apiKey: apiKey.trim() || undefined,
      baseUrl: baseUrl.trim() || undefined,
      downloaded: true, // Treat custom API models as "ready"
    };

    onAddModel(newModel);
    onClose();
    
    // Reset form
    setName('');
    setModelId('');
    setProvider('openai');
    setBaseUrl('');
    setApiKey('');
    setContextWindow('8192');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-lg dark:text-white">Add Custom Model</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:bg-black dark:hover:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Display Name *</label>
              <div className="relative">
                <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Custom GPT-4"
                  className="w-full bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Model ID *</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder="e.g., gpt-4-turbo-preview"
                  className="w-full bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Provider *</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                className="w-full bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 dark:text-white appearance-none"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Base URL (Optional)</label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="e.g., https://api.openai.com/v1"
                  className="w-full bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">API Key (Optional)</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Stored locally in your browser.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Context Window</label>
              <input
                type="number"
                value={contextWindow}
                onChange={(e) => setContextWindow(e.target.value)}
                className="w-full bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 px-4 text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider border-2 border-black dark:border-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !modelId.trim()}
              className="flex-1 px-4 py-2.5 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider border-2 border-black dark:border-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
            >
              Add Model
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
