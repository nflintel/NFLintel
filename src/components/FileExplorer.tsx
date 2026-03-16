import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  ChevronRight, 
  ChevronDown,
  FileCode,
  MoreVertical,
  History,
  RotateCcw,
  GitBranch,
  DownloadCloud
} from 'lucide-react';
import { Project, ProjectVersion } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileExplorerProps {
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description?: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string, description?: string) => void;
  onRestoreVersion?: (project: Project) => void;
  token: string | null;
  onRefreshProjects?: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onRestoreVersion,
  token,
  onRefreshProjects
}) => {
  const [isScrapesExpanded, setIsScrapesExpanded] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [viewingHistoryFor, setViewingHistoryFor] = useState<string | null>(null);
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
  const [gitCommits, setGitCommits] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [scrapes, setScrapes] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (token && isScrapesExpanded) {
      fetchScrapes();
    }
  }, [token, isScrapesExpanded]);

  const fetchScrapes = async () => {
    try {
      const res = await fetch('/api/scrapes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScrapes(data);
      }
    } catch (err) {
      console.error('Failed to fetch scrapes:', err);
    }
  };

  const handleImportScrape = async (filename: string) => {
    if (!token || isImporting) return;
    setIsImporting(true);
    try {
      const res = await fetch('/api/scrapes/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ filename })
      });
      if (res.ok) {
        const newProject = await res.json();
        onSelectProject(newProject.id);
        window.location.reload(); // Quick way to refresh project list
      }
    } catch (err) {
      console.error('Failed to import scrape:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName, newProjectDescription);
    setNewProjectName('');
    setNewProjectDescription('');
    setIsCreating(false);
  };

  const handleRename = (id: string) => {
    if (!editingName.trim()) return;
    onRenameProject(id, editingName, editingDescription);
    setEditingProjectId(null);
    setEditingName('');
    setEditingDescription('');
  };

  const handleFetchVersions = async (projectId: string) => {
    if (!token) return;
    setViewingHistoryFor(projectId === viewingHistoryFor ? null : projectId);
    if (projectId !== viewingHistoryFor) {
      setIsLoadingVersions(true);
      setProjectVersions([]);
      setGitCommits([]);
      try {
        // Fetch snapshots
        const res = await fetch(`/api/projects/${projectId}/versions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setProjectVersions(data);
        }

        // Fetch git log
        const gitRes = await fetch(`/api/projects/${projectId}/git/log`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (gitRes.ok) {
          const gitData = await gitRes.json();
          setGitCommits(gitData);
        }
      } catch (err) {
        console.error('Failed to fetch versions:', err);
      } finally {
        setIsLoadingVersions(false);
      }
    }
  };

  const handleRestoreVersion = async (projectId: string, versionId: string, isGit: boolean = false) => {
    if (!token) return;
    if (!confirm(`Restore this ${isGit ? 'commit' : 'version'}? Current unsaved changes will be saved as a new version.`)) return;

    try {
      const endpoint = isGit ? `/api/projects/${projectId}/git/restore` : `/api/projects/${projectId}/restore`;
      const body = isGit ? { commitId: versionId } : { versionId };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const updatedProject = await res.json();
        if (onRestoreVersion) {
          onRestoreVersion(updatedProject);
        } else {
          window.location.reload(); 
        }
      }
    } catch (err) {
      console.error('Restore error:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Explorer</span>
        </div>
        <div className="flex items-center gap-1">
          {onRefreshProjects && (
            <button 
              onClick={onRefreshProjects}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-emerald-500"
              title="Refresh Projects"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-emerald-500"
            title="New Project"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
              {isCreating && (
                <div className="px-2 py-1">
                  <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <FileCode size={14} className="text-emerald-500 shrink-0" />
                      <input 
                        autoFocus
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        placeholder="Project name..."
                        className="bg-transparent text-xs w-full focus:outline-none dark:text-white font-medium"
                      />
                    </div>
                    <input 
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="Description (optional)..."
                      className="bg-transparent text-[10px] w-full focus:outline-none text-slate-500 dark:text-slate-400 pl-6"
                    />
                    <div className="flex justify-end gap-1 mt-1">
                      <button onClick={handleCreate} className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {projects.map(project => (
                <div key={project.id} className="group">
                  <div 
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all",
                      activeProjectId === project.id 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                    )}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <FileCode size={14} className={cn(activeProjectId === project.id ? "text-emerald-500" : "text-slate-400")} />
                      {editingProjectId === project.id ? (
                        <div className="flex flex-col gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input 
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                            className="bg-white dark:bg-slate-800 text-xs px-1 rounded border border-emerald-500 focus:outline-none w-full dark:text-white"
                            placeholder="Project name"
                          />
                          <input 
                            value={editingDescription}
                            onChange={(e) => setEditingDescription(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                            className="bg-white dark:bg-slate-800 text-[10px] px-1 rounded border border-emerald-500 focus:outline-none w-full dark:text-white"
                            placeholder="Description (optional)"
                          />
                          <div className="flex gap-1">
                            <button onClick={() => handleRename(project.id)} className="text-emerald-500 hover:bg-emerald-500/10 p-0.5 rounded">
                              <Check size={12} />
                            </button>
                            <button onClick={() => setEditingProjectId(null)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 rounded">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-medium truncate">{project.name}</span>
                          {project.description && (
                            <span 
                              className="text-[10px] truncate opacity-70"
                              dangerouslySetInnerHTML={{ __html: project.description }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProjectId(project.id);
                          setEditingName(project.name);
                          setEditingDescription(project.description || '');
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      {token && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFetchVersions(project.id);
                          }}
                          className={cn(
                            "p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400",
                            viewingHistoryFor === project.id && "text-emerald-500"
                          )}
                          title="History"
                        >
                          <History size={12} />
                        </button>
                      )}
                      {projects.length > 1 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete project "${project.name}"?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="p-1 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Versions Dropdown */}
                  <AnimatePresence>
                    {viewingHistoryFor === project.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-6 mt-1 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-2"
                      >
                        {isLoadingVersions ? (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 py-1">
                            <RotateCcw size={10} className="animate-spin" />
                            <span>Loading history...</span>
                          </div>
                        ) : (gitCommits.length > 0 || projectVersions.length > 0) ? (
                          <div className="space-y-2">
                            {/* Git Commits */}
                            {gitCommits.map((commit) => (
                              <div 
                                key={commit.oid}
                                className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30 group/version"
                              >
                                <div className="flex flex-col overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    <GitBranch size={8} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold dark:text-slate-300 truncate">
                                      {commit.commit.message.split('\n')[0]}
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-slate-400">
                                    {new Date(commit.commit.author.timestamp * 1000).toLocaleString()} • {commit.oid.substring(0, 7)}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => handleRestoreVersion(project.id, commit.oid, true)}
                                  className="p-1 opacity-0 group-hover/version:opacity-100 hover:bg-emerald-500/10 text-emerald-500 rounded transition-all"
                                  title="Restore Commit"
                                >
                                  <RotateCcw size={10} />
                                </button>
                              </div>
                            ))}

                            {/* Snapshots */}
                            {projectVersions.slice().reverse().map((version, idx) => (
                              <div 
                                key={version.id}
                                className="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/30 group/version"
                              >
                                <div className="flex flex-col overflow-hidden">
                                  <div className="flex items-center gap-1">
                                    <History size={8} className="text-slate-400" />
                                    <span className="text-[10px] font-medium dark:text-slate-300 truncate">
                                      {version.message || `Snapshot v${projectVersions.length - idx}`}
                                    </span>
                                  </div>
                                  <span className="text-[8px] text-slate-400">
                                    {new Date(version.updatedAt).toLocaleString()}
                                  </span>
                                </div>
                                <button 
                                  onClick={() => handleRestoreVersion(project.id, version.id, false)}
                                  className="p-1 opacity-0 group-hover/version:opacity-100 hover:bg-emerald-500/10 text-emerald-500 rounded transition-all"
                                  title="Restore Snapshot"
                                >
                                  <RotateCcw size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic py-1">No history</span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <button
                onClick={() => setIsCreating(true)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-xs font-medium"
              >
                <Plus size={14} />
                New Project
              </button>
            </div>

      {/* Scrapes Section */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-200 dark:border-slate-800"
        onClick={() => setIsScrapesExpanded(!isScrapesExpanded)}
      >
        <div className="flex items-center gap-2">
          {isScrapesExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Scraped Sites</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            fetchScrapes();
            setIsScrapesExpanded(true);
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-emerald-500"
          title="Refresh Scrapes"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      <AnimatePresence>
        {isScrapesExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-4 space-y-1">
              {scrapes.length === 0 ? (
                <div className="px-3 py-2 text-xs text-slate-400 italic">
                  No scraped sites found. Run the scraper script to generate data.
                </div>
              ) : (
                scrapes.map((scrape, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 group transition-all"
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <DownloadCloud size={14} className="text-slate-400" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-medium truncate">{scrape.name}</span>
                        <span className="text-[8px] text-slate-400">{new Date(scrape.time).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleImportScrape(scrape.filename)}
                      disabled={isImporting}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-emerald-500/10 text-emerald-500 rounded transition-all disabled:opacity-50"
                      title="Import as Project"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
