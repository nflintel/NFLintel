import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Copy, Check, Globe, Lock, Users, 
  Mail, Shield, ShieldCheck, Link as LinkIcon,
  ChevronDown, Trash2
} from 'lucide-react';
import { Project, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface ShareModalProps {
  project: Project;
  user: UserProfile | null;
  onClose: () => void;
  onUpdateSharing: (updates: Partial<Project>) => Promise<void>;
  appUrl: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  project, 
  user,
  onClose, 
  onUpdateSharing,
  appUrl
}) => {
  const [isPublic, setIsPublic] = useState(project.isPublic || false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'viewer' | 'editor'>('viewer');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwner = user?.id === project.userId;

  const shareUrl = `${appUrl}/share/${project.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublic = async () => {
    setLoading(true);
    try {
      await onUpdateSharing({ isPublic: !isPublic });
      setIsPublic(!isPublic);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    setLoading(true);
    try {
      const updatedSharedWith = [
        ...(project.sharedWith || []),
        { email: newEmail, role: newRole }
      ];
      await onUpdateSharing({ sharedWith: updatedSharedWith });
      setNewEmail('');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (email: string) => {
    setLoading(true);
    try {
      const updatedSharedWith = (project.sharedWith || []).filter(u => u.email !== email);
      await onUpdateSharing({ sharedWith: updatedSharedWith });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] border border-slate-200 dark:border-slate-800"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black uppercase tracking-widest text-3xl dark:text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-emerald-500" />
              Share Project
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white dark:bg-black dark:hover:bg-black dark:bg-zinc-900 border-2 border-black dark:border-white transition-colors">
              <X className="w-6 h-6 dark:text-white" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Public Access Toggle */}
            <div className="bg-white dark:bg-black dark:bg-slate-950 p-6 border-2 border-black dark:border-white border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 border-2 border-black dark:border-white", isPublic ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-black dark:bg-zinc-900 text-slate-400")}>
                    {isPublic ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm dark:text-white">Public Access</h3>
                    <p className="text-xs text-slate-500">Anyone with the link can view</p>
                  </div>
                </div>
                <button 
                  onClick={togglePublic}
                  disabled={loading || !isOwner}
                  className={cn(
                    "w-12 h-6 border-2 border-black dark:border-white relative transition-colors",
                    isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700",
                    !isOwner && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <motion.div 
                    animate={{ x: isPublic ? 26 : 2 }}
                    className="absolute top-1 left-1 w-4 h-4 bg-white border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                  />
                </button>
              </div>

              {isPublic && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-white dark:bg-slate-900 border-2 border-black dark:border-white border border-slate-200 dark:border-slate-800">
                  <div className="flex-1 truncate text-xs text-slate-500 px-2">
                    {shareUrl}
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white text-xs font-bold transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy Link"}
                  </button>
                </div>
              )}
            </div>

            {/* Direct Sharing */}
            <div>
              <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500" />
                Share with people
              </h3>
              {isOwner ? (
                <form onSubmit={handleAddUser} className="flex gap-2 mb-6">
                  <div className="flex-1 relative">
                    <input 
                      type="email"
                      placeholder="Enter email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors dark:text-white"
                    />
                  </div>
                  <div className="relative group">
                    <select 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="appearance-none bg-white dark:bg-black dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-2 border-black dark:border-white px-4 py-3 pr-8 text-sm focus:outline-none focus:border-emerald-500 transition-colors dark:text-white cursor-pointer"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <button 
                    type="submit"
                    disabled={loading || !newEmail}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black dark:border-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    Invite
                  </button>
                </form>
              ) : (
                <div className="mb-6 text-sm text-slate-500 italic">
                  Only the project owner can invite new collaborators.
                </div>
              )}

              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {(project.sharedWith || []).map((u) => (
                  <div key={u.email} className="flex items-center justify-between p-4 bg-white dark:bg-black dark:bg-slate-950 border-2 border-black dark:border-white border border-slate-100 dark:border-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 border-2 border-black dark:border-white flex items-center justify-center text-emerald-600 font-bold text-xs">
                        {u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white">{u.email}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          {u.role === 'editor' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {u.role}
                        </p>
                      </div>
                    </div>
                    {isOwner && (
                      <button 
                        onClick={() => handleRemoveUser(u.email)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {(!project.sharedWith || project.sharedWith.length === 0) && (
                  <div className="text-center py-8 text-slate-400 italic text-sm">
                    No users invited yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-black dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white font-black uppercase tracking-widest text-sm transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
