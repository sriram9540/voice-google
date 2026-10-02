import React from 'react';
import {
  Home,
  Mic,
  Cpu,
  BookA,
  FileCode2,
  Palette,
  Keyboard,
  Volume2,
  Layers,
  Shield,
  Sliders,
  Terminal,
  Info,
} from 'lucide-react';

export type PageId =
  | 'home'
  | 'dictation'
  | 'providers'
  | 'dictionary'
  | 'snippets'
  | 'styles'
  | 'shortcuts'
  | 'audio'
  | 'context'
  | 'privacy'
  | 'advanced'
  | 'logs'
  | 'about';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  dictationActive: boolean;
  historyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  dictationActive,
  historyCount
}) => {
  const navItems: { id: PageId; label: string; icon: React.FC<{ className?: string }>; badge?: string | number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dictation', label: 'Dictation', icon: Mic, badge: dictationActive ? 'LIVE' : undefined },
    { id: 'providers', label: 'Models / AI Providers', icon: Cpu },
    { id: 'dictionary', label: 'Dictionary', icon: BookA },
    { id: 'snippets', label: 'Snippets', icon: FileCode2 },
    { id: 'styles', label: 'Writing Styles', icon: Palette },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'audio', label: 'Audio & Devices', icon: Volume2 },
    { id: 'context', label: 'Context / Applications', icon: Layers },
    { id: 'privacy', label: 'Privacy / Local Data', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
    { id: 'logs', label: 'Logs & Diagnostics', icon: Terminal },
    { id: 'about', label: 'About Architecture', icon: Info },
  ];

  return (
    <nav 
      aria-label="Desktop Navigation"
      className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none"
    >
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Dictation Studio
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectPage(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-800/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  item.badge === 'LIVE'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subtle bottom info bar */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Desktop v1.0.0</span>
        <span>{historyCount} transcripts</span>
      </div>
    </nav>
  );
};
