export type TabType = 'voice' | 'privacy' | 'settings' | 'about' | 'monitor' | 'apps' | 'configure' | 'alerts' | 'chat' | 'visualizer' | 'subagents';

export interface SubAgent {
  id: string;
  name: string;
  provider: 'anthropic' | 'openrouter' | 'openai' | 'grok' | 'groq' | 'deepseek' | 'google' | 'nvidia' | 'together';
  model: string;
  apiKey: string;
}

export interface Message {
  id: string;
  role: 'user' | 'mj' | 'system' | 'error';
  text: string;
  timestamp: Date;
  image?: string;
}

export interface SystemStats {
  cpu: number;
  ram: number;
  ramUsed: string;
  ramTotal: string;
  disk: number;
  diskUsed: string;
  diskTotal: string;
  battery: number;
  isCoreRunning: boolean;
}

export interface AppPermission {
  name: string;
  allowed: boolean;
  icon: string;
}
