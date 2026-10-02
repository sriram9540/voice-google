import React, { useState } from 'react';
import { 
  Keyboard, 
  Command, 
  Check, 
  RotateCcw, 
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { ShortcutSettings } from '../../types';
import { storageService } from '../../core/storage/StorageService';

export const ShortcutsPage: React.FC = () => {
  const [settings, setSettings] = useState<ShortcutSettings>(() => storageService.getShortcutSettings());
  const [recordingTarget, setRecordingTarget] = useState<keyof ShortcutSettings | null>(null);

  const saveSettings = (updated: ShortcutSettings) => {
    setSettings(updated);
    storageService.setShortcutSettings(updated);
  };

  const handleModeChange = (mode: 'toggle' | 'push_to_talk') => {
    saveSettings({ ...settings, mode });
  };

  const handleKeyRecord = (e: React.KeyboardEvent, target: keyof ShortcutSettings) => {
    e.preventDefault();
    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    if (e.metaKey) parts.push('Cmd');

    let key = e.key;
    if (key === ' ') key = 'Space';
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      return; // Wait for the character key
    }

    parts.push(key.toUpperCase());
    const shortcutStr = parts.join('+');

    saveSettings({
      ...settings,
      [target]: shortcutStr
    });
    setRecordingTarget(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-display font-black text-white">Global Keyboard Shortcuts</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure system-wide hotkeys and toggle modes to activate dictation from any active window.
        </p>
      </div>

      {/* Mode selection card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Dictation Activation Mode</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleModeChange('toggle')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              settings.mode === 'toggle'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-white">Toggle Mode (Recommended)</span>
              {settings.mode === 'toggle' && <Check className="w-4 h-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400">
              Press once to start dictating. Press again or let silence auto-stop to insert finalized text.
            </p>
          </button>

          <button
            onClick={() => handleModeChange('push_to_talk')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              settings.mode === 'push_to_talk'
                ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-white">Push-to-Talk (Hold Key)</span>
              {settings.mode === 'push_to_talk' && <Check className="w-4 h-4 text-cyan-400" />}
            </div>
            <p className="text-xs text-slate-400">
              Hold down the hotkey while speaking. Release key to immediately stop recording and insert text.
            </p>
          </button>
        </div>
      </div>

      {/* Key bindings list */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800">
        {/* Toggle / Push-to-Talk Key */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-xs text-white">Global Dictation Hotkey</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Primary shortcut to initiate recording from anywhere on your desktop.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {recordingTarget === 'globalToggleKey' ? (
              <input
                type="text"
                autoFocus
                placeholder="Press key combo..."
                onKeyDown={(e) => handleKeyRecord(e, 'globalToggleKey')}
                onBlur={() => setRecordingTarget(null)}
                className="px-4 py-1.5 bg-cyan-950 border border-cyan-500 rounded-lg text-xs font-mono text-cyan-300 animate-pulse text-center w-36"
              />
            ) : (
              <button
                onClick={() => setRecordingTarget('globalToggleKey')}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-cyan-400 shadow-sm cursor-pointer transition-colors"
              >
                {settings.globalToggleKey}
              </button>
            )}

            <div className="hidden md:flex items-center gap-1">
              {['Alt+D', 'Alt+Space', 'Ctrl+Shift+Space'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => saveSettings({ ...settings, globalToggleKey: preset })}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[11px] font-mono cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cancel Shortcut */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-xs text-white">Cancel Dictation Shortcut</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly aborts audio recording and discards pending transcription.
            </p>
          </div>

          <div>
            {recordingTarget === 'cancelKey' ? (
              <input
                type="text"
                autoFocus
                placeholder="Press key..."
                onKeyDown={(e) => handleKeyRecord(e, 'cancelKey')}
                onBlur={() => setRecordingTarget(null)}
                className="px-4 py-1.5 bg-cyan-950 border border-cyan-500 rounded-lg text-xs font-mono text-cyan-300 animate-pulse text-center w-28"
              />
            ) : (
              <button
                onClick={() => setRecordingTarget('cancelKey')}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-200 cursor-pointer transition-colors"
              >
                {settings.cancelKey}
              </button>
            )}
          </div>
        </div>

        {/* Developer Mode Shortcut */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-xs text-white">Developer / Code Mode Toggle</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Quick toggle for camelCase, snake_case, CLI flags, and function identifier formatting.
            </p>
          </div>

          <div>
            {recordingTarget === 'developerModeKey' ? (
              <input
                type="text"
                autoFocus
                placeholder="Press key..."
                onKeyDown={(e) => handleKeyRecord(e, 'developerModeKey')}
                onBlur={() => setRecordingTarget(null)}
                className="px-4 py-1.5 bg-cyan-950 border border-cyan-500 rounded-lg text-xs font-mono text-cyan-300 animate-pulse text-center w-28"
              />
            ) : (
              <button
                onClick={() => setRecordingTarget('developerModeKey')}
                className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-semibold text-slate-200 cursor-pointer transition-colors"
              >
                {settings.developerModeKey}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Helpful note */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          In desktop environments (Windows Win32, macOS Carbon, Linux X11/Wayland), global shortcuts are registered at the operating system kernel level. In this preview web studio, keyboard event hooks intercept these combinations in your browser window.
        </p>
      </div>
    </div>
  );
};
