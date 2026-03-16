import React from 'react';
import { motion } from 'motion/react';
import { Globe, Heart, GitFork, Play, Code2, Zap, ArrowRight } from 'lucide-react';
import { Project } from '../types';

interface ExploreProps {
  onCloneProject: (project: Project) => void;
  onPlayProject: (project: Project) => void;
}

const MOCK_COMMUNITY_PROJECTS: Project[] = [
  {
    id: 'explore-1',
    name: 'Neon Racer 3D',
    description: 'A high-speed retro-wave racing game built with Three.js and React Fiber. Dodge obstacles and beat the high score!',
    author: 'CyberDev99',
    likes: 1245,
    forks: 342,
    userId: 'mock',
    updatedAt: Date.now() - 86400000,
    code: { html: '', css: '', js: '', php: '', react: '', md: '' },
    category: 'Game'
  },
  {
    id: 'explore-2',
    name: 'AI Synth Studio',
    description: 'Create music using AI. This app uses Web Audio API and a custom LLM to generate melodies based on text prompts.',
    author: 'AudioMage',
    likes: 892,
    forks: 156,
    userId: 'mock',
    updatedAt: Date.now() - 172800000,
    code: { html: '', css: '', js: '', php: '', react: '', md: '' },
    category: 'App'
  },
  {
    id: 'explore-3',
    name: 'Crypto Dash',
    description: 'Real-time cryptocurrency dashboard with D3.js visualizations and WebSocket live data feeds.',
    author: 'SatoshiFan',
    likes: 2104,
    forks: 890,
    userId: 'mock',
    updatedAt: Date.now() - 432000000,
    code: { html: '', css: '', js: '', php: '', react: '', md: '' },
    category: 'Finance'
  },
  {
    id: 'explore-4',
    name: 'Zenith Productivity',
    description: 'A beautiful, minimalist task manager with Pomodoro timer and AI-powered task breakdown.',
    author: 'MinimalistCoder',
    likes: 567,
    forks: 89,
    userId: 'mock',
    updatedAt: Date.now() - 600000000,
    code: { html: '', css: '', js: '', php: '', react: '', md: '' },
    category: 'Utility'
  },
  {
    id: 'explore-5',
    name: 'Pixel Art Generator',
    description: 'Turn any image into retro pixel art using Canvas API and WebGL shaders.',
    author: 'RetroGamer',
    likes: 3421,
    forks: 1205,
    userId: 'mock',
    updatedAt: Date.now() - 800000000,
    code: { html: '', css: '', js: '', php: '', react: '', md: '' },
    category: 'Tool'
  },
  {
    id: 'explore-6',
    name: 'Weather Sphere',
    description: 'Interactive 3D globe showing real-time weather patterns across the world.',
    author: 'GeoDev',
    likes: 1890,
    forks: 432,
    userId: 'mock',
    updatedAt: Date.now() - 1000000000,
    code: { html: '', css: '', js: '', php: '', react: '', md: '' },
    category: 'Data Viz'
  }
];

export const Explore: React.FC<ExploreProps> = ({ onCloneProject, onPlayProject }) => {
  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        
        {/* Hero Section */}
        <div className="relative bg-black dark:bg-white border-2 border-black dark:border-white p-8 md:p-16 text-center flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          
          <div className="relative z-10 space-y-6 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-white dark:border-black text-white dark:text-black text-xs font-bold uppercase tracking-widest mb-4 bg-black/50 dark:bg-white/50 backdrop-blur-sm">
              <Globe className="w-4 h-4" />
              Discover the Future
            </div>
            <h1 className="text-4xl md:text-7xl text-white dark:text-black font-black uppercase tracking-tighter leading-none">
              COMMUNITY <span className="text-emerald-400 dark:text-emerald-600">CREATIONS</span>
            </h1>
            <p className="text-sm md:text-lg text-white/80 dark:text-black/80 font-medium uppercase tracking-widest">
              Explore thousands of elite games, apps, and tools built by the Dirtnapp community. Clone, edit, and launch your own version in seconds.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest dark:text-white">Trending Now</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {['All', 'Games', 'Apps', 'Tools'].map(filter => (
              <button key={filter} className="px-6 py-2 bg-white dark:bg-black border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0">
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_COMMUNITY_PROJECTS.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group flex flex-col bg-white dark:bg-black border-2 border-black dark:border-white overflow-hidden hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] transition-all"
            >
              <div className="h-48 bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border-b-2 border-black dark:border-white relative overflow-hidden flex items-center justify-center">
                <Zap className="w-16 h-16 text-zinc-300 dark:text-zinc-800 group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-500" />
                
                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-black dark:text-white">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-400 dark:bg-emerald-600 text-black px-3 py-1 border-2 border-black dark:border-white">
                    {project.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-bold bg-white dark:bg-black px-3 py-1 border-2 border-black dark:border-white">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {project.likes}</span>
                    <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> {project.forks}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-black dark:bg-white border-2 border-black dark:border-white" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">@{project.author}</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest dark:text-white mb-2">{project.name}</h3>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-6 flex-1 line-clamp-3">
                  {project.description}
                </p>
                
                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={() => onPlayProject(project)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-400 hover:text-black dark:hover:bg-emerald-500 transition-colors"
                  >
                    <Play className="w-4 h-4" /> Play
                  </button>
                  <button 
                    onClick={() => onCloneProject(project)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  >
                    <Code2 className="w-4 h-4" /> Remix
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="flex justify-center pt-8 pb-16">
          <button className="flex items-center gap-2 px-8 py-4 bg-white dark:bg-black border-2 border-black dark:border-white text-sm font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors group">
            Load More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
