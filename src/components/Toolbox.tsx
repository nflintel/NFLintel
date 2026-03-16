import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Hash, 
  Code2, 
  Lock, 
  Settings, 
  Search, 
  Copy, 
  Check,
  RefreshCw,
  Sparkles,
  Plus,
  FolderOpen,
  FileCode,
  Trash2,
  ChevronRight,
  ChevronDown,
  Save,
  Zap,
  Layout,
  Image as ImageIcon,
  FileText,
  Upload,
  X,
  MousePointer2,
  Type,
  Menu,
  Square,
  History,
  RotateCcw,
  Edit2
} from 'lucide-react';
import { generateComponent, generateWordPressTheme, generateWordPressPlugin } from '../services/gemini';
import { TEMPLATES } from '../templates';
import { SNIPPETS, Snippet } from '../snippets';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Project, ProjectAsset, ProjectVersion, AIModel } from '../types';
import { useAIModels } from '../hooks/useAIModels';
import JSZip from 'jszip';

import { Tooltip } from './Tooltip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ToolboxProps {
  onInsertComponent: (html: string) => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  assets: ProjectAsset[];
  onUploadAsset: (asset: Omit<ProjectAsset, 'id'>) => void;
  onDeleteAsset: (id: string) => void;
  token: string | null;
}

import { HuggingFaceBrowser } from './HuggingFaceBrowser';
import { CustomModelModal } from './CustomModelModal';

export const Toolbox: React.FC<ToolboxProps> = ({ 
  onInsertComponent, 
  projects, 
  activeProjectId, 
  onSelectProject, 
  assets,
  onUploadAsset,
  onDeleteAsset,
  token
}) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compDescription, setCompDescription] = useState('');
  const [toolSearch, setToolSearch] = useState('');
  const [assetSearch, setAssetSearch] = useState('');
  const [snippetCategory, setSnippetCategory] = useState<Snippet['category']>('buttons');
  const [isHFBrowserOpen, setIsHFBrowserOpen] = useState(false);
  const [isCustomModelOpen, setIsCustomModelOpen] = useState(false);
  const { models, activeModelId, setActiveModelId, updateModel, addModel, removeModel } = useAIModels();

  // Inline Hugging Face Browser State
  const [hfSearchQuery, setHfSearchQuery] = useState('');
  const [hfResults, setHfResults] = useState<any[]>([]);
  const [isHfSearching, setIsHfSearching] = useState(false);

  const searchHFModels = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hfSearchQuery.trim()) return;

    setIsHfSearching(true);
    try {
      const res = await fetch(`https://huggingface.co/api/models?search=${encodeURIComponent(hfSearchQuery)}&sort=downloads&direction=-1&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setHfResults(data);
      }
    } catch (err) {
      console.error('Failed to search Hugging Face:', err);
    } finally {
      setIsHfSearching(false);
    }
  };

  const handleAddHFModel = (hfModel: any) => {
    const newModel: AIModel = {
      id: hfModel.id,
      name: hfModel.id.split('/').pop() || hfModel.id,
      provider: 'huggingface',
      description: `Hugging Face ${hfModel.pipeline_tag || 'model'} (${hfModel.downloads?.toLocaleString() || 0} downloads)`,
      contextWindow: 8192,
      downloaded: false,
    };
    addModel(newModel);
    // Simulate download
    setTimeout(() => {
      updateModel(newModel.id, { downloaded: true });
      alert(`${newModel.name} downloaded and ready to use!`);
    }, 1000);
  };

  const handleGenerateComponent = async () => {
    if (!compDescription.trim()) return;
    setLoading(true);
    try {
      const html = await generateComponent(compDescription);
      onInsertComponent(html);
      setCompDescription('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackendTool = async (endpoint: string, body?: any) => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: body ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      setOutput(data.result || data.error || 'Error');
    } catch (err) {
      setOutput('Failed to connect to backend');
    } finally {
      setLoading(false);
    }
  };

  const tools = [
    { id: 'b64-enc', name: 'Base64 Enc', icon: Hash, description: 'Text to base64', action: () => setOutput(btoa(input)) },
    { id: 'b64-dec', name: 'Base64 Dec', icon: Hash, description: 'Base64 to text', action: () => {
      try { setOutput(atob(input)); } catch { setOutput('Invalid Base64'); }
    }},
    { id: 'json-fmt', name: 'JSON Format', icon: Code2, description: 'Prettify JSON', action: () => {
      try { setOutput(JSON.stringify(JSON.parse(input), null, 2)); } catch { setOutput('Invalid JSON'); }
    }},
    { id: 'sha256', name: 'SHA-256', icon: Lock, description: 'Generate Hash', action: () => handleBackendTool('/api/tools/hash', { text: input, algorithm: 'sha256' }) },
    { id: 'uuid', name: 'UUID Gen', icon: Settings, description: 'Generate UUID', action: () => handleBackendTool('/api/tools/uuid') },
    { id: 'pass', name: 'Pass Gen', icon: Lock, description: 'Secure Password', action: () => handleBackendTool('/api/tools/password', { length: 20 }) },
  ];

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(toolSearch.toLowerCase()) || 
    tool.description.toLowerCase().includes(toolSearch.toLowerCase())
  );

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    asset.type.toLowerCase().includes(assetSearch.toLowerCase())
  );

  const filteredSnippets = SNIPPETS.filter(s => s.category === snippetCategory);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      alert('Please sign in to upload files');
      return;
    }

    if (file.name.endsWith('.zip')) {
      setLoading(true);
      try {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        
        for (const [filename, zipEntry] of Object.entries(contents.files)) {
          if (zipEntry.dir) continue;
          
          const blob = await zipEntry.async('blob');
          const formData = new FormData();
          formData.append('file', blob, filename);

          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            onUploadAsset({
              name: data.name,
              type: data.type,
              data: data.url, // Use the URL from server
              size: data.size
            });
          }
        }
      } catch (err) {
        console.error('Error unzipping file:', err);
        alert('Failed to unzip file');
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUploadAsset({
          name: data.name,
          type: data.type,
          data: data.url,
          size: data.size
        });
      } else {
        const error = await res.json();
        alert(error.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const insertAssetToCode = (asset: ProjectAsset) => {
    if (asset.type.startsWith('image/')) {
      const imgTag = `<img src="${asset.data}" alt="${asset.name}" className="max-w-full h-auto border-2 border-black dark:border-white" />`;
      onInsertComponent(imgTag);
    } else {
      const scriptTag = `// Asset: ${asset.name}\n// Type: ${asset.type}\n// Data: ${asset.data.substring(0, 50)}...`;
      alert('Script asset info copied to console. You can use it in your code.');
      console.log('Asset Data:', asset.data);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto scrollbar-none transition-colors duration-300">
      <div className="p-6 md:p-8 space-y-12">
        {/* Assets Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black uppercase tracking-widest text-2xl dark:text-white">Assets</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  type="text"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="Search assets..."
                  className="bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white border-2 border-black dark:border-white py-1.5 pl-8 pr-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-black dark:focus:border-white transition-all dark:text-white w-32"
                />
              </div>
              <label className="flex items-center gap-2 px-3 py-1.5 border-2 border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <ImageIcon className="w-3 h-3" />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:inline">Upload Image</span>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredAssets.length === 0 ? (
              <div className="col-span-2 p-8 border-2 border-dashed border-black dark:border-white border-2 border-black dark:border-white flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4">
                  {assetSearch ? 'No matches' : 'No Assets'}
                </p>
                {!assetSearch && (
                  <label className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
                    <Upload className="w-3 h-3" />
                    Upload Image
                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                  </label>
                )}
              </div>
            ) : (
              filteredAssets.map(asset => (
                <div 
                  key={asset.id}
                  className="group relative bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white border-2 border-black dark:border-white overflow-hidden hover:border-black dark:hover:border-white transition-all"
                >
                  <div 
                    className="aspect-square w-full bg-white dark:bg-black dark:bg-black flex items-center justify-center cursor-pointer"
                    onClick={() => insertAssetToCode(asset)}
                  >
                    {asset.type.startsWith('image/') ? (
                      <img src={asset.data} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <FileText className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold truncate max-w-[80%] dark:text-zinc-400">{asset.name}</span>
                      <button 
                        onClick={() => onDeleteAsset(asset.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[7px] text-slate-400 uppercase tracking-tighter">
                      <span>{asset.type.split('/')[1] || asset.type}</span>
                      <span>{(asset.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* AI Component Generator */}
        <section className="p-8 bg-black dark:bg-black border-2 border-black dark:border-white space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] border border-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="flex items-center gap-3 text-white relative z-10">
            <div className="p-2 bg-accent/20 border-2 border-black dark:border-white">
              <Zap className="w-5 h-5 text-accent animate-pulse" />
            </div>
            <h2 className="font-black uppercase tracking-widest text-2xl">AI Forge</h2>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="relative">
              <input 
                type="text"
                value={compDescription}
                onChange={(e) => setCompDescription(e.target.value)}
                placeholder="Describe component or theme..."
                className="w-full bg-white/5 border border-white border-2 border-black dark:border-white p-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-all focus:bg-white/10"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateComponent()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-accent" />}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={handleGenerateComponent}
                disabled={loading || !compDescription.trim()}
                className="flex items-center justify-center gap-2 w-full p-4 border-2 border-black dark:border-white bg-accent text-white font-bold text-xs uppercase tracking-[0.2em] disabled:opacity-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                <Sparkles className="w-4 h-4" />
                Forge Component
              </button>
            </div>
          </div>
        </section>

        {/* Hugging Face Quick Search */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black uppercase tracking-widest text-2xl dark:text-white">Hugging Face Hub</h2>
          </div>
          <div className="flex flex-col gap-3">
            <form onSubmit={searchHFModels} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={hfSearchQuery}
                onChange={(e) => setHfSearchQuery(e.target.value)}
                placeholder="Search models (e.g., llama)..."
                className="w-full bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white border-2 border-black dark:border-white py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-all dark:text-white"
              />
              <button 
                type="submit"
                disabled={isHfSearching}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest border-2 border-black dark:border-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {isHfSearching ? '...' : 'Search'}
              </button>
            </form>
            
            {hfResults.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {hfResults.map(model => (
                  <div key={model.id} className="flex flex-col p-4 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold dark:text-white truncate pr-2">{model.id.split('/').pop()}</span>
                      <button 
                        onClick={() => handleAddHFModel(model)}
                        className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 border-2 border-black dark:border-white hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
                      {model.pipeline_tag ? `Optimized for ${model.pipeline_tag}. ` : ''}
                      Open-source model available via Hugging Face Inference API.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      <span>Provider: Hugging Face</span>
                      <div className="w-1 h-1 border-2 border-black dark:border-white bg-slate-300 dark:bg-slate-700" />
                      <span>Context: 8K Tokens</span>
                      <div className="w-1 h-1 border-2 border-black dark:border-white bg-slate-300 dark:bg-slate-700" />
                      <span>{model.downloads >= 1000000 ? `${(model.downloads / 1000000).toFixed(1)}M` : `${(model.downloads / 1000).toFixed(1)}K`} DLs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AI Models Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black uppercase tracking-widest text-2xl dark:text-white">AI Models</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsCustomModelOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-black dark:bg-black dark:bg-black dark:bg-zinc-900 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 border-2 border-black dark:border-white text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Custom
              </button>
              <button 
                onClick={() => setIsHFBrowserOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-black dark:bg-black dark:bg-black dark:bg-zinc-900 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 border-2 border-black dark:border-white text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                <Search className="w-3 h-3" />
                Browse HF
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {models.map(model => (
              <div 
                key={model.id}
                className={cn(
                  "flex flex-col p-4 border-2 border-black dark:border-white border transition-all cursor-pointer group",
                  activeModelId === model.id 
                    ? "bg-emerald-500/10 border-emerald-500 dark:bg-emerald-500/20" 
                    : "bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border-black dark:border-white hover:border-black dark:hover:border-white"
                )}
                onClick={() => setActiveModelId(model.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className={cn(
                      "w-4 h-4",
                      activeModelId === model.id ? "text-emerald-500" : "text-slate-400 group-hover:text-black dark:group-hover:text-white"
                    )} />
                    <span className="text-sm font-bold dark:text-white">{model.name}</span>
                  </div>
                  {activeModelId === model.id && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      <Check className="w-3 h-3" />
                      Active
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-3">{model.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-white dark:bg-black dark:bg-black dark:bg-black dark:bg-zinc-900 px-2 py-1 border-2 border-black dark:border-white">
                    {model.provider}
                  </span>
                  <div className="flex items-center gap-2">
                    {model.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModel(model.id);
                        }}
                        className="text-[9px] font-bold uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 border-2 border-black dark:border-white hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                    {!model.downloaded && model.provider !== 'gemini' && model.provider !== 'openai' && model.provider !== 'anthropic' && !model.isCustom && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateModel(model.id, { downloaded: true });
                          // Simulate download
                          setTimeout(() => alert(`${model.name} downloaded and ready to use!`), 1000);
                        }}
                        className="text-[9px] font-bold uppercase tracking-widest text-white bg-black dark:bg-white dark:text-black px-3 py-1 border-2 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform"
                      >
                        Download
                      </button>
                    )}
                    {model.downloaded && model.provider !== 'gemini' && model.provider !== 'openai' && model.provider !== 'anthropic' && !model.isCustom && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Templates */}
        <section className="space-y-4">
          <h2 className="font-black uppercase tracking-widest text-2xl dark:text-white">Templates</h2>
          <div className="grid grid-cols-1 gap-3">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => onInsertComponent(template.html)}
                className="flex flex-col items-start p-4 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white hover:border-black dark:hover:border-white transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layout className="w-4 h-4 text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                  <span className="text-sm font-bold dark:text-white">{template.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 text-left">{template.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Snippets Section */}
        <section className="space-y-4">
          <h2 className="font-black uppercase tracking-widest text-2xl dark:text-white">Snippets</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'buttons', icon: MousePointer2, label: 'Buttons' },
              { id: 'forms', icon: Type, label: 'Forms' },
              { id: 'nav', icon: Menu, label: 'Nav' },
              { id: 'cards', icon: Square, label: 'Cards' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSnippetCategory(cat.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
                  snippetCategory === cat.id 
                    ? "bg-black dark:bg-white text-white dark:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]" 
                    : "bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 text-slate-400 border border-black dark:border-white"
                )}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredSnippets.map(snippet => (
              <button
                key={snippet.id}
                onClick={() => onInsertComponent(snippet.code)}
                className="flex flex-col items-start p-4 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white hover:border-black dark:hover:border-white transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-sm font-bold dark:text-white">{snippet.name}</span>
                  <Plus className="w-3 h-3 text-slate-400 group-hover:text-black dark:group-hover:text-white" />
                </div>
                <p className="text-[10px] text-slate-400 text-left">{snippet.description}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Utilities */}
        <section className="space-y-6">
          <h2 className="font-black uppercase tracking-widest text-2xl dark:text-white">Utilities</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                placeholder="Search Tools"
                className="w-full bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white border-2 border-black dark:border-white py-4 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-all dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.action}
                  disabled={loading}
                  className="flex flex-col items-start p-4 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white hover:border-black dark:hover:border-white transition-all group disabled:opacity-50"
                >
                  <tool.icon className="w-5 h-5 mb-3 text-slate-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-black dark:group-hover:text-white">{tool.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Input Data</label>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-32 bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border border-black dark:border-white border-2 border-black dark:border-white p-4 text-sm font-medium focus:outline-none focus:border-black dark:focus:border-white transition-all resize-none dark:text-white"
                placeholder="Paste data here..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Result</label>
                <button 
                  onClick={handleCopy}
                  className="p-2 border-2 border-black dark:border-white hover:bg-white dark:bg-black dark:hover:bg-zinc-800 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <textarea 
                value={output}
                readOnly
                className="w-full h-32 bg-white dark:bg-black dark:bg-zinc-950 border border-black dark:border-white border-2 border-black dark:border-white p-4 text-sm font-mono text-slate-600 dark:text-zinc-400 focus:outline-none resize-none"
                placeholder="Output..."
              />
            </div>
          </div>
        </section>
      </div>
      <HuggingFaceBrowser 
        isOpen={isHFBrowserOpen} 
        onClose={() => setIsHFBrowserOpen(false)} 
        onAddModel={addModel} 
      />
      <CustomModelModal
        isOpen={isCustomModelOpen}
        onClose={() => setIsCustomModelOpen(false)}
        onAddModel={addModel}
      />
    </div>
  );
};
