import React, { useState } from 'react';
import { 
  Layers, 
  Code, 
  Mail, 
  MessageSquare, 
  FileText, 
  Terminal, 
  Check, 
  Sparkles,
  Bot
} from 'lucide-react';
import { ActiveAppContext, AppCategory } from '../../types';
import { contextService, KNOWN_APPLICATIONS } from '../../core/context/ContextService';

interface ContextPageProps {
  activeContext: ActiveAppContext;
}

export const ContextPage: React.FC<ContextPageProps> = ({ activeContext }) => {
  const [selectedApp, setSelectedApp] = useState(activeContext.appName);

  const handleSelectApp = (appName: string) => {
    setSelectedApp(appName);
    contextService.setSimulatedAppContext(appName);
  };

  const getCategoryIcon = (cat: AppCategory) => {
    switch (cat) {
      case 'code_editor': return Code;
      case 'terminal': return Terminal;
      case 'email': return Mail;
      case 'work_messaging': return MessageSquare;
      case 'personal_messaging': return MessageSquare;
      case 'documentation': return FileText;
      case 'notes': return FileText;
      case 'ai_chat': return Bot;
      default: return Layers;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-display font-black text-white">Active Application & Context Awareness</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Vocalis inspects your active application and automatically adapts formatting, punctuation, and code identifiers.
        </p>
      </div>

      {/* Current Active Window Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Current Active Window Inspection
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{activeContext.appName}</h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/50">
            {activeContext.category}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Window Title:</span>
            <span className="font-mono text-slate-200 truncate block">{activeContext.windowTitle}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Focused Element:</span>
            <span className="font-mono text-slate-200">{activeContext.focusedElement || 'None'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Associated Style:</span>
            <span className="text-cyan-300 font-semibold capitalize">{activeContext.preferredStyle || 'Professional'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="text-slate-500 block mb-0.5">Developer Formatting:</span>
            <span className={activeContext.developerModeRecommended ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
              {activeContext.developerModeRecommended ? 'Enabled (Auto)' : 'Standard'}
            </span>
          </div>
        </div>
      </div>

      {/* Target Application Profiles Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Application Context Profiles</h3>
          <span className="text-xs text-slate-500">Click any app to test context switching</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(KNOWN_APPLICATIONS).map(([name, profile]) => {
            const Icon = getCategoryIcon(profile.category);
            const isSelected = selectedApp === name;
            return (
              <button
                key={name}
                onClick={() => handleSelectApp(name)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/40 text-cyan-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                </div>

                <div className="font-semibold text-xs text-white truncate">{profile.appName}</div>
                <div className="text-[11px] text-slate-500 capitalize mt-0.5">
                  {profile.category.replace('_', ' ')} · {profile.defaultStyle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Context Rules Explanation */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
          Context Formatting Rules Engine:
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              <span>Code Editors & Terminals</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Preserves variable casing (camelCase, snake_case), command-line flags (--save-dev, -p), and function parentheses without converting into prose sentences.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Email Clients</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Applies natural sentence capitalization, clean greeting salutations, formal or professional diction, and removes verbal conversational filler.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Notes & Documentation</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Automatically detects spoken numbered lists ("one apples two bananas...") and bullets, converting them into cleanly aligned Markdown items.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
