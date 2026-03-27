/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Shield, Settings, Info, Activity, Grid, Wrench, Bell, MessageSquare, 
  Power, Cpu, HardDrive, Battery, CheckCircle2, XCircle, RefreshCw, Paperclip, Send,
  User, Bot, AlertCircle, Image as ImageIcon, Trash2, Moon, Sun, Search,
  ShieldAlert, Lock, FileWarning, Pencil, Check, Save, ShieldCheck, Camera, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { TabType, Message, SystemStats, AppPermission } from './types';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

// --- Mock Data ---
const VISUALIZERS = [
  { id: 'pulse', name: 'Pulse Orb', icon: '⭕', description: 'A glowing orb that pulses with voice activity.' },
  { id: 'wave', name: 'Sonic Wave', icon: '🌊', description: 'Dynamic waves that react to sound frequencies.' },
  { id: 'bars', name: 'Frequency Bars', icon: '📊', description: 'Classic equalizer bars for audio visualization.' },
  { id: 'liquid', name: 'Liquid Sphere', icon: '💧', description: 'An organic, morphing sphere of fluid energy.' },
  { id: 'aura', name: 'Aura Glow', icon: '🌈', description: 'A soft, breathing aura of shifting gradients.' },
  { id: 'orbit', name: 'Orbiting Satellites', icon: '🛰️', description: 'Blinking data points orbiting a central core.' },
  { id: 'vortex', name: 'Vortex', icon: '🌀', description: 'A swirling kinesis of light pulling inward.' },
  { id: 'cyber', name: 'Cyber Pulse', icon: '⚡', description: 'A neon heartbeat line reacting to voice input.' },
];

const MJLogo = ({ className }: { className?: string }) => (
  <motion.div 
    className={cn("relative flex items-center justify-center", className)}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="relative w-10 h-10 rounded-xl bg-[#020617] border border-cyan-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
      
      <svg viewBox="0 0 100 100" className="w-7 h-7 relative z-10">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Stylized M */}
        <path 
          d="M20 75 V25 L50 50 L80 25 V75" 
          fill="none" 
          stroke="url(#logoGradient)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
        />
        
        {/* Stylized J intertwined */}
        <path 
          d="M35 70 C35 85 65 85 65 70 V35" 
          fill="none" 
          stroke="#22d3ee" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter="url(#glow)"
          opacity="0.9"
        />
      </svg>

      <motion.div 
        className="absolute inset-0 bg-cyan-400/5"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isPowerOn, setIsPowerOn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [selectedVisualizer, setSelectedVisualizer] = useState(VISUALIZERS[0].id);
  const [stats, setStats] = useState<SystemStats>({
    cpu: 0,
    ram: 0,
    ramUsed: '0GB',
    ramTotal: '16GB',
    disk: 45,
    diskUsed: '225GB',
    diskTotal: '500GB',
    battery: 85,
    isCoreRunning: false
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      text: 'MJ Control Center Initialized. Language: English.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [appPermissions, setAppPermissions] = useState<AppPermission[]>([]);
  
  // --- New State for Settings ---
  const [settings, setSettings] = useState({
    micEnabled: true,
    screenEnabled: true,
    voiceEnabled: true,
    cameraEnabled: true,
    email: '',
    emailPass: '',
    imapServer: 'imap.gmail.com',
    tgToken: '',
    tgChatId: ''
  });

  const [editingFields, setEditingFields] = useState({
    tgToken: false,
    tgChatId: false,
    email: false,
    emailPass: false
  });

  const [notifications, setNotifications] = useState<{id: string, text: string, time: string}[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AI Setup ---
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // --- Effects ---
  useEffect(() => {
    // Fetch external app data
    fetch('/data/apps.json')
      .then(res => res.json())
      .then(data => setAppPermissions(data))
      .catch(err => console.error('Failed to load apps:', err));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setIsSidebarExpanded(false);
      } else {
        setIsSidebarExpanded(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPowerOn) {
        const ramPercent = Math.floor(Math.random() * 20) + 40;
        const ramUsed = ((ramPercent / 100) * 16).toFixed(1);
        
        setStats(prev => ({
          ...prev,
          cpu: Math.floor(Math.random() * 30) + 5,
          ram: ramPercent,
          ramUsed: `${ramUsed}GB`,
          ramTotal: '16GB',
          isCoreRunning: true
        }));
      } else {
        setStats(prev => ({ 
          ...prev, 
          cpu: 0, 
          ram: 0, 
          ramUsed: '0GB',
          isCoreRunning: false 
        }));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPowerOn]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // --- Handlers ---
  const handleSendMessage = async () => {
    if (!inputText.trim() && !attachedImage) return;
    if (!isPowerOn) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'error',
        text: 'MJ is currently OFF. Please start the core first.',
        timestamp: new Date()
      }]);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date(),
      image: attachedImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachedImage(null);
    setIsThinking(true);

    try {
      let responseText = '';
      
      if (userMsg.image) {
        // Image Analysis
        const model = ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: {
            parts: [
              { text: userMsg.text || 'Analyze this image.' },
              { inlineData: { mimeType: 'image/jpeg', data: userMsg.image.split(',')[1] } }
            ]
          }
        });
        const result = await model;
        responseText = result.text || 'I analyzed the image but couldn\'t find much.';
      } else {
        // General Chat
        const chat = ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: messages
            .filter(m => m.role === 'user' || m.role === 'mj')
            .map(m => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.text }]
            }))
            .concat([{ role: 'user', parts: [{ text: userMsg.text }] }]) as any,
          config: {
            systemInstruction: "You are MJ, a highly advanced personal AI assistant. You are helpful, technical, and speak English fluently. Keep responses concise and formatted with markdown."
          }
        });
        const result = await chat;
        responseText = result.text || 'Something went wrong.';
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'mj',
        text: responseText,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'error',
        text: 'Connection error. Please check your API key.',
        timestamp: new Date()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-500/30 text-yellow-500 rounded-sm px-0.5">{part}</mark>
          ) : part
        )}
      </span>
    );
  };

  const toggleAppPermission = (name: string) => {
    setAppPermissions(prev => prev.map(app => 
      app.name === name ? { ...app, allowed: !app.allowed } : app
    ));
  };

  // --- Components ---
  const SidebarItem = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "w-full flex items-center gap-3 px-2 py-2 md:py-3 rounded-xl transition-all duration-200 group",
        activeTab === id 
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
          : "hover:bg-accent text-muted-foreground hover:text-foreground",
        !isSidebarExpanded && "justify-center"
      )}
      title={!isSidebarExpanded ? label : undefined}
    >
      <Icon size={18} className={cn("shrink-0 md:w-5 md:h-5", activeTab === id ? "scale-110" : "group-hover:scale-110 transition-transform")} />
      {isSidebarExpanded && <span className="font-medium text-xs md:text-sm truncate">{label}</span>}
    </button>
  );

  return (
    <div className="h-screen flex transition-colors duration-300 bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "border-r py-4 md:py-6 px-2 md:px-4 flex flex-col gap-4 md:gap-8 transition-all duration-300 h-full",
        isSidebarExpanded ? "w-52" : "w-16 md:w-20",
        "border-border bg-card/50 backdrop-blur-sm"
      )}>
        <div className="flex items-center justify-start">
          <button 
            onClick={() => {
              if (window.innerWidth >= 1100) {
                setIsSidebarExpanded(!isSidebarExpanded);
              }
            }}
            className={cn(
              "p-2 hover:bg-accent rounded-xl text-primary transition-colors",
              window.innerWidth < 1100 && "cursor-default opacity-50"
            )}
            title={window.innerWidth >= 1100 ? "Toggle Sidebar" : undefined}
          >
            <Menu size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          <SidebarItem id="chat" icon={MessageSquare} label="Chat" />
          <SidebarItem id="monitor" icon={Activity} label="Monitor" />
          <SidebarItem id="visualizer" icon={ImageIcon} label="Visualizer" />
          <SidebarItem id="alerts" icon={Bell} label="Alerts" />
          <SidebarItem id="privacy" icon={Shield} label="Privacy" />
          <SidebarItem id="apps" icon={Grid} label="Apps" />
          <SidebarItem id="settings" icon={Settings} label="Settings" />
        </nav>

        <div className="pt-6 border-t border-white/10">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "w-full flex items-center gap-3 px-2 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent",
              !isSidebarExpanded && "justify-start"
            )}
            title={!isSidebarExpanded ? "Toggle Theme" : undefined}
          >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            {isSidebarExpanded && <span className="text-sm font-medium">Theme</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={cn(
          "h-16 md:h-20 border-b px-4 md:px-8 flex items-center justify-between transition-all duration-300",
          "border-border bg-card/50 backdrop-blur-sm"
        )}>
          <div className="flex items-center gap-2 md:gap-6 overflow-hidden">
            <MJLogo className="scale-75 md:scale-100" />
            <div className="flex flex-col min-w-0">
              <span className={cn(
                "text-[8px] md:text-sm font-bold uppercase tracking-widest truncate",
                isPowerOn ? "text-emerald-500" : "text-rose-500"
              )}>
                {isPowerOn ? "● Core Active" : "○ Core Offline"}
              </span>
              <span className="text-[8px] md:text-xs opacity-50 truncate">
                Voice: {isPowerOn ? (settings.micEnabled ? "Listening..." : "Off") : "Standby"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsPowerOn(!isPowerOn)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 md:px-6 md:py-2.5 rounded-full font-bold text-[10px] md:text-sm transition-all active:scale-95",
                isPowerOn 
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                  : "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
              )}
            >
              <Power size={14} className="md:w-[18px] md:h-[18px]" />
              <span className="hidden xs:inline">{isPowerOn ? "STOP MJ" : "START MJ"}</span>
              <span className="xs:hidden">{isPowerOn ? "STOP" : "START"}</span>
            </button>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden p-4 md:p-8 relative">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col gap-4 w-full max-w-5xl mx-auto overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto space-y-6 pb-4 pr-2 scrollbar-thin scrollbar-thumb-scrollbar">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex flex-col gap-2",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                      <div className="flex items-center gap-2 px-2">
                        {msg.role === 'user' ? (
                          <>
                            <span className="text-[10px] opacity-50">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="text-xs font-bold text-blue-400">You</span>
                          </>
                        ) : msg.role === 'mj' ? (
                          <>
                            <span className="text-xs font-bold text-rose-500">MJ</span>
                            <span className="text-[10px] opacity-50">{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        ) : null}
                      </div>

                      <div className={cn(
                        "max-w-[90%] md:max-w-[85%] rounded-2xl p-3 md:p-4 text-xs md:text-sm leading-relaxed shadow-sm transition-colors duration-200",
                        msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10" : 
                        msg.role === 'mj' ? "bg-card text-foreground border border-border rounded-tl-none" :
                        msg.role === 'system' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 w-full text-center italic" :
                        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 w-full text-center"
                      )}>
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Attached" 
                            className="max-w-xs rounded-lg mb-3 border border-border"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className={cn(
                          "prose prose-sm max-w-none",
                          isDarkMode ? "prose-invert" : ""
                        )}>
                          <Markdown>{msg.text}</Markdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex items-center gap-2 text-rose-500 px-4">
                      <Bot size={16} className="animate-bounce" />
                      <span className="text-xs font-medium animate-pulse">MJ is thinking...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="sticky bottom-0 pt-4">
                  {attachedImage && (
                    <div className="mb-3 flex items-center gap-2 p-2 bg-card rounded-xl border border-border w-fit shadow-lg">
                      <img src={attachedImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                      <button onClick={() => setAttachedImage(null)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-rose-500">
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
                  <div className={cn(
                    "flex items-end gap-2 p-1.5 md:p-2 rounded-2xl border transition-all focus-within:ring-4 focus-within:ring-primary/10",
                    "bg-card border-border shadow-lg"
                  )}>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 md:p-3 hover:bg-accent rounded-xl text-muted-foreground transition-colors"
                    >
                      <Paperclip size={18} className="md:w-5 md:h-5" />
                    </button>
                    <input 
                      type="file" 
                      hidden 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*"
                    />
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Type your message here..."
                      className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm max-h-32"
                      rows={1}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() && !attachedImage}
                      className="p-2 md:p-3 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all active:scale-95"
                    >
                      <Send size={18} className="md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'monitor' && (
              <motion.div 
                key="monitor"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="h-full overflow-y-auto max-w-6xl mx-auto space-y-8 pr-2"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatCard icon={Cpu} label="CPU Usage" value={`${stats.cpu}%`} color="blue" isDarkMode={isDarkMode} />
                  <StatCard 
                    icon={Activity} 
                    label="RAM Usage" 
                    value={`${stats.ram}%`} 
                    usedValue={stats.ramUsed}
                    totalValue={stats.ramTotal}
                    color="rose" 
                    isDarkMode={isDarkMode} 
                  />
                  <StatCard 
                    icon={HardDrive} 
                    label="Disk Space" 
                    value={`${stats.disk}%`} 
                    usedValue={stats.diskUsed}
                    totalValue={stats.diskTotal}
                    color="amber" 
                    isDarkMode={isDarkMode} 
                  />
                  <StatCard icon={Battery} label="Battery" value={`${stats.battery}%`} color="emerald" isDarkMode={isDarkMode} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={cn(
                    "lg:col-span-2 p-8 rounded-3xl border transition-colors duration-300",
                    "bg-card border-border shadow-sm"
                  )}>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <RefreshCw className={cn("text-primary", isPowerOn ? "animate-spin" : "")} size={20} />
                        Active Processes
                      </h3>
                      <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Live Feed
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="grid grid-cols-4 text-[8px] md:text-[10px] uppercase tracking-widest font-bold opacity-30 px-2 mb-4">
                        <span>Process</span>
                        <span>PID</span>
                        <span>CPU</span>
                        <span>Memory</span>
                      </div>
                      <ProcessRow name="MJ_Core.exe" pid="4829" cpu="12.4%" mem="452MB" active={isPowerOn} isDarkMode={isDarkMode} />
                      <ProcessRow name="Brain_Engine" pid="1022" cpu="4.2%" mem="1.2GB" active={isPowerOn} isDarkMode={isDarkMode} />
                      <ProcessRow name="Voice_STT" pid="9921" cpu="0.1%" mem="89MB" active={isPowerOn} isDarkMode={isDarkMode} />
                      <ProcessRow name="System_UI" pid="3312" cpu="1.8%" mem="210MB" active={true} isDarkMode={isDarkMode} />
                    </div>
                  </div>

                  <div className={cn(
                    "p-8 rounded-3xl border space-y-6 transition-colors duration-300",
                    "bg-card border-border shadow-sm"
                  )}>
                    <h3 className="text-xl font-bold">System Health</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-500" size={20} />
                          <span className="text-sm font-medium">Security Engine</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500">OPTIMAL</span>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <div className="flex items-center gap-3">
                          <RefreshCw className="text-blue-500" size={20} />
                          <span className="text-sm font-medium">Auto-Update</span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-500">SYNCED</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="text-amber-500" size={20} />
                          <span className="text-sm font-medium">Memory Usage</span>
                        </div>
                        <p className="text-[10px] opacity-60 leading-relaxed">System memory is at 62%. Consider closing unused background tasks for better performance.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quarantine Section */}
                <div className={cn(
                  "p-4 md:p-8 rounded-2xl md:rounded-3xl border transition-colors duration-300",
                  "bg-card border-border shadow-sm"
                )}>
                  <div className="flex items-center justify-between mb-4 md:mb-8">
                    <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                      <ShieldAlert className="text-rose-500 md:w-6 md:h-6" size={20} />
                      Quarantine Zone
                    </h3>
                    <div className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 bg-rose-500/10 text-rose-500 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                      <Lock size={10} className="md:w-3 md:h-3" />
                      Isolated
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                    {[
                      { name: 'Trojan.Win32.Generic', size: '2.4 MB', date: '2024-03-20', threat: 'High' },
                      { name: 'Malware_Sample_01.exe', size: '850 KB', date: '2024-03-22', threat: 'Critical' },
                      { name: 'Spyware.Agent.B', size: '1.2 MB', date: '2024-03-25', threat: 'Medium' },
                    ].map((file, i) => (
                      <div key={i} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col gap-2 md:gap-3 group hover:bg-rose-500/10 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <div className="p-1.5 md:p-2 rounded-lg bg-rose-500/20 text-rose-500 shrink-0">
                              <FileWarning size={14} className="md:w-[18px] md:h-[18px]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs md:text-sm font-bold truncate">{file.name}</p>
                              <p className="text-[8px] md:text-[10px] opacity-50 truncate">{file.size} • {file.date}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[7px] md:text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                            file.threat === 'Critical' ? "bg-rose-500 text-white" : "bg-rose-500/20 text-rose-500"
                          )}>
                            {file.threat}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 md:mt-2">
                          <button className="flex-1 py-1.5 md:py-2 text-[8px] md:text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                            Delete
                          </button>
                          <button className="flex-1 py-1.5 md:py-2 text-[8px] md:text-[10px] font-bold uppercase tracking-wider border border-rose-500/20 text-rose-500 rounded-lg hover:bg-rose-500/5 transition-colors">
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Empty state if no files */}
                  {/* <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl opacity-30">
                    <ShieldCheck size={48} className="mx-auto mb-4" />
                    <p className="text-sm font-medium">System is clean. No threats detected.</p>
                  </div> */}
                </div>
              </motion.div>
            )}

            {activeTab === 'alerts' && (
              <motion.div 
                key="alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto max-w-4xl mx-auto space-y-6 pr-2"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="text-rose-500" /> Notifications & Alerts
                  </h2>
                </div>

                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-border rounded-3xl opacity-50">
                      <Bell size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-medium">No active alerts or notifications.</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{n.text}</p>
                            <p className="text-[10px] opacity-50 uppercase tracking-widest font-bold">{n.time}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
                          className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div 
                key="privacy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto max-w-4xl mx-auto space-y-8 pr-2"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="text-emerald-500" /> Privacy & Security
                  </h2>
                  <p className="text-sm text-muted-foreground">Manage your data and system access permissions.</p>
                </div>

                <div className="space-y-8">
                  <div className="p-6 rounded-3xl border bg-card border-border shadow-sm space-y-6">
                    <h3 className="text-lg font-bold">Permissions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <PermissionToggle 
                        icon={Mic} 
                        label="Microphone" 
                        checked={settings.micEnabled} 
                        onChange={(val: boolean) => setSettings(s => ({...s, micEnabled: val}))} 
                      />
                      <PermissionToggle 
                        icon={ImageIcon} 
                        label="Screen Reading" 
                        checked={settings.screenEnabled} 
                        onChange={(val: boolean) => setSettings(s => ({...s, screenEnabled: val}))} 
                      />
                      <PermissionToggle 
                        icon={Bot} 
                        label="Voice Output" 
                        checked={settings.voiceEnabled} 
                        onChange={(val: boolean) => setSettings(s => ({...s, voiceEnabled: val}))} 
                      />
                      <PermissionToggle 
                        icon={Camera} 
                        label="Camera Access" 
                        checked={settings.cameraEnabled} 
                        onChange={(val: boolean) => setSettings(s => ({...s, cameraEnabled: val}))} 
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl border bg-card border-border shadow-sm space-y-6">
                    <h3 className="text-lg font-bold">Security Status</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <SecurityStat label="Firewall" value="ACTIVE" color="text-emerald-500" />
                      <SecurityStat label="Encryption" value="AES-256" color="text-blue-500" />
                      <SecurityStat label="Last Scan" value="2h ago" color="text-slate-500" />
                      <SecurityStat label="Threats" value="None" color="text-emerald-500" />
                    </div>
                    <button className="w-full py-3 bg-emerald-500/10 text-emerald-500 font-bold rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all text-sm">
                      RUN FULL SYSTEM SCAN
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'apps' && (
              <motion.div 
                key="apps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto max-w-4xl mx-auto space-y-6 pr-2"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Grid className="text-blue-500" /> Application Access
                  </h2>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setIsScanning(true);
                        setTimeout(() => {
                          const newApps = [...appPermissions];
                          // Simulate finding a new app
                          if (!newApps.find(a => a.name === 'IntelliJ IDEA')) {
                            newApps.push({ name: 'IntelliJ IDEA', allowed: true, icon: 'https://cdn.simpleicons.org/intellijidea' });
                            setAppPermissions(newApps);
                          }
                          setIsScanning(false);
                        }, 1500);
                      }}
                      disabled={isScanning}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-70",
                        isScanning && "animate-pulse"
                      )}
                    >
                      <RefreshCw size={14} className={cn(isScanning && "animate-spin")} />
                      {isScanning ? "Scanning..." : "Scan System"}
                    </button>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search apps..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none w-64"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {appPermissions
                    .filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(app => (
                    <div key={app.name} className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-card border border-border flex items-center justify-between hover:border-primary/30 transition-colors group">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-accent flex items-center justify-center overflow-hidden">
                          {app.icon.startsWith('http') ? (
                            <img src={app.icon} alt={app.name} className="w-5 h-5 md:w-6 md:h-6 object-contain group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-lg md:text-xl">{app.icon}</span>
                          )}
                        </div>
                        <span className="font-bold text-xs md:text-sm">{highlightText(app.name, searchTerm)}</span>
                      </div>
                      <button 
                        onClick={() => toggleAppPermission(app.name)}
                        className={cn(
                          "px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all",
                          app.allowed 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-rose-500/10 text-rose-500"
                        )}
                      >
                        {app.allowed ? "Allowed" : "Denied"}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'visualizer' && (
              <motion.div 
                key="visualizer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto max-w-4xl mx-auto space-y-8 pr-2"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ImageIcon className="text-purple-500" /> Assistant Visualizers
                  </h2>
                  <p className="text-sm text-muted-foreground">Select the animation style for MJ's voice assistant mode.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {VISUALIZERS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVisualizer(v.id)}
                      className={cn(
                        "p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all text-left flex flex-col gap-3 md:gap-4 group",
                        selectedVisualizer === v.id 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                          : "bg-card border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl transition-transform group-hover:scale-110",
                        selectedVisualizer === v.id ? "bg-white/20" : "bg-accent"
                      )}>
                        {v.icon}
                      </div>
                      <div>
                        <div className="font-bold text-xs md:text-sm">{v.name}</div>
                        <div className={cn(
                          "text-[9px] md:text-[10px] mt-1 line-clamp-2",
                          selectedVisualizer === v.id ? "text-white/70" : "text-muted-foreground"
                        )}>
                          {v.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className={cn(
                  "p-8 rounded-3xl border bg-card border-border shadow-sm flex flex-col items-center justify-center gap-8 min-h-[300px]",
                  "relative overflow-hidden"
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                  <h3 className="text-lg font-bold z-10">Live Preview</h3>
                  <div className="z-10">
                    <AssistantVisualizer type={selectedVisualizer} active={true} />
                  </div>
                  <p className="text-xs text-muted-foreground z-10 text-center max-w-md">
                    This animation will appear at the top of your screen whenever MJ is speaking or processing your voice commands.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full overflow-y-auto max-w-4xl mx-auto space-y-8 pr-2"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="text-slate-500" /> Settings & Configuration
                  </h2>
                  <p className="text-sm text-muted-foreground">Manage system behavior, integrations, and about information.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Voice Configuration Section */}
                  <div className={cn("p-4 md:p-6 rounded-2xl md:rounded-3xl border bg-card border-border shadow-sm space-y-4")}>
                    <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                      <Mic size={18} className="text-primary md:w-5 md:h-5" /> Voice Configuration
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 md:p-3 rounded-xl bg-background border border-border">
                        <span className="text-lg md:text-xl">🔤</span>
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-medium">Chat: English</span>
                          <span className="text-[10px] md:text-xs opacity-50">Supports: English (Primary)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-2 md:p-3 rounded-xl bg-background border border-border">
                        <span className="text-lg md:text-xl">🎤</span>
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-medium">Voice: Auto-detect English</span>
                          <span className="text-[10px] md:text-xs opacity-50">Real-time processing</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <Mic size={16} className="md:w-5 md:h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs md:text-sm font-bold">Wake Word: "MJ"</span>
                            <span className="text-[10px] md:text-xs opacity-50">Say "MJ" to activate</span>
                          </div>
                        </div>
                        <span className="text-[8px] md:text-[10px] font-bold px-2 py-1 bg-primary text-white rounded-full">ACTIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* General Settings Section */}
                  <div className={cn("p-4 md:p-6 rounded-2xl md:rounded-3xl border bg-card border-border shadow-sm space-y-4")}>
                    <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                      <Activity size={18} className="text-slate-500 md:w-5 md:h-5" /> General Settings
                    </h3>
                    <div className="space-y-3">
                      <ModelInfo label="STT" value="Whisper (English)" />
                      <ModelInfo label="STT Fallback" value="VOSK (English)" />
                      <ModelInfo label="TTS" value="Piper (English Female)" />
                      <ModelInfo label="TTS Fallback" value="pyttsx3" />
                    </div>
                  </div>

                  {/* Advanced Configuration (Telegram & Email) */}
                  <div className={cn("p-4 md:p-6 rounded-2xl md:rounded-3xl border bg-card border-border shadow-sm space-y-4 md:space-y-6 md:col-span-2")}>
                    <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
                      <Wrench size={18} className="text-amber-500 md:w-5 md:h-5" /> External Integrations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-4">
                        <h4 className="text-xs md:text-sm font-bold flex items-center gap-2 opacity-70">
                          <Bot size={14} className="text-blue-500 md:w-4 md:h-4" /> Telegram Bot
                        </h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Bot Token</label>
                            <div className="relative">
                              <input 
                                type={editingFields.tgToken ? "text" : "password"} 
                                value={settings.tgToken}
                                readOnly={!editingFields.tgToken}
                                onChange={(e) => setSettings(s => ({...s, tgToken: e.target.value}))}
                                className={cn(
                                  "w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none transition-all",
                                  editingFields.tgToken ? "ring-2 ring-primary/20 border-primary/50" : "opacity-70"
                                )}
                                placeholder="••••••••••••••••"
                              />
                              <button 
                                onClick={() => setEditingFields(f => ({...f, tgToken: !f.tgToken}))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-lg text-primary transition-all shadow-sm hover:shadow-md border border-border/50"
                              >
                                {editingFields.tgToken ? <Check size={14} className="text-emerald-500" /> : <Pencil size={14} />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Chat ID</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                value={settings.tgChatId}
                                readOnly={!editingFields.tgChatId}
                                onChange={(e) => setSettings(s => ({...s, tgChatId: e.target.value}))}
                                className={cn(
                                  "w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none transition-all",
                                  editingFields.tgChatId ? "ring-2 ring-primary/20 border-primary/50" : "opacity-70"
                                )}
                                placeholder="123456789"
                              />
                              <button 
                                onClick={() => setEditingFields(f => ({...f, tgChatId: !f.tgChatId}))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-lg text-primary transition-all shadow-sm hover:shadow-md border border-border/50"
                              >
                                {editingFields.tgChatId ? <Check size={14} className="text-emerald-500" /> : <Pencil size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold flex items-center gap-2 opacity-70">
                          <MessageSquare size={16} className="text-emerald-500" /> Email Setup
                        </h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                              <input 
                                type="email" 
                                value={settings.email}
                                readOnly={!editingFields.email}
                                onChange={(e) => setSettings(s => ({...s, email: e.target.value}))}
                                className={cn(
                                  "w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none transition-all",
                                  editingFields.email ? "ring-2 ring-primary/20 border-primary/50" : "opacity-70"
                                )}
                                placeholder="user@gmail.com"
                              />
                              <button 
                                onClick={() => setEditingFields(f => ({...f, email: !f.email}))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-lg text-primary transition-all shadow-sm hover:shadow-md border border-border/50"
                              >
                                {editingFields.email ? <Check size={14} className="text-emerald-500" /> : <Pencil size={14} />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold opacity-50 uppercase tracking-widest">App Password</label>
                            <div className="relative">
                              <input 
                                type={editingFields.emailPass ? "text" : "password"} 
                                value={settings.emailPass}
                                readOnly={!editingFields.emailPass}
                                onChange={(e) => setSettings(s => ({...s, emailPass: e.target.value}))}
                                className={cn(
                                  "w-full bg-background border border-border rounded-xl px-4 py-2 text-sm outline-none transition-all",
                                  editingFields.emailPass ? "ring-2 ring-primary/20 border-primary/50" : "opacity-70"
                                )}
                                placeholder="•••• •••• •••• ••••"
                              />
                              <button 
                                onClick={() => setEditingFields(f => ({...f, emailPass: !f.emailPass}))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded-lg text-primary transition-all shadow-sm hover:shadow-md border border-border/50"
                              >
                                {editingFields.emailPass ? <Check size={14} className="text-emerald-500" /> : <Pencil size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEditingFields({ tgToken: false, tgChatId: false, email: false, emailPass: false })}
                      className="w-full py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      SAVE ALL CONFIGURATIONS
                    </button>
                  </div>

                  {/* About Section */}
                  <div className={cn("p-6 rounded-3xl border bg-card border-border shadow-sm space-y-6 md:col-span-2")}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                        <span className="text-2xl font-bold text-white">MJ</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">MJ Personal Assistant</h3>
                        <p className="text-sm text-muted-foreground">Next-generation local AI control system.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <AboutRow label="Version" value="2.0.0" isDarkMode={isDarkMode} />
                      <AboutRow label="Brain" value="Gemini 3.1 Pro" isDarkMode={isDarkMode} />
                      <AboutRow label="Voice In" value="Whisper Hybrid" isDarkMode={isDarkMode} />
                      <AboutRow label="Voice Out" value="Piper TTS" isDarkMode={isDarkMode} />
                      <AboutRow label="Memory" value="90-day Sync" isDarkMode={isDarkMode} />
                      <AboutRow label="Security" value="Active Defense" isDarkMode={isDarkMode} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Global Assistant Overlay */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-[100] flex justify-center pt-4">
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="bg-card/80 backdrop-blur-md border border-border px-8 py-4 rounded-full shadow-2xl flex items-center gap-6 pointer-events-auto"
            >
              <AssistantVisualizer type={selectedVisualizer} active={true} />
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-primary animate-pulse">MJ is thinking...</span>
                <span className="text-[10px] opacity-50">Processing your request</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, usedValue, totalValue, color, isDarkMode }: any) {
  const colorMap: Record<string, { text: string, bg: string }> = {
    blue: { text: 'text-blue-500', bg: 'bg-blue-500' },
    rose: { text: 'text-rose-500', bg: 'bg-rose-500' },
    amber: { text: 'text-amber-500', bg: 'bg-amber-500' },
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500' },
  };

  const colors = colorMap[color] || { text: 'text-primary', bg: 'bg-primary' };

  return (
    <div className={cn(
      "p-4 md:p-6 rounded-2xl md:rounded-3xl border transition-all group",
      "bg-card border-border shadow-sm hover:shadow-md"
    )}>
      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
        <div className={cn("p-1.5 md:p-2 rounded-lg md:rounded-xl", isDarkMode ? "bg-white/5" : "bg-black/5", colors.text)}>
          <Icon size={18} className="md:w-5 md:h-5" />
        </div>
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest opacity-50 truncate">{label}</span>
      </div>
      <div className="text-xl md:text-3xl font-bold tracking-tight">{value}</div>
      <div className={cn("mt-3 md:mt-4 h-1 md:h-1.5 w-full rounded-full overflow-hidden", isDarkMode ? "bg-white/5" : "bg-black/5")}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: value }}
          className={cn("h-full rounded-full", colors.bg)}
        />
      </div>
      {(usedValue || totalValue) && (
        <div className="mt-2 flex justify-between text-[9px] md:text-[10px] font-bold opacity-50 uppercase tracking-tighter">
          <span>{usedValue || '0'}</span>
          <span>{totalValue || '100%'}</span>
        </div>
      )}
    </div>
  );
}

function AssistantVisualizer({ type, active }: { type: string, active: boolean }) {
  if (!active) return null;

  switch (type) {
    case 'pulse':
      return (
        <div className="relative w-12 h-12 flex items-center justify-center">
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-full h-full bg-primary rounded-full"
          />
          <div className="w-6 h-6 bg-primary rounded-full shadow-lg shadow-primary/50" />
        </div>
      );
    case 'wave':
      return (
        <div className="flex items-center gap-1 h-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              animate={{ height: [8, 24, 8] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
              className="w-1 bg-primary rounded-full"
            />
          ))}
        </div>
      );
    case 'bars':
      return (
        <div className="flex items-end gap-1 h-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              animate={{ height: [4, Math.random() * 24 + 4, 4] }}
              transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.05 }}
              className="w-1.5 bg-primary rounded-t-sm"
            />
          ))}
        </div>
      );
    case 'liquid':
      return (
        <motion.div
          animate={{ 
            borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 40% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 bg-gradient-to-br from-primary to-rose-400 shadow-xl shadow-primary/30"
        />
      );
    case 'aura':
      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 90, 180, 270, 360],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-full bg-gradient-to-tr from-primary via-purple-500 to-blue-500 rounded-full blur-xl"
          />
          <div className="w-4 h-4 bg-white rounded-full z-10 shadow-lg" />
        </div>
      );
    case 'orbit':
      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/50" />
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 2 + i, repeat: Infinity, ease: "linear" }}
              className="absolute w-full h-full"
            >
              <motion.div 
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                className={cn(
                  "absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full",
                  i === 1 ? "bg-blue-400" : i === 2 ? "bg-rose-400" : "bg-emerald-400"
                )} 
              />
            </motion.div>
          ))}
        </div>
      );
    case 'vortex':
      return (
        <div className="relative w-16 h-16 flex items-center justify-center">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              animate={{ rotate: -360, scale: [1, 0.5, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
              className="absolute border-t-2 border-primary rounded-full"
              style={{ width: `${i * 25}%`, height: `${i * 25}%` }}
            />
          ))}
        </div>
      );
    case 'cyber':
      return (
        <div className="w-24 h-12 flex items-center justify-center">
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <motion.path
              d="M0,20 L20,20 L25,10 L35,30 L40,20 L60,20 L65,5 L75,35 L80,20 L100,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary"
              strokeDasharray="200"
              animate={{ strokeDashoffset: [200, 0, -200] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.path
              d="M0,20 L20,20 L25,10 L35,30 L40,20 L60,20 L65,5 L75,35 L80,20 L100,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-primary/20 blur-sm"
              strokeDasharray="200"
              animate={{ strokeDashoffset: [200, 0, -200] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </svg>
        </div>
      );
    default:
      return null;
  }
}

function ProcessRow({ name, pid, cpu, mem, active, isDarkMode }: any) {
  return (
    <div className={cn(
      "grid grid-cols-4 py-1.5 md:py-2 px-2 rounded-lg transition-colors text-[10px] md:text-sm",
      active ? "bg-primary/10 text-primary" : "hover:bg-accent"
    )}>
      <span className="font-bold truncate">{name}</span>
      <span className="opacity-50">{pid}</span>
      <span className={cn(active ? "text-emerald-500" : "")}>{cpu}</span>
      <span className="truncate">{mem}</span>
    </div>
  );
}

function AboutRow({ label, value, isDarkMode }: any) {
  return (
    <div className={cn(
      "flex flex-col gap-1 p-4 rounded-2xl border transition-colors",
      "bg-background border-border"
    )}>
      <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function PermissionToggle({ icon: Icon, label, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border hover:bg-accent transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={cn(
          "w-12 h-6 rounded-full p-1 transition-colors duration-200",
          checked ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
        )}
      >
        <div className={cn(
          "w-4 h-4 bg-white rounded-full transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

function SecurityStat({ label, value, color }: any) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-2xl bg-background border border-border">
      <span className="text-[10px] uppercase tracking-widest opacity-50 font-bold">{label}</span>
      <span className={cn("text-sm font-bold", color)}>{value}</span>
    </div>
  );
}

function ModelInfo({ label, value }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
      <span className="text-xs font-bold opacity-50 uppercase">{label}</span>
      <span className="text-sm font-medium text-emerald-500">✓ {value}</span>
    </div>
  );
}
