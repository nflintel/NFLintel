import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  Shield, AlertTriangle, CheckCircle, Zap, ShieldAlert, 
  ShieldCheck, ArrowRight, Activity, Lock, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { Vulnerability, Project } from '../types';
import { cn } from '../lib/utils';

interface SecurityDashboardProps {
  project: Project;
  onRemediate: (vulnerabilityId: string) => void;
  onScan: () => void;
  isScanning: boolean;
}

const SEVERITY_COLORS = {
  low: '#10b981',     // emerald-500
  medium: '#f59e0b',  // amber-500
  high: '#ef4444',    // red-500
  critical: '#7f1d1d' // red-900
};

const STATUS_COLORS = {
  detected: '#64748b',   // slate-500
  remediating: '#3b82f6', // blue-500
  resolved: '#10b981',   // emerald-500
  ignored: '#94a3b8'     // slate-400
};

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ 
  project, 
  onRemediate, 
  onScan,
  isScanning 
}) => {
  const vulnerabilities = project.vulnerabilities || [];

  const stats = useMemo(() => {
    const severityCount = { low: 0, medium: 0, high: 0, critical: 0 };
    const statusCount = { detected: 0, remediating: 0, resolved: 0, ignored: 0 };
    
    vulnerabilities.forEach(v => {
      severityCount[v.severity]++;
      statusCount[v.status]++;
    });

    const severityData = Object.entries(severityCount).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      color: SEVERITY_COLORS[name as keyof typeof SEVERITY_COLORS]
    }));

    const statusData = Object.entries(statusCount).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
      color: STATUS_COLORS[name as keyof typeof STATUS_COLORS]
    }));

    return { severityData, statusData, total: vulnerabilities.length };
  }, [vulnerabilities]);

  const resolvedCount = vulnerabilities.filter(v => v.status === 'resolved').length;
  const healthScore = stats.total === 0 ? 100 : Math.round((resolvedCount / stats.total) * 100);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black dark:bg-slate-950 overflow-y-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="font-black uppercase tracking-widest text-4xl dark:text-white flex items-center gap-3">
            <Shield className="w-10 h-10 text-emerald-500" />
            Security Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitoring security posture for <span className="font-bold text-slate-900 dark:text-white">{project.name}</span>
          </p>
          {project.description && (
            <p 
              className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-2xl"
              dangerouslySetInnerHTML={{ __html: project.description }}
            />
          )}
        </div>
        <button 
          onClick={onScan}
          disabled={isScanning}
          className={cn(
            "flex items-center gap-2 px-6 py-3 border-2 border-black dark:border-white font-black uppercase tracking-widest text-sm transition-all active:scale-95",
            isScanning 
              ? "bg-slate-200 dark:bg-black dark:bg-zinc-900 text-slate-400 cursor-not-allowed" 
              : "bg-black dark:bg-white text-white dark:text-black hover:shadow-xl"
          )}
        >
          {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
          {isScanning ? "Scanning..." : "Run Security Scan"}
        </button>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Security Health" 
          value={`${healthScore}%`} 
          icon={ShieldCheck} 
          color="text-emerald-500"
          trend={healthScore > 80 ? 'Optimal' : 'Needs Attention'}
        />
        <MetricCard 
          title="Total Vulnerabilities" 
          value={stats.total} 
          icon={AlertTriangle} 
          color="text-amber-500"
          trend={`${vulnerabilities.filter(v => v.status === 'detected').length} Active`}
        />
        <MetricCard 
          title="Critical Threats" 
          value={vulnerabilities.filter(v => v.severity === 'critical').length} 
          icon={ShieldAlert} 
          color="text-red-600"
          trend="Immediate Action Required"
        />
        <MetricCard 
          title="Auto-Remediated" 
          value={vulnerabilities.filter(v => v.status === 'resolved' && v.autoRemediable).length} 
          icon={Zap} 
          color="text-blue-500"
          trend="System Automated"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white border border-slate-200 dark:border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <h3 className="font-black uppercase tracking-widest text-xl mb-6 dark:text-white">Severity Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.severityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {stats.severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white border border-slate-200 dark:border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <h3 className="font-black uppercase tracking-widest text-xl mb-6 dark:text-white">Remediation Status</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vulnerability List & Auto-Remediation */}
      <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-white border border-slate-200 dark:border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-black uppercase tracking-widest text-xl dark:text-white">Vulnerabilities & Remediation</h3>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 border-2 border-black dark:border-white">
              <ShieldCheck className="w-3 h-3" />
              Auto-Remediation Active
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white dark:bg-black dark:bg-slate-950/50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Vulnerability</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Severity</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vulnerabilities.length > 0 ? vulnerabilities.map((v) => (
                <tr key={v.id} className="hover:bg-white dark:bg-black dark:hover:bg-black dark:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white">{v.title}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{v.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span 
                      className="text-[10px] font-black uppercase tracking-tighter px-2 py-1 rounded-md"
                      style={{ backgroundColor: `${SEVERITY_COLORS[v.severity]}20`, color: SEVERITY_COLORS[v.severity] }}
                    >
                      {v.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 border-2 border-black dark:border-white" style={{ backgroundColor: STATUS_COLORS[v.status] }} />
                      <span className="text-xs font-medium capitalize dark:text-slate-300">{v.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {v.status === 'resolved' ? (
                      <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
                        <CheckCircle className="w-4 h-4" />
                        Fixed
                      </span>
                    ) : v.autoRemediable ? (
                      <button 
                        onClick={() => onRemediate(v.id)}
                        disabled={v.status === 'remediating'}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-black dark:border-white text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                      >
                        {v.status === 'remediating' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Auto-Remediate
                      </button>
                    ) : (
                      <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-white border-2 border-black dark:border-white text-xs font-bold transition-all dark:text-white">
                        Manual Fix
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    No vulnerabilities detected. Run a scan to check your project.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white dark:bg-slate-900 p-6 border-2 border-black dark:border-white border border-slate-200 dark:border-slate-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
    <div className="flex items-center justify-between mb-4">
      <div className={cn("p-3 border-2 border-black dark:border-white bg-white dark:bg-black dark:bg-black dark:bg-zinc-900", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</span>
    </div>
    <div className="font-black uppercase tracking-widest text-3xl dark:text-white mb-1">{value}</div>
    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{trend}</div>
  </div>
);
