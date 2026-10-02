import React, { useState } from 'react';
import { Mic, Square, X, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { DictationSnapshot } from '../../core/dictation/DictationService';
import { AudioVisualizer } from './AudioVisualizer';

interface FloatingRecordingWidgetProps {
  snapshot: DictationSnapshot;
  onStop: () => void;
  onCancel: () => void;
  onToggle: () => void;
}

export const FloatingRecordingWidget: React.FC<FloatingRecordingWidgetProps> = ({
  snapshot,
  onStop,
  onCancel,
  onToggle
}) => {
  const [minimized, setMinimized] = useState(false);

  // If idle and not recently active, show subtle docked trigger or hide
  const isBusy = snapshot.state !== 'IDLE';

  if (!isBusy && minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/50 transition-all cursor-pointer"
      >
        <Mic className="w-3.5 h-3.5 text-cyan-400" />
        <span>Voice HUD</span>
      </button>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    const tenths = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}.${tenths}`;
  };

  return (
    <aside 
      aria-label="Floating voice HUD"
      className="fixed bottom-6 right-6 z-50 w-88 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-3.5 text-slate-100 transition-all duration-200"
    >
      {/* Top row: Status & Window Controls */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-5 h-5">
            {snapshot.state === 'RECORDING' && (
              <>
                <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
              </>
            )}
            {snapshot.state === 'TRANSCRIBING' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
            {snapshot.state === 'REFINING' && <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />}
            {snapshot.state === 'INSERTING' && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
            {snapshot.state === 'COMPLETED' && <Check className="w-4 h-4 text-emerald-400" />}
            {snapshot.state === 'ERROR' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {snapshot.state === 'CANCELLED' && <X className="w-4 h-4 text-slate-400" />}
            {snapshot.state === 'IDLE' && <span className="inline-block w-2 h-2 rounded-full bg-slate-500" />}
          </div>

          <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
            {snapshot.state === 'IDLE' ? 'Vocalis Standby' : snapshot.state}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
          <span>{formatTime(snapshot.recordingDurationSeconds)}</span>
          <button
            onClick={() => setMinimized(true)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            title="Minimize HUD"
          >
            <span className="text-xs font-mono font-bold leading-none">−</span>
          </button>
        </div>
      </div>

      {/* Middle row: Live waveform & Message */}
      <div className="py-1">
        {snapshot.state === 'RECORDING' ? (
          <div className="flex flex-col gap-1.5">
            <AudioVisualizer
              isRecording={true}
              audioLevel={snapshot.audioLevel}
              className="h-9 w-full"
              barCount={32}
            />
            <p className="text-xs text-cyan-300/80 truncate">
              {snapshot.isSpeaking ? 'Capturing speech...' : 'Listening (silence detection active)...'}
            </p>
          </div>
        ) : (
          <div className="py-1.5">
            <p className="text-xs text-slate-300 leading-relaxed truncate">
              {snapshot.statusMessage || 'Press hotkey or button to dictate'}
            </p>
            {snapshot.finalTranscript && (
              <p className="mt-1 text-xs text-slate-400 italic line-clamp-1 border-l-2 border-cyan-500/40 pl-2">
                "{snapshot.finalTranscript}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {snapshot.developerModeActive && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              DEV MODE
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {snapshot.state === 'RECORDING' ? (
            <>
              <button
                onClick={onCancel}
                className="px-2.5 py-1 text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Done</span>
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Record</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
