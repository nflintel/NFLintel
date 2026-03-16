import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Globe, Settings, Bot, Rocket, Activity, ExternalLink, Smartphone, Monitor } from 'lucide-react';
import { Project } from '../types';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, onSelectProject, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'deployments' | 'agents' | 'settings'>('overview');

  const handleToggleAgent = (projectId: string, currentStatus: boolean | undefined) => {
    onUpdateProject(projectId, { autoAiEnabled: !currentStatus });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-black dark:bg-white border-2 border-black dark:border-white">
              <LayoutDashboard className="w-8 h-8 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter dark:text-white leading-none">DASHBOARD</h1>
              <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-zinc-500">Manage your elite creations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-6 py-3 bg-emerald-400 dark:bg-emerald-600 text-black border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
              New Project
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 border-b-2 border-black dark:border-white no-scrollbar">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'deployments', icon: Rocket, label: 'Deployments' },
            { id: 'agents', icon: Bot, label: 'AI Agents' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] -translate-y-1' 
                  : 'bg-white dark:bg-black text-black dark:text-white hover:bg-white dark:bg-black dark:hover:bg-black dark:bg-zinc-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Projects', value: projects.length, icon: LayoutDashboard },
                  { label: 'Active Domains', value: projects.filter(p => p.domain).length, icon: Globe },
                  { label: 'AI Agents Running', value: projects.filter(p => p.autoAiEnabled).length, icon: Bot },
                  { label: 'Total Views', value: '12.4K', icon: Activity }
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-white dark:bg-black border-2 border-black dark:border-white flex items-center gap-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                    <div className="p-4 bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white">
                      <stat.icon className="w-6 h-6 text-black dark:text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-black dark:text-white leading-none mb-1">{stat.value}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Projects */}
              <div className="lg:col-span-2 bg-white dark:bg-black border-2 border-black dark:border-white p-6 md:p-8">
                <h3 className="text-xl font-black uppercase tracking-widest dark:text-white mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6" /> Recent Activity
                </h3>
                <div className="space-y-4">
                  {projects.slice(0, 5).map(project => (
                    <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all cursor-pointer gap-4" onClick={() => onSelectProject(project.id)}>
                      <div>
                        <h4 className="font-black uppercase tracking-widest dark:text-white text-lg">{project.name}</h4>
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {project.domain && <span className="px-3 py-1 bg-white dark:bg-black border-2 border-black dark:border-white text-black dark:text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Globe className="w-3 h-3" /> Live</span>}
                        {project.autoAiEnabled && <span className="px-3 py-1 bg-emerald-400 dark:bg-emerald-600 border-2 border-black dark:border-white text-black text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Bot className="w-3 h-3" /> AI Active</span>}
                        <ExternalLink className="w-5 h-5 text-black dark:text-white hidden sm:block" />
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                      <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">No projects yet. Start building!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-6 md:p-8">
                <h3 className="text-xl font-black uppercase tracking-widest dark:text-white mb-6">Quick Actions</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all group">
                    <span className="text-sm font-black uppercase tracking-widest dark:text-white">Connect Domain</span>
                    <Globe className="w-5 h-5 text-black dark:text-white" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all group">
                    <span className="text-sm font-black uppercase tracking-widest dark:text-white">Push to App Store</span>
                    <Smartphone className="w-5 h-5 text-black dark:text-white" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all group">
                    <span className="text-sm font-black uppercase tracking-widest dark:text-white">Configure AI Agents</span>
                    <Bot className="w-5 h-5 text-black dark:text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deployments' && (
            <div className="space-y-6">
              <div className="p-8 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Global Edge Network</h2>
                <p className="text-sm font-medium uppercase tracking-widest max-w-2xl mb-8 opacity-80">Deploy your apps instantly to a global edge network. Connect custom domains, manage SSL certificates, and push directly to mobile app stores.</p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-6 py-3 bg-white dark:bg-black text-black dark:text-white border-2 border-white dark:border-black text-xs font-bold uppercase tracking-widest hover:bg-transparent hover:text-white dark:hover:text-black transition-colors flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Connect Domain
                  </button>
                  <button className="px-6 py-3 bg-emerald-400 dark:bg-emerald-600 text-black border-2 border-emerald-400 dark:border-emerald-600 text-xs font-bold uppercase tracking-widest hover:bg-transparent hover:text-emerald-400 dark:hover:text-emerald-600 transition-colors flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> App Store Connect
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="p-6 bg-white dark:bg-black border-2 border-black dark:border-white flex flex-col md:flex-row items-center justify-between gap-6 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-widest dark:text-white mb-2">{project.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
                        <span className="flex items-center gap-1 bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 px-2 py-1 border-2 border-black dark:border-white text-black dark:text-white"><Monitor className="w-3 h-3" /> Web: {project.domain || 'Not configured'}</span>
                        <span className="flex items-center gap-1 bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 px-2 py-1 border-2 border-black dark:border-white text-black dark:text-white"><Smartphone className="w-3 h-3" /> iOS: {project.appStoreStatus || 'Unsubmitted'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                        Manage Domains
                      </button>
                      <button className="flex-1 md:flex-none px-6 py-3 bg-emerald-400 dark:bg-emerald-600 text-black border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                        Deploy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="p-8 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black">
                <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Autonomous AI Agents</h2>
                <p className="text-sm font-medium uppercase tracking-widest max-w-2xl opacity-80">Enable AI agents to constantly monitor, refactor, and improve your code in the background. They fix bugs, optimize performance, and suggest UI enhancements automatically.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="p-6 bg-white dark:bg-black border-2 border-black dark:border-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-widest dark:text-white mb-2">{project.name}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                        {project.autoAiEnabled 
                          ? 'Agent is actively monitoring and optimizing this project.' 
                          : 'Agent is currently paused.'}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleToggleAgent(project.id, project.autoAiEnabled)}
                      className={`relative inline-flex h-10 w-20 items-center border-2 border-black dark:border-white transition-colors focus:outline-none shrink-0 ${
                        project.autoAiEnabled ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-800'
                      }`}
                    >
                      <span className={`inline-block h-6 w-6 transform bg-black dark:bg-white transition-transform ${
                        project.autoAiEnabled ? 'translate-x-[42px]' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 md:p-8 bg-white dark:bg-black border-2 border-black dark:border-white">
              <h2 className="text-2xl font-black uppercase tracking-widest dark:text-white mb-8">Global Settings</h2>
              <div className="space-y-8 max-w-2xl">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Default Hosting Provider</label>
                  <select className="w-full bg-zinc-50 dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white px-4 py-4 text-sm font-bold uppercase tracking-widest focus:outline-none dark:text-white appearance-none cursor-pointer">
                    <option value="vercel">Vercel (Recommended)</option>
                    <option value="netlify">Netlify</option>
                    <option value="custom">Custom Server (MCP)</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-black dark:text-white">Model Context Protocol (MCP) URL</label>
                  <input type="url" placeholder="https://your-mcp-server.com" className="w-full bg-zinc-50 dark:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white px-4 py-4 text-sm font-bold focus:outline-none dark:text-white" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Connect your own backend infrastructure via MCP.</p>
                </div>

                <div className="pt-8 border-t-2 border-black dark:border-white">
                  <button className="px-8 py-4 bg-emerald-400 dark:bg-emerald-600 text-black border-2 border-black dark:border-white text-xs font-black uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-all">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
};
