import React from 'react';
import { 
  Mic, 
  Square, 
  Cpu, 
  Copy, 
  Check, 
  Clock, 
  ArrowRight,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { DictationSnapshot } from '../../core/dictation/DictationService';
import { ActiveAppContext, AIProviderType, TranscriptRecord } from '../../types';
import { PageId } from '../components/Sidebar';
import { AudioVisualizer } from '../components/AudioVisualizer';

interface HomePageProps {
  snapshot: DictationSnapshot;
  activeContext: ActiveAppContext;
  activeProvider: AIProviderType;
  transcripts: TranscriptRecord[];
  onToggleDictation: () => void;
  onNavigate: (page: PageId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  snapshot,
  activeContext,
  activeProvider,
  transcripts,
  onToggleDictation,
  onNavigate
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const isRecording = snapshot.state === 'RECORDING';

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Hero Action Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/60 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
              <span>System-Wide Voice Dictation</span>
              <span>·</span>
              <span className="text-emerald-400">Engine Ready</span>
            </div>
            <h1 className="text-2xl font-display font-black tracking-tight text-white">
              Speak naturally. Insert anywhere.
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Press the global hotkey to start voice recording. Vocalis automatically cleans up filler words, applies self-corrections, detects lists, formats code identifiers, and inserts text directly into your active window.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            {isRecording && (
              <div className="w-36">
                <AudioVisualizer isRecording={true} audioLevel={snapshot.audioLevel} className="h-8 w-full" />
              </div>
            )}

            <button
              onClick={onToggleDictation}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-950/50'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Dictation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 3 Operational Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Provider Card */}
        <div
          onClick={() => onNavigate('providers')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xs text-slate-500 font-medium">Configured AI Engine</div>
          <div className="text-base font-semibold text-white capitalize mt-0.5">
            {activeProvider.replace('_', ' ')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeProvider === 'local' && 'Offline inference via local weights or local engine adapter.'}
            {activeProvider === 'direct_api' && 'Direct HTTPS connection to custom or OpenAI-compatible endpoint.'}
            {activeProvider === 'huggingface' && 'Hugging Face Inference endpoint with personal HF token.'}
          </p>
        </div>

        {/* Active Context Card */}
        <div
          onClick={() => onNavigate('context')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xs text-slate-500 font-medium">Active App Target</div>
          <div className="text-base font-semibold text-white truncate mt-0.5">
            {activeContext.appName}
          </div>
          <p className="text-xs text-slate-400 mt-1 truncate">
            Category: {activeContext.category.replace('_', ' ')} · Style: {activeContext.preferredStyle || 'professional'}
          </p>
        </div>

        {/* Privacy & Security Card */}
        <div
          onClick={() => onNavigate('privacy')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="text-xs text-slate-500 font-medium">Data Governance</div>
          <div className="text-base font-semibold text-white mt-0.5">
            Zero Payment / Local-First
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Raw audio is never uploaded by default. No cloud account or subscription required.
          </p>
        </div>
      </div>

      {/* Recent Transcriptions Section */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Recent Transcriptions</h2>
          </div>
          <button
            onClick={() => onNavigate('dictation')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Open Dictation Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {transcripts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p>No dictation history recorded yet.</p>
              <p className="mt-1 text-slate-600">Press the Start Dictation button or hotkey to capture your first transcript.</p>
            </div>
          ) : (
            transcripts.slice(0, 5).map((t) => (
              <div key={t.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-400">{t.appContext?.appName || 'Generic App'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t.durationSeconds}s audio</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {t.finalText}
                  </p>
                  {t.rawText !== t.finalText && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                      Raw: "{t.rawText}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(t.id, t.finalText)}
                  className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Copy text"
                >
                  {copiedId === t.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
