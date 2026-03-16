import React, { useState } from 'react';
import { Search, Download, X, Loader2, Box, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AIModel } from '../types';

interface HuggingFaceBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModel: (model: AIModel) => void;
}

interface HFModel {
  id: string;
  downloads: number;
  tags: string[];
  pipeline_tag?: string;
}

const TASKS = [
  { id: 'text-generation', label: 'Text Generation' },
  { id: 'text2text-generation', label: 'Text-to-Text' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'question-answering', label: 'Question Answering' }
];

export const HuggingFaceBrowser: React.FC<HuggingFaceBrowserProps> = ({ isOpen, onClose, onAddModel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState('text-generation');
  const [results, setResults] = useState<HFModel[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchModels = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() && !selectedTask) return;

    setIsSearching(true);
    try {
      const query = searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : '';
      const filter = selectedTask ? `filter=${selectedTask}&` : '';
      const res = await fetch(`https://huggingface.co/api/models?${query}${filter}sort=downloads&direction=-1&limit=15`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Failed to search Hugging Face:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = (hfModel: HFModel) => {
    const newModel: AIModel = {
      id: hfModel.id,
      name: hfModel.id.split('/').pop() || hfModel.id,
      provider: 'huggingface',
      description: `Hugging Face ${hfModel.pipeline_tag || 'model'} (${hfModel.downloads.toLocaleString()} downloads)`,
      contextWindow: 8192, // Default fallback
      downloaded: false,
    };
    onAddModel(newModel);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-500" />
            <h2 className="font-bold text-lg dark:text-white">Model Hub</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white dark:bg-black dark:hover:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-black dark:bg-slate-900/50 space-y-3">
          <form onSubmit={searchModels} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models (e.g., llama, mistral)..."
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
              />
            </div>
            <div className="relative w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white py-2.5 pl-10 pr-8 text-sm focus:outline-none focus:border-emerald-500 dark:text-white appearance-none"
              >
                <option value="">All Tasks</option>
                {TASKS.map(task => (
                  <option key={task.id} value={task.id}>{task.label}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit"
              disabled={isSearching}
              className="px-6 py-2.5 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider border-2 border-black dark:border-white hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[100px]"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-black/50 dark:bg-slate-950/50">
          {results.length === 0 && !isSearching && (
            <div className="text-center py-16 text-slate-500 dark:text-slate-400">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Search and filter to discover AI models.</p>
            </div>
          )}

          {results.map((model) => (
            <div key={model.id} className="flex items-start justify-between p-5 border-2 border-black dark:border-white border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 transition-colors group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base dark:text-white">{model.id.split('/').pop()}</h3>
                  <span className="text-[10px] px-2 py-0.5 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 text-slate-500 dark:text-slate-400">
                    {model.id.split('/')[0]}
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                  {model.pipeline_tag ? `Optimized for ${model.pipeline_tag}. ` : ''}
                  Open-source model available via Hugging Face Inference API.
                </p>

                <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500">Provider:</span> Hugging Face
                  </div>
                  <div className="w-1 h-1 border-2 border-black dark:border-white bg-slate-300 dark:bg-slate-700" />
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500">Context:</span> 8K Tokens
                  </div>
                  <div className="w-1 h-1 border-2 border-black dark:border-white bg-slate-300 dark:bg-slate-700" />
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-500">Downloads:</span> {model.downloads >= 1000000 ? `${(model.downloads / 1000000).toFixed(1)}M` : `${(model.downloads / 1000).toFixed(1)}K`}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleAdd(model)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 border-2 border-black dark:border-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                Add Model
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
