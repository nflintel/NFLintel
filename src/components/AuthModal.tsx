import React, { useState } from 'react';
import { X, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5"
      >
        <div className="p-8 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="nike-text text-3xl dark:text-white">
              {mode === 'login' ? 'Welcome Back' : 'Join the Lab'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5 dark:text-white" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all dark:text-white"
                    placeholder="EliteDev"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all dark:text-white"
                  placeholder="dev@deepsite.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
