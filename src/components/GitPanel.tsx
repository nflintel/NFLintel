import React, { useState, useEffect } from 'react';
import { GitBranch, GitCommit, Plus, Check, RotateCcw, RefreshCw, ChevronDown, ChevronRight, UploadCloud, DownloadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

interface GitPanelProps {
  project: Project;
  token: string | null;
  onRestoreCommit?: (project: Project) => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({ project, token, onRestoreCommit }) => {
  const [isRepo, setIsRepo] = useState(false);
  const [changes, setChanges] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showRemoteForm, setShowRemoteForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let currentIsRepo = isRepo;
      if (res.ok) {
        const data = await res.json();
        setIsRepo(data.isRepo);
        currentIsRepo = data.isRepo;
        setChanges(data.changes || []);
      }
      
      if (currentIsRepo) {
        // Fetch log
        const logRes = await fetch(`/api/projects/${project.id}/git/log`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (logRes.ok) {
          const logData = await logRes.json();
          setCommits(logData);
        }

        // Fetch remote URL
        const remoteRes = await fetch(`/api/projects/${project.id}/git/remote`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (remoteRes.ok) {
          const remoteData = await remoteRes.json();
          if (remoteData.url) setRemoteUrl(remoteData.url);
        }
      }
    } catch (err) {
      console.error('Git status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRemote = async () => {
    if (!token || !remoteUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ remoteUrl })
      });
      if (res.ok) {
        // Success
      } else {
        const data = await res.json();
        setError(`Failed to save remote: ${data.error}`);
      }
    } catch (err) {
      console.error('Git config error:', err);
      setError('Failed to save remote');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [project.id, project.updatedAt, token]);

  const handleInit = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/init`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsRepo(true);
        fetchStatus();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to initialize repository');
      }
    } catch (err) {
      console.error('Git init error:', err);
      setError('Failed to initialize repository');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async () => {
    if (!token || !remoteUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/clone`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ url: remoteUrl, username, password })
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setIsRepo(true);
        fetchStatus();
        if (onRestoreCommit) {
          onRestoreCommit(updatedProject);
        } else {
          window.location.reload();
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Clone failed');
      }
    } catch (err) {
      console.error('Git clone error:', err);
      setError('Clone failed. Please check your URL and credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !commitMessage.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/commit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          message: commitMessage,
          code: project.code
        })
      });
      if (res.ok) {
        setCommitMessage('');
        fetchStatus();
      } else {
        const data = await res.json();
        setError(data.error || 'Commit failed');
      }
    } catch (err) {
      console.error('Git commit error:', err);
      setError('Commit failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!token || !remoteUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/push`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ remoteUrl, username, password })
      });
      if (res.ok) {
        setShowRemoteForm(false);
      } else {
        const data = await res.json();
        setError(`Push failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Git push error:', err);
      setError('Push failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!token || !remoteUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/pull`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ remoteUrl, username, password })
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setShowRemoteForm(false);
        fetchStatus();
        if (onRestoreCommit) {
          onRestoreCommit(updatedProject);
        } else {
          window.location.reload();
        }
      } else {
        const data = await res.json();
        setError(`Pull failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Git pull error:', err);
      setError('Pull failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreCommit = async (commitId: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to restore this commit? Current changes will be lost if not committed.')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/git/restore`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ commitId })
      });
      if (res.ok) {
        const updatedProject = await res.json();
        fetchStatus();
        if (onRestoreCommit) {
          onRestoreCommit(updatedProject);
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Git restore error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="p-4 text-sm text-slate-500 text-center">
        Sign in to use Git features.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Source Control</span>
        </div>
        <button 
          onClick={fetchStatus}
          disabled={loading}
          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-slate-400"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
              {error && !showRemoteForm && !isRepo && (
                <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500">
                  {error}
                </div>
              )}
              {!isRepo ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <GitBranch className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold dark:text-white mb-1">No Git Repository</h3>
                    <p className="text-xs text-slate-500">Initialize a repository or clone from a remote URL.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleInit}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Initialize Repository
                    </button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-950 px-2 text-slate-500">Or</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-left">
                      <input
                        type="text"
                        value={remoteUrl}
                        onChange={(e) => setRemoteUrl(e.target.value)}
                        placeholder="Git Repository URL"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors dark:text-white"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Username"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors dark:text-white"
                        />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Token / Password"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors dark:text-white"
                        />
                      </div>
                      {error && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500">
                          {error}
                        </div>
                      )}
                      <button
                        onClick={handleClone}
                        disabled={loading || !remoteUrl}
                        className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <DownloadCloud size={14} />
                        )}
                        {loading ? 'Cloning...' : 'Clone Repository'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {error && !showRemoteForm && (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500">
                      {error}
                    </div>
                  )}
                  {/* Changes */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                      Changes
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
                        {changes.length}
                      </span>
                    </h4>
                    
                    {changes.length > 0 ? (
                      <div className="space-y-1 mb-4">
                        {changes.map((change, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs py-1 px-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <span className="text-emerald-500 font-mono">M</span>
                            <span className="dark:text-slate-300 truncate">{change[0]}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic mb-4">No changes to commit.</p>
                    )}

                    <form onSubmit={handleCommit} className="space-y-2">
                      <textarea
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="Commit message..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 transition-colors dark:text-white resize-none h-20"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading || !commitMessage.trim() || changes.length === 0}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Check size={14} />
                          Commit
                        </button>
                        {remoteUrl && (
                          <button
                            type="button"
                            onClick={handlePull}
                            disabled={loading}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            title="Pull from Remote"
                          >
                            <DownloadCloud size={14} />
                            Pull
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowRemoteForm(!showRemoteForm)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center justify-center"
                          title="Remote Options"
                        >
                          <UploadCloud size={14} />
                        </button>
                      </div>
                    </form>

                    {showRemoteForm && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Remote Repository</h4>
                        {error && (
                          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-[10px] text-red-500">
                            {error}
                          </div>
                        )}
                        <input
                          type="text"
                          value={remoteUrl}
                          onChange={(e) => setRemoteUrl(e.target.value)}
                          placeholder="Remote URL (e.g., https://github.com/user/repo.git)"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Username / Token"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                          />
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password (optional)"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-xs focus:outline-none focus:border-emerald-500 dark:text-white"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleSaveRemote}
                            disabled={loading || !remoteUrl}
                            className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                          >
                            Save Settings
                          </button>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handlePush}
                            disabled={loading || !remoteUrl}
                            className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <UploadCloud size={12} /> Push
                          </button>
                          <button
                            onClick={handlePull}
                            disabled={loading || !remoteUrl}
                            className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <DownloadCloud size={12} /> Pull
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Commits */}
                  {commits.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">History</h4>
                      <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                        {commits.map((commit: any) => (
                          <div key={commit.oid} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-700 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                              <GitCommit size={10} />
                            </div>
                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group-hover:border-emerald-500/50 transition-colors">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold dark:text-white truncate pr-2" title={commit.commit.message}>{commit.commit.message}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{commit.oid.substring(0, 7)}</span>
                                  <button
                                    onClick={() => handleRestoreCommit(commit.oid)}
                                    disabled={loading}
                                    className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                                    title="Restore this commit"
                                  >
                                    <RotateCcw size={12} />
                                  </button>
                                </div>
                              </div>
                              <div className="text-[10px] text-slate-500 flex justify-between">
                                <span>{commit.commit.author.name}</span>
                                <span>{new Date(commit.commit.author.timestamp * 1000).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
      </div>
    </div>
  );
};
