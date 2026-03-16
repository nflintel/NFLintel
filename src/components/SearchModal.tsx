import React, { useState, useEffect } from 'react';
import { X, Search, Calendar, Tag, ArrowRight, Loader2, Filter, SortAsc, SortDesc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project } from '../types';

interface SearchModalProps {
  onClose: () => void;
  onSelectProject: (id: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose, onSelectProject }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Project[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    sort: 'updatedAt',
    order: 'desc' as 'asc' | 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        sort: filters.sort,
        order: filters.order,
        ...(filters.category && { category: filters.category }),
        ...(filters.startDate && { startDate: new Date(filters.startDate).getTime().toString() }),
        ...(filters.endDate && { endDate: new Date(filters.endDate).getTime().toString() }),
      });

      const res = await fetch(`/api/projects/search?${params.toString()}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, filters]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-20 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5 flex flex-col max-h-full"
      >
        <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects, code, or assets..."
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all dark:text-white"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 rounded-2xl border transition-all ${showFilters ? 'bg-black text-white dark:bg-white dark:text-black border-transparent' : 'bg-zinc-50 dark:bg-zinc-900 border-black/5 dark:border-white/10 text-zinc-400 hover:text-black dark:hover:text-white'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 text-zinc-400 hover:text-black dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 flex items-center gap-2">
                      <Tag className="w-3 h-3" /> Category
                    </label>
                    <select 
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w- Nike-input w-full bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none dark:text-white"
                    >
                      <option value="">All Categories</option>
                      <option value="web">Web App</option>
                      <option value="mobile">Mobile</option>
                      <option value="landing">Landing Page</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> From
                    </label>
                    <input 
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3" /> To
                    </label>
                    <input 
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 flex items-center gap-2">
                      <SortAsc className="w-3 h-3" /> Sort By
                    </label>
                    <div className="flex gap-2">
                      <select 
                        value={filters.sort}
                        onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl p-3 text-xs focus:outline-none dark:text-white"
                      >
                        <option value="updatedAt">Date Updated</option>
                        <option value="name">Project Name</option>
                      </select>
                      <button 
                        onClick={() => setFilters({ ...filters, order: filters.order === 'asc' ? 'desc' : 'asc' })}
                        className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-xl text-zinc-400 hover:text-black dark:hover:text-white transition-all"
                      >
                        {filters.order === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Searching the Lab...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    onSelectProject(project.id);
                    onClose();
                  }}
                  className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-[1.5rem] hover:border-black dark:hover:border-white transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg shrink-0">
                    {project.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm dark:text-white truncate">{project.name}</h4>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">No projects found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
