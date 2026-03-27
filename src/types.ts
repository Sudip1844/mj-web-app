export type TabType = 'voice' | 'privacy' | 'settings' | 'about' | 'monitor' | 'apps' | 'configure' | 'alerts' | 'chat' | 'visualizer';

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
