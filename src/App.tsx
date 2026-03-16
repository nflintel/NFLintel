import React, { useState, useRef } from 'react';
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
import { Code2, Play, MessageSquare, Layers, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { useDebounce } from './hooks/useDebounce';

type MobileTab = 'editor' | 'preview' | 'chat' | 'toolbox' | 'security';

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
    updateProjectSharing
  } = useProjects(token);

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'php' | 'react' | 'md'>('html');
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
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
              // Clean up URL
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
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#3b82f6', '#000000'] });
    setMobileTab('preview');
  };

  const handleInsertComponent = (html: string) => {
    const currentHtml = activeProject.code.html;
    let updatedHtml = currentHtml;
    if (currentHtml.includes('</body>')) updatedHtml = currentHtml.replace('</body>', `  ${html}\n</body>`);
    else if (currentHtml.includes('</html>')) updatedHtml = currentHtml.replace('</html>', `  ${html}\n</html>`);
    else updatedHtml = currentHtml + '\n' + html;

    updateActiveProjectCode({ html: updatedHtml });
    setActiveTab('html');
    setMobileTab('editor');
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleUploadAsset = (asset: Omit<ProjectAsset, 'id'>) => {
    const newAsset = { ...asset, id: Math.random().toString(36).substr(2, 9) };
    updateActiveProjectCode({ assets: [...(activeProject.assets || []), newAsset] } as any);
    confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 }, colors: ['#3b82f6'] });
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
    setMobileTab('preview');
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
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#10b981'] });
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
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: ['#3b82f6', '#ffffff'] });
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
    
    // Optimistic update
    const updatedVulnerabilities = (activeProject.vulnerabilities || []).map(v => 
      v.id === vulnerabilityId ? { ...v, status: 'remediating' as const } : v
    );
    // Update local state (simulated)
    
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
        const fixedVulnerability = await res.json();
        // Refresh project to get updated code and vulnerability status
        window.location.reload(); 
      }
    } catch (err) {
      console.error('Remediation error:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
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
        onToggleSecurity={() => setShowSecurity(!showSecurity)}
        showSecurity={showSecurity}
        onOpenShare={() => {
          if (!token) {
            alert('Please sign in to share projects');
            setIsAuthOpen(true);
            return;
          }
          setIsShareOpen(true);
        }}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl">
          <FileExplorer 
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={setActiveProjectId}
            onCreateProject={createProject}
            onDeleteProject={deleteProject}
            onRenameProject={renameProject}
            onRestoreVersion={(updatedProject) => {
              setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            }}
            token={token}
          />
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <TasksPanel
              project={activeProject}
              token={token}
              onUpdateProject={(updatedProject) => {
                setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
              }}
            />
            <GitPanel 
              project={activeProject} 
              token={token} 
              onRestoreCommit={(updatedProject) => {
                setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
              }}
            />
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
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {showSecurity ? (
              <div className="flex-1 overflow-hidden">
                <SecurityDashboard 
                  project={activeProject}
                  onScan={handleSecurityScan}
                  onRemediate={handleRemediate}
                  isScanning={isScanning}
                />
              </div>
            ) : (
              <>
                {/* Editor Section */}
                <AnimatePresence mode="wait">
              {(mobileTab === 'editor' || window.innerWidth >= 1024) && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 ${mobileTab !== 'editor' ? 'hidden lg:flex' : 'flex'}`}
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar">
                      {(['html', 'css', 'js', 'php', 'react', 'md'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            activeTab === tab 
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {tab.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setMobileTab('preview')}
                        className="lg:hidden p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-full transition-colors"
                      >
                        <Play size={18} fill="currentColor" />
                      </button>
                    </div>
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview Section */}
            <AnimatePresence mode="wait">
              {(mobileTab === 'preview' || window.innerWidth >= 1024) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 ${mobileTab !== 'preview' ? 'hidden lg:flex' : 'flex'}`}
                >
                  <Preview 
                    html={debouncedCode.html}
                    css={debouncedCode.css}
                    js={debouncedCode.js}
                    react={debouncedCode.react}
                    md={debouncedCode.md}
                    activeTab={activeTab}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

          {/* Chat Section (Desktop Bottom) */}
          <div className="hidden lg:block h-80 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <Chat 
              onCodeGenerated={handleAICodeGenerated} 
              currentCode={activeProject.code} 
              theme={theme}
              assets={activeProject.assets || []}
            />
          </div>
        </div>

        {/* Chat Section (Mobile Overlay) */}
        <AnimatePresence>
          {mobileTab === 'chat' && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageSquare size={18} className="text-emerald-500" />
                  AI Assistant
                </h3>
                <button onClick={() => setMobileTab('editor')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <Code2 size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat 
                  onCodeGenerated={handleAICodeGenerated} 
                  currentCode={activeProject.code} 
                  theme={theme}
                  assets={activeProject.assets || []}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbox Section (Mobile Overlay) */}
        <AnimatePresence>
          {mobileTab === 'toolbox' && (
            <motion.div 
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold flex items-center gap-2">
                  <Layers size={18} className="text-emerald-500" />
                  Toolbox
                </h3>
                <button onClick={() => setMobileTab('editor')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <Code2 size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <FileExplorer 
                  projects={projects}
                  activeProjectId={activeProjectId}
                  onSelectProject={setActiveProjectId}
                  onCreateProject={createProject}
                  onDeleteProject={deleteProject}
                  onRenameProject={renameProject}
                  onRestoreVersion={(updatedProject) => {
                    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                  }}
                  token={token}
                />
                <TasksPanel
                  project={activeProject}
                  token={token}
                  onUpdateProject={(updatedProject) => {
                    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                  }}
                />
                <GitPanel 
                  project={activeProject} 
                  token={token} 
                  onRestoreCommit={(updatedProject) => {
                    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
                  }}
                />
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
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="lg:hidden flex items-center justify-around h-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 pb-safe">
        <button 
          onClick={() => setMobileTab('editor')}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'editor' ? 'text-emerald-500' : 'text-slate-400'}`}
        >
          <Code2 size={20} />
          <span className="text-[10px] font-medium">Editor</span>
        </button>
        <button 
          onClick={() => setMobileTab('preview')}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'preview' ? 'text-emerald-500' : 'text-slate-400'}`}
        >
          <Play size={20} />
          <span className="text-[10px] font-medium">Preview</span>
        </button>
        <button 
          onClick={() => { setMobileTab('security'); setShowSecurity(true); }}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'security' ? 'text-emerald-500' : 'text-slate-400'}`}
        >
          <Shield size={20} />
          <span className="text-[10px] font-medium">Security</span>
        </button>
        <button 
          onClick={() => { setMobileTab('chat'); setShowSecurity(false); }}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'chat' ? 'text-emerald-500' : 'text-slate-400'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-medium">Chat</span>
        </button>
        <button 
          onClick={() => setMobileTab('toolbox')}
          className={`flex flex-col items-center gap-1 transition-colors ${mobileTab === 'toolbox' ? 'text-emerald-500' : 'text-slate-400'}`}
        >
          <Layers size={20} />
          <span className="text-[10px] font-medium">Tools</span>
        </button>
      </nav>

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
