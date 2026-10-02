import React from 'react';
import { Mic, Square, Play, ShieldCheck, Cpu } from 'lucide-react';
import { DictationSnapshot } from '../../core/dictation/DictationService';
import { ActiveAppContext, AIProviderType } from '../../types';

interface HeaderProps {
  snapshot: DictationSnapshot;
  activeContext: ActiveAppContext;
  activeProvider: AIProviderType;
  onToggleDictation: () => void;
  onRunTestSuite: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  snapshot,
  activeContext,
  activeProvider,
  onToggleDictation,
  onRunTestSuite
}) => {
  const isRecording = snapshot.state === 'RECORDING';

  return (
    <header className="h-14 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-20">
      {/* Zone 1: Brand title (single text element wordmark in display face) */}
      <div className="flex items-center gap-3">
        <a href="#home" className="text-base font-display font-black tracking-tight text-white hover:text-cyan-400 transition-colors">
          Vocalis Voice Studio
        </a>
      </div>

      {/* Zone 2: Nav / Context & Provider Status Indicators */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-mono">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-medium capitalize">
            {activeProvider.replace('_', ' ')}
          </span>
        </div>

        <span aria-hidden="true" className="text-slate-700">·</span>

        <div className="flex items-center gap-1.5 truncate max-w-xs">
          <span className="text-slate-500">Target:</span>
          <span className="text-slate-200 font-medium truncate">{activeContext.appName}</span>
        </div>

        <span aria-hidden="true" className="text-slate-700">·</span>

        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Local-First</span>
        </div>
      </div>

      {/* Zone 3: 1-2 Primary Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onRunTestSuite}
          className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700/60 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Run automated unit test suite"
        >
          <Play className="w-3 h-3 text-cyan-400" />
          <span>Run Tests</span>
        </button>

        <button
          onClick={onToggleDictation}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Dictating</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Start Dictating</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
