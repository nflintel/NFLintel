import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from './components/Header';
import { Toolbox } from './components/Toolbox';
import { Chat } from './components/Chat';
import { CodeEditor, CodeEditorHandle } from './components/CodeEditor';
import { Preview } from './components/Preview';
import { Profile } from './components/Profile';
import { ThemeModal } from './components/ThemeModal';
import { AuthModal } from './components/AuthModal';
import { SearchModal } from './components/SearchModal';
import { SecurityDashboard } from './components/SecurityDashboard';
import { ShareModal } from './components/ShareModal';
import { FileExplorer } from './components/FileExplorer';
import { GitPanel } from './components/GitPanel';
import { TasksPanel } from './components/TasksPanel';
import { CodeState, ProjectAsset, ThemeConfig, Vulnerability } from './types';
import { Code2, Play, MessageSquare, Layers, Shield, Folder, CheckSquare, GitBranch, Wrench, X, Share2, Search, User, Sun, Moon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { useDebounce } from './hooks/useDebounce';
import { cn } from './lib/utils';

import { Explore } from './components/Explore';
import { Dashboard } from './components/Dashboard';

type MainView = 'editor' | 'explore' | 'dashboard' | 'profile';
type ActiveOverlay = 'none' | 'menu' | 'files' | 'tasks' | 'git' | 'toolbox' | 'security' | 'chat';

const MenuButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
    <Icon size={32} strokeWidth={1.5} />
    <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
  </button>
);

const OverlayWrapper = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 20 }}
    className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col"
  >
    <div className="h-16 border-b-2 border-black dark:border-white flex items-center justify-between px-4 shrink-0">
      <h2 className="font-bold uppercase tracking-widest">{title}</h2>
      <button onClick={onClose} className="w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
        <X size={20} />
      </button>
    </div>
    <div className="flex-1 overflow-hidden flex flex-col">
      {children}
    </div>
  </motion.div>
);

export default function App() {
  const { theme, toggleTheme, themeConfig, setThemeConfig } = useTheme();
  const { user, setUser, token, login, logout } = useAuth();
  const { 
    projects, 
    setProjects,
    activeProjectId, 
    setActiveProjectId, 
    activeProject, 
    updateActiveProjectCode,
    createProject,
    deleteProject,
    renameProject,
    updateProjectSharing,
    refreshProjects
  } = useProjects(token);

  const [mainView, setMainView] = useState<MainView>('editor');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'php' | 'react' | 'md'>('html');
  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>('none');
  const [showPreviewOnMobile, setShowPreviewOnMobile] = useState(false);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle share links
  React.useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const shareId = path.split('/').pop();
      if (shareId) {
        const loadShared = async () => {
          try {
            const res = await fetch(`/api/projects/${shareId}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
              const sharedProject = await res.json();
              setProjects(prev => {
                if (prev.find(p => p.id === sharedProject.id)) return prev;
                return [...prev, sharedProject];
              });
              setActiveProjectId(sharedProject.id);
              window.history.replaceState({}, '', '/');
            }
          } catch (err) {
            console.error('Failed to load shared project:', err);
          }
        };
        loadShared();
      }
    }
  }, [token, setProjects, setActiveProjectId]);

  const editorRef = useRef<CodeEditorHandle>(null);
  const debouncedCode = useDebounce(activeProject.code, 300);

  const handleAICodeGenerated = (newCode: string, lang?: string) => {
    if (newCode.includes('<!DOCTYPE html>')) {
      const htmlMatch = newCode.match(/<html[\s\S]*?<\/html>/i);
      if (htmlMatch) updateActiveProjectCode({ html: htmlMatch[0] });
    } else if (lang && lang !== 'all') {
      updateActiveProjectCode({ [lang]: newCode });
      setActiveTab(lang as any);
    } else {
      updateActiveProjectCode({ [activeTab]: newCode });
    }
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#000000', '#ffffff'] });
    setShowPreviewOnMobile(true);
    setActiveOverlay('none');
  };

  const handleInsertComponent = (html: string) => {
    const currentHtml = activeProject.code.html;
    let updatedHtml = currentHtml;
    if (currentHtml.includes('</body>')) updatedHtml = currentHtml.replace('</body>', `  ${html}\n</body>`);
    else if (currentHtml.includes('</html>')) updatedHtml = currentHtml.replace('</html>', `  ${html}\n</html>`);
    else updatedHtml = currentHtml + '\n' + html;

    updateActiveProjectCode({ html: updatedHtml });
    setActiveTab('html');
    setActiveOverlay('none');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleUploadAsset = (asset: Omit<ProjectAsset, 'id'>) => {
    const newAsset = { ...asset, id: Math.random().toString(36).substr(2, 9) };
    updateActiveProjectCode({ assets: [...(activeProject.assets || []), newAsset] } as any);
    confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
  };

  const handleDeleteAsset = async (assetId: string) => {
    const asset = activeProject.assets?.find(a => a.id === assetId);
    if (asset && token) {
      try {
        const filename = asset.data.split('/').pop();
        if (filename) await fetch(`/api/upload/${filename}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      } catch (err) { console.error(err); }
    }
    updateActiveProjectCode({ assets: (activeProject.assets || []).filter(a => a.id !== assetId) } as any);
  };

  const handleSelectProjectFromSearch = async (id: string) => {
    setActiveProjectId(id);
    setIsSearchOpen(false);
  };

  const handleRun = () => {
    setShowPreviewOnMobile(true);
    confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSave = async () => {
    if (!activeProject) return;
    
    if (!token) {
      alert('Please sign in to save projects to the cloud');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...activeProject,
          updatedAt: Date.now(),
          createVersion: true
        })
      });

      if (!res.ok) throw new Error('Failed to save project');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save project to the cloud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveThemeConfig = (config: ThemeConfig) => {
    setThemeConfig(config);
    setIsThemeModalOpen(false);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: [config.primaryColor, '#000000'] });
  };

  const handleAuthSuccess = (newToken: string, userData: any) => {
    login(newToken, userData);
    setIsAuthOpen(false);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
  };

  const handleSecurityScan = async () => {
    if (!token) return;
    setIsScanning(true);
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const vulnerabilities = await res.json();
        const updatedProjects = projects.map(p => 
          p.id === activeProjectId ? { ...p, vulnerabilities } : p
        );
        setProjects(updatedProjects);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemediate = async (vulnerabilityId: string) => {
    if (!token) return;
    
    try {
      const res = await fetch(`/api/projects/${activeProjectId}/remediate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vulnerabilityId })
      });
      
      if (res.ok) {
        window.location.reload(); 
      }
    } catch (err) {
      console.error('Remediation error:', err);
    }
  };

  const getDynamicSeo = () => {
    const stripHtml = (html: string) => {
      const tmp = document.createElement('DIV');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    };

    let title = activeProject.name ? `${activeProject.name} - Dirtnapp` : 'Dirtnapp';
    let description = activeProject.description 
      ? stripHtml(activeProject.description) 
      : 'Create and edit your projects with AI.';

    try {
      const html = activeProject.code?.html || '';
      const md = activeProject.code?.md || '';

      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1].trim()) {
        title = `${titleMatch[1].trim()} - Dirtnapp`;
      } else {
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
        if (h1Match && h1Match[1].trim()) {
          title = `${h1Match[1].trim()} - Dirtnapp`;
        } else if (md) {
          const mdTitleMatch = md.match(/^#\s+(.+)$/m);
          if (mdTitleMatch && mdTitleMatch[1].trim()) {
            title = `${mdTitleMatch[1].trim()} - Dirtnapp`;
          }
        }
      }

      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
      if (descMatch && descMatch[1].trim()) {
        description = descMatch[1].trim();
      } else {
        const pMatch = html.match(/<p[^>]*>([^<]+)<\/p>/i);
        if (pMatch && pMatch[1].trim()) {
          const pText = pMatch[1].trim();
          description = pText.length > 150 ? pText.substring(0, 147) + '...' : pText;
        } else if (md) {
          const mdLines = md.split('\n');
          const pLine = mdLines.find(line => line.trim().length > 0 && !line.trim().startsWith('#'));
          if (pLine) {
            const pText = pLine.trim();
            description = pText.length > 150 ? pText.substring(0, 147) + '...' : pText;
          }
        }
      }
    } catch (e) {
      console.error("Error generating dynamic SEO", e);
    }

    return { title, description };
  };

  const seo = React.useMemo(() => getDynamicSeo(), [activeProject.name, activeProject.description, activeProject.code]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950 text-black dark:text-white font-sans antialiased selection:bg-black/10 dark:selection:bg-white/10">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
      </Helmet>
      
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenTheme={() => setIsThemeModalOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        user={user}
        activeProjectName={activeProject.name}
        onRun={handleRun}
        onSave={handleSave}
        isSaving={isSaving}
        onToggleSecurity={() => setActiveOverlay('security')}
        showSecurity={activeOverlay === 'security'}
        onOpenShare={() => {
          if (!token) {
            alert('Please sign in to share projects');
            setIsAuthOpen(true);
            return;
          }
          setIsShareOpen(true);
        }}
        mainView={mainView}
        setMainView={setMainView}
        onOpenMenu={() => setActiveOverlay('menu')}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {mainView === 'explore' && (
          <Explore 
            onCloneProject={(project) => {
              createProject(project.name + ' (Remix)', project.description, project.code);
              setMainView('editor');
            }}
            onPlayProject={(project) => {
              setActiveProjectId(project.id);
              setMainView('editor');
            }}
          />
        )}

        {mainView === 'dashboard' && (
          <Dashboard 
            projects={projects}
            onSelectProject={(id) => {
              setActiveProjectId(id);
              setMainView('editor');
            }}
            onUpdateProject={(id, updates) => {
              setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            }}
          />
        )}

        {mainView === 'editor' && (
          <div className="flex-1 flex flex-col lg:flex-row w-full">
            {/* Editor Section */}
            <div className={cn("flex-1 flex flex-col border-r-2 border-black dark:border-white", showPreviewOnMobile ? "hidden lg:flex" : "flex")}>
               <div className="flex items-center justify-between border-b-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 overflow-x-auto no-scrollbar shrink-0">
                 <div className="flex">
                   {(['html', 'css', 'js', 'php', 'react', 'md'] as const).map(tab => (
                     <button
                       key={tab}
                       onClick={() => setActiveTab(tab)}
                       className={cn(
                         "px-4 py-2 text-xs font-bold uppercase tracking-widest border-r-2 border-black dark:border-white transition-colors",
                         activeTab === tab ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
                       )}
                     >
                       {tab}
                     </button>
                   ))}
                 </div>
                 <button onClick={() => setShowPreviewOnMobile(true)} className="lg:hidden px-4 py-2 border-l-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0">
                   <Play size={16} />
                 </button>
               </div>
               <div className="flex-1 relative">
                 <CodeEditor 
                   ref={editorRef}
                   language={activeTab === 'js' || activeTab === 'react' ? 'javascript' : activeTab === 'md' ? 'markdown' : activeTab}
                   value={activeProject.code[activeTab]}
                   onChange={(val) => updateActiveProjectCode({ [activeTab]: val || '' })}
                   theme={theme}
                 />
               </div>
            </div>

            {/* Preview Section */}
            <div className={cn("flex-1 flex flex-col", !showPreviewOnMobile ? "hidden lg:flex" : "flex")}>
               <div className="flex items-center justify-between border-b-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900 px-4 py-2 shrink-0">
                 <span className="text-xs font-bold uppercase tracking-widest">Preview</span>
                 <button onClick={() => setShowPreviewOnMobile(false)} className="lg:hidden hover:text-emerald-500 transition-colors">
                   <Code2 size={16} />
                 </button>
               </div>
               <div className="flex-1 bg-white dark:bg-black dark:bg-zinc-900 overflow-hidden">
                 <Preview 
                   html={debouncedCode.html}
                   css={debouncedCode.css}
                   js={debouncedCode.js}
                   react={debouncedCode.react}
                   md={debouncedCode.md}
                   activeTab={activeTab}
                 />
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {activeOverlay === 'menu' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col"
          >
            <div className="h-16 border-b-2 border-black dark:border-white flex items-center justify-between px-4 shrink-0">
              <h2 className="font-bold uppercase tracking-widest">Menu</h2>
              <button onClick={() => setActiveOverlay('none')} className="w-10 h-10 flex items-center justify-center border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 content-start">
              <MenuButton icon={Folder} label="Files" onClick={() => setActiveOverlay('files')} />
              <MenuButton icon={MessageSquare} label="AI Chat" onClick={() => setActiveOverlay('chat')} />
              <MenuButton icon={Layers} label="Toolbox" onClick={() => setActiveOverlay('toolbox')} />
              <MenuButton icon={GitBranch} label="Git" onClick={() => setActiveOverlay('git')} />
              <MenuButton icon={CheckSquare} label="Tasks" onClick={() => setActiveOverlay('tasks')} />
              <MenuButton icon={Shield} label="Security" onClick={() => setActiveOverlay('security')} />
              <MenuButton icon={User} label="Profile" onClick={() => { setIsProfileOpen(true); setActiveOverlay('none'); }} />
              <MenuButton icon={theme === 'dark' ? Sun : Moon} label="Theme" onClick={() => { toggleTheme(); setActiveOverlay('none'); }} />
              <MenuButton icon={Share2} label="Share" onClick={() => { setIsShareOpen(true); setActiveOverlay('none'); }} />
              <MenuButton icon={Search} label="Search" onClick={() => { setIsSearchOpen(true); setActiveOverlay('none'); }} />
            </div>
          </motion.div>
        )}

        {activeOverlay === 'files' && (
           <OverlayWrapper title="Files" onClose={() => setActiveOverlay('menu')}>
             <div className="flex-1 overflow-y-auto">
               <FileExplorer 
                 projects={projects}
                 activeProjectId={activeProjectId}
                 onSelectProject={(id) => { setActiveProjectId(id); setActiveOverlay('none'); }}
                 onCreateProject={createProject}
                 onDeleteProject={deleteProject}
                 onRenameProject={renameProject}
                 onRestoreVersion={(updatedProject) => {
                   setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                 }}
                 token={token}
                 onRefreshProjects={refreshProjects}
               />
             </div>
           </OverlayWrapper>
        )}
        {activeOverlay === 'chat' && (
           <OverlayWrapper title="AI Chat" onClose={() => setActiveOverlay('menu')}>
             <Chat 
               onCodeGenerated={handleAICodeGenerated} 
               currentCode={activeProject.code} 
               theme={theme}
               assets={activeProject.assets || []}
             />
           </OverlayWrapper>
        )}
        {activeOverlay === 'toolbox' && (
           <OverlayWrapper title="Toolbox" onClose={() => setActiveOverlay('menu')}>
             <div className="flex-1 overflow-y-auto">
               <Toolbox 
                 onInsertComponent={handleInsertComponent}
                 projects={projects}
                 activeProjectId={activeProjectId}
                 onSelectProject={setActiveProjectId}
                 assets={activeProject.assets || []}
                 onUploadAsset={handleUploadAsset}
                 onDeleteAsset={handleDeleteAsset}
                 token={token}
               />
             </div>
           </OverlayWrapper>
        )}
        {activeOverlay === 'git' && (
           <OverlayWrapper title="Source Control" onClose={() => setActiveOverlay('menu')}>
             <div className="flex-1 overflow-y-auto">
               <GitPanel 
                 project={activeProject} 
                 token={token} 
                 onRestoreCommit={(updatedProject) => {
                   setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                 }}
               />
             </div>
           </OverlayWrapper>
        )}
        {activeOverlay === 'tasks' && (
           <OverlayWrapper title="Tasks" onClose={() => setActiveOverlay('menu')}>
             <div className="flex-1 overflow-y-auto">
               <TasksPanel
                 project={activeProject}
                 token={token}
                 onUpdateProject={(updatedProject) => {
                   setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                 }}
               />
             </div>
           </OverlayWrapper>
        )}
        {activeOverlay === 'security' && (
           <OverlayWrapper title="Security" onClose={() => setActiveOverlay('menu')}>
             <div className="flex-1 overflow-y-auto">
               <SecurityDashboard 
                 project={activeProject}
                 onScan={handleSecurityScan}
                 onRemediate={handleRemediate}
                 isScanning={isScanning}
               />
             </div>
           </OverlayWrapper>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isProfileOpen && user && (
          <Profile 
            user={user} 
            onClose={() => setIsProfileOpen(false)} 
            onSave={(u) => { setUser(u); setIsProfileOpen(false); }}
            onLogout={() => { logout(); setIsProfileOpen(false); }}
          />
        )}
        {isThemeModalOpen && (
          <ThemeModal 
            isOpen={isThemeModalOpen}
            config={themeConfig} 
            onClose={() => setIsThemeModalOpen(false)} 
            onSave={handleSaveThemeConfig}
          />
        )}
        {isAuthOpen && (
          <AuthModal 
            onClose={() => setIsAuthOpen(false)} 
            onSuccess={handleAuthSuccess}
          />
        )}
        {isSearchOpen && (
          <SearchModal 
            onClose={() => setIsSearchOpen(false)}
            onSelectProject={handleSelectProjectFromSearch}
          />
        )}
        {isShareOpen && (
          <ShareModal 
            project={activeProject}
            user={user}
            onClose={() => setIsShareOpen(false)}
            onUpdateSharing={(updates) => updateProjectSharing(activeProject.id, updates)}
            appUrl={window.location.origin}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
