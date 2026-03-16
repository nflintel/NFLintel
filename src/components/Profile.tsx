import React, { useState } from 'react';
import { User, Mail, FileText, Camera, Save, X, Lock, Eye, EyeOff, Github, Globe, Key, Database, Cpu } from 'lucide-react';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';

interface ProfileProps {
  user: UserProfile;
  onSave: (user: UserProfile) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onSave, onClose, onLogout }) => {
  const [formData, setFormData] = useState<UserProfile>(user);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'general' | 'integrations'>('general');

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex-1 overflow-y-auto bg-white dark:bg-black p-6 md:p-12 absolute inset-0 z-50"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-black uppercase tracking-widest text-4xl md:text-6xl mb-2 dark:text-white">Profile</h2>
            <p className="text-zinc-500 text-sm uppercase tracking-widest font-medium">Account Settings & Identity</p>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center border-2 border-black dark:border-white border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all dark:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-black dark:border-white mb-8 pb-4">
          <button 
            onClick={() => setActiveTab('general')}
            className={`text-xs font-bold uppercase tracking-widest px-4 py-2 border-2 border-black dark:border-white transition-all ${activeTab === 'general' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
          >
            General
          </button>
          <button 
            onClick={() => setActiveTab('integrations')}
            className={`text-xs font-bold uppercase tracking-widest px-4 py-2 border-2 border-black dark:border-white transition-all ${activeTab === 'integrations' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}
          >
            Integrations & APIs
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {activeTab === 'general' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              {/* Avatar Section */}
              <div className="relative group overflow-hidden border-2 border-black dark:border-white border border-black dark:border-white p-8 bg-zinc-50 dark:bg-black dark:bg-zinc-900/50">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <div className="w-32 h-32 border-2 border-black dark:border-white bg-black dark:bg-white flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
                      {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-16 h-16 text-white dark:text-black" />
                      )}
                    </div>
                    <button className="absolute bottom-1 right-1 w-10 h-10 bg-emerald-500 border-2 border-black dark:border-white text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="font-black uppercase tracking-widest text-2xl mb-1 dark:text-white">{formData.username || 'Elite Member'}</h3>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-tighter">{formData.email || 'No email provided'}</p>
                    <div className="mt-4 flex gap-2 justify-center md:justify-start">
                      <span className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold uppercase tracking-widest border-2 border-black dark:border-white">Pro Member</span>
                      <span className="px-3 py-1 border border-black/10 dark:border-white text-[10px] font-bold uppercase tracking-widest border-2 border-black dark:border-white dark:text-white">Verified</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                    <User className="w-3 h-3" /> Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                    className={`w-full bg-zinc-50 dark:bg-black dark:bg-zinc-900 border ${errors.username ? 'border-red-500' : 'border-black dark:border-white'} border-2 border-black dark:border-white p-4 text-sm focus:outline-none focus:ring-2 ${errors.username ? 'focus:ring-red-500' : 'focus:ring-black dark:focus:ring-white'} transition-all dark:text-white`}
                    placeholder="Enter username"
                  />
                  {errors.username && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider px-1">{errors.username}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full bg-zinc-50 dark:bg-black dark:bg-zinc-900 border ${errors.email ? 'border-red-500' : 'border-black dark:border-white'} border-2 border-black dark:border-white p-4 text-sm focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-black dark:focus:ring-white'} transition-all dark:text-white`}
                    placeholder="Enter email"
                  />
                  {errors.email && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider px-1">{errors.email}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                    <Lock className="w-3 h-3" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      className={`w-full bg-zinc-50 dark:bg-black dark:bg-zinc-900 border ${errors.password ? 'border-red-500' : 'border-black dark:border-white'} border-2 border-black dark:border-white p-4 pr-14 text-sm focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500' : 'focus:ring-black dark:focus:ring-white'} transition-all dark:text-white`}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider px-1">{errors.password}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2 px-1">
                  <FileText className="w-3 h-3" /> Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-black dark:bg-zinc-900 border border-black dark:border-white border-2 border-black dark:border-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all min-h-[160px] resize-none dark:text-white"
                  placeholder="Tell us about your creative journey..."
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'integrations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              
              {/* Connected Accounts */}
              <div className="p-8 bg-zinc-50 dark:bg-black dark:bg-zinc-900/50 border-2 border-black dark:border-white border border-black dark:border-white">
                <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500" /> Connected Accounts</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-black border-2 border-black dark:border-white border border-black dark:border-white">
                    <div className="flex items-center gap-4">
                      <Github className="w-8 h-8 dark:text-white" />
                      <div>
                        <h4 className="font-bold dark:text-white">GitHub</h4>
                        <p className="text-xs text-zinc-500">Connected as @{formData.username}</p>
                      </div>
                    </div>
                    <button type="button" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 border-2 border-black dark:border-white transition-colors">Disconnect</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-black border-2 border-black dark:border-white border border-black dark:border-white">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-500 border-2 border-black dark:border-white flex items-center justify-center text-white font-bold">G</div>
                      <div>
                        <h4 className="font-bold dark:text-white">Google</h4>
                        <p className="text-xs text-zinc-500">Not connected</p>
                      </div>
                    </div>
                    <button type="button" className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform">Connect</button>
                  </div>
                </div>
              </div>

              {/* API Keys */}
              <div className="p-8 bg-zinc-50 dark:bg-black dark:bg-zinc-900/50 border-2 border-black dark:border-white border border-black dark:border-white">
                <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2"><Key className="w-5 h-5 text-emerald-500" /> API Keys & Models</h3>
                <p className="text-sm text-zinc-500 mb-6">Connect your own API keys to use custom models from OpenAI, Anthropic, Hugging Face, and more without limits.</p>
                
                <div className="space-y-4">
                  {[
                    { name: 'OpenAI', icon: Cpu, status: 'Connected' },
                    { name: 'Anthropic', icon: Database, status: 'Not Configured' },
                    { name: 'Hugging Face', icon: Globe, status: 'Connected' }
                  ].map((api, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-black border-2 border-black dark:border-white border border-black dark:border-white gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white dark:bg-black dark:bg-zinc-800 border-2 border-black dark:border-white">
                          <api.icon className="w-5 h-5 dark:text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold dark:text-white">{api.name}</h4>
                          <p className="text-xs text-zinc-500">{api.status}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input type="password" placeholder="sk-..." className="flex-1 md:w-64 bg-zinc-50 dark:bg-black dark:bg-zinc-900 border border-black dark:border-white border-2 border-black dark:border-white px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 dark:text-white" />
                        <button type="button" className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white text-xs font-bold uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] transition-transform">Save</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          <div className="flex justify-between items-center pt-8 border-t border-black dark:border-white">
            <button
              type="button"
              onClick={onLogout}
              className="px-8 py-4 border border-red-500/20 text-red-500 font-bold uppercase tracking-widest text-[10px] border-2 border-black dark:border-white hover:bg-red-500 hover:text-white transition-all"
            >
              Sign Out
            </button>
            <button
              type="submit"
              className="group flex items-center gap-3 px-10 py-4 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest text-xs border-2 border-black dark:border-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:scale-95 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] shadow-black/20 dark:shadow-white/10"
            >
              <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
