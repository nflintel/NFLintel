export interface CodeState {
  html: string;
  css: string;
  js: string;
  php: string;
  react: string;
  md: string;
}

export const INITIAL_CODE: CodeState = {
  html: '<div class="min-h-screen flex items-center justify-center bg-zinc-50">\n  <h1 class="text-6xl font-black tracking-tighter text-black">DIRTNAPP</h1>\n</div>',
  css: '',
  js: '',
  php: '',
  react: '',
  md: '# Welcome to DIRTNAPP\n\nStart editing your markdown here.'
};

export interface ProjectAsset {
  id: string;
  name: string;
  type: string;
  data: string; // base64 or URL
  size: number;
}

export interface ProjectVersion {
  id: string;
  code: CodeState;
  message?: string;
  updatedAt: number;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  code: CodeState;
  category?: string;
  confidenceScore?: number;
  assets?: ProjectAsset[];
  tasks?: Task[];
  updatedAt: number;
  versions?: ProjectVersion[];
  vulnerabilities?: Vulnerability[];
  userId: string;
  isPublic?: boolean;
  sharedWith?: {
    email: string;
    role: 'viewer' | 'editor';
  }[];
  gitState?: Record<string, string>;
  likes?: number;
  forks?: number;
  author?: string;
  autoAiEnabled?: boolean;
  domain?: string;
  appStoreStatus?: 'unsubmitted' | 'pending' | 'published';
  playStoreStatus?: 'unsubmitted' | 'pending' | 'published';
  hostingProvider?: 'vercel' | 'netlify' | 'custom' | null;
}

export type VulnerabilitySeverity = 'low' | 'medium' | 'high' | 'critical';
export type VulnerabilityStatus = 'detected' | 'remediating' | 'resolved' | 'ignored';

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  status: VulnerabilityStatus;
  category: string;
  detectedAt: number;
  autoRemediable: boolean;
  remediationAction?: string;
}

export interface SecurityMetric {
  name: string;
  value: number;
  color: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  password?: string;
  bio: string;
  avatarUrl: string;
}

export interface ThemeConfig {
  primaryColor: string;
  darkSlate: string;
  fontSans: string;
  fontMono: string;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'huggingface' | 'ollama' | 'openrouter';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  contextWindow: number;
  isCustom?: boolean;
  apiKey?: string;
  baseUrl?: string;
  downloaded?: boolean;
}

export type ToolCategory = 'encoding' | 'formatting' | 'crypto' | 'dev';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
}
