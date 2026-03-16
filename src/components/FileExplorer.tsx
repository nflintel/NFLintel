import React, { useState } from 'react';
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
  GitBranch
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
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onRestoreVersion?: (project: Project) => void;
  token: string | null;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
  onRestoreVersion,
  token
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [viewingHistoryFor, setViewingHistoryFor] = useState<string | null>(null);
  const [projectVersions, setProjectVersions] = useState<ProjectVersion[]>([]);
  const [gitCommits, setGitCommits] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName);
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleRename = (id: string) => {
    if (!editingName.trim()) return;
    onRenameProject(id, editingName);
    setEditingProjectId(null);
    setEditingName('');
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
    <div className="flex flex-col h-full border-b border-slate-200 dark:border-slate-800">
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Explorer</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsCreating(true);
            setIsExpanded(true);
          }}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-emerald-500"
          title="New Project"
        >
          <Plus size={16} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-4 space-y-1">
              {isCreating && (
                <div className="px-2 py-1">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-emerald-500/50 rounded-lg p-1">
                    <FileCode size={14} className="text-emerald-500 shrink-0" />
                    <input 
                      autoFocus
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      onBlur={() => !newProjectName && setIsCreating(false)}
                      placeholder="Project name..."
                      className="bg-transparent text-xs w-full focus:outline-none dark:text-white"
                    />
                    <button onClick={handleCreate} className="text-emerald-500 hover:bg-emerald-500/10 p-1 rounded">
                      <Check size={12} />
                    </button>
                    <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                      <X size={12} />
                    </button>
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
                        <input 
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => handleRename(project.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(project.id)}
                          className="bg-white dark:bg-slate-800 text-xs px-1 rounded border border-emerald-500 focus:outline-none w-full dark:text-white"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-xs font-medium truncate">{project.name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProjectId(project.id);
                          setEditingName(project.name);
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
