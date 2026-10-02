import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Layers, 
  Code2, 
  CheckCircle2, 
  ArrowUpDown 
} from 'lucide-react';
import { AdvancedSettings, TextInsertionStrategy } from '../../types';
import { storageService, DEFAULT_ADVANCED_SETTINGS } from '../../core/storage/StorageService';

export const AdvancedPage: React.FC = () => {
  const [settings, setSettings] = useState<AdvancedSettings>(() => storageService.getAdvancedSettings());

  const saveSettings = (updated: AdvancedSettings) => {
    setSettings(updated);
    storageService.setAdvancedSettings(updated);
  };

  const moveStrategy = (index: number, direction: 'up' | 'down') => {
    const list = [...settings.insertionStrategyOrder];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    saveSettings({ ...settings, insertionStrategyOrder: list });
  };

  const handleResetDefaults = () => {
    saveSettings(DEFAULT_ADVANCED_SETTINGS);
  };

  const getStrategyLabel = (s: TextInsertionStrategy) => {
    switch (s) {
      case 'accessibility_adapter':
        return { name: 'Native Accessibility Adapter', desc: 'Direct OS UI Automation & input insertion' };
      case 'clipboard_paste':
        return { name: 'Clipboard + Paste Simulation', desc: 'Copies to clipboard, pastes, then restores original clipboard' };
      case 'synthetic_dom':
        return { name: 'Synthetic DOM Input Dispatch', desc: 'Dispatches simulated JavaScript input and change events' };
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-black text-white">Advanced Engine Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure text insertion fallback cascades, clipboard restoration timings, and developer mode transformers.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Insertion Strategy Cascade */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Text Insertion Strategy Fallback Cascade</h2>
        </div>
        <p className="text-xs text-slate-400">
          When inserting final text into an active application, Vocalis evaluates strategies sequentially. If a strategy fails or is blocked by an app, it automatically falls back to the next.
        </p>

        <div className="space-y-2 pt-2">
          {settings.insertionStrategyOrder.map((strat, idx) => {
            const meta = getStrategyLabel(strat);
            return (
              <div
                key={strat}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-400 flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-xs text-white">{meta.name}</div>
                    <div className="text-[11px] text-slate-400">{meta.desc}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveStrategy(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    disabled={idx === settings.insertionStrategyOrder.length - 1}
                    onClick={() => moveStrategy(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Numerical Timing Parameters */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <h3 className="text-sm font-semibold text-white">Engine Performance & Latency Budgets</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Clipboard Restore Delay:</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.clipboardRestoreDelayMs} ms</span>
            </div>
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={settings.clipboardRestoreDelayMs}
              onChange={(e) => saveSettings({ ...settings, clipboardRestoreDelayMs: parseInt(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <p className="text-[11px] text-slate-500">How long to wait after simulated paste before restoring original clipboard contents.</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Audio Buffer Chunk Size:</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.audioBufferSizeKb} KB</span>
            </div>
            <input
              type="range"
              min="32"
              max="256"
              step="32"
              value={settings.audioBufferSizeKb}
              onChange={(e) => saveSettings({ ...settings, audioBufferSizeKb: parseInt(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <p className="text-[11px] text-slate-500">Audio stream segment size passed to preprocessing pipeline.</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Network Request Timeout:</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.networkTimeoutMs} ms</span>
            </div>
            <input
              type="range"
              min="5000"
              max="30000"
              step="1000"
              value={settings.networkTimeoutMs}
              onChange={(e) => saveSettings({ ...settings, networkTimeoutMs: parseInt(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <p className="text-[11px] text-slate-500">Maximum wait duration before aborting remote provider queries.</p>
          </div>
        </div>
      </div>

      {/* Developer Mode Formatting Flags */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Developer / Code Mode Syntax Rules</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.developerModeFormatting.preserveCodeIdentifiers}
              onChange={(e) => saveSettings({
                ...settings,
                developerModeFormatting: {
                  ...settings.developerModeFormatting,
                  preserveCodeIdentifiers: e.target.checked
                }
              })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Preserve Technical Identifiers</div>
              <div className="text-[11px] text-slate-500">Prevents code variables and function names from being converted into conversational prose.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.developerModeFormatting.autoDetectCamelCase}
              onChange={(e) => saveSettings({
                ...settings,
                developerModeFormatting: {
                  ...settings.developerModeFormatting,
                  autoDetectCamelCase: e.target.checked
                }
              })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Auto-Detect camelCase Spoken Patterns</div>
              <div className="text-[11px] text-slate-500">Converts "camel case get user data" into getUserData automatically.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.developerModeFormatting.autoDetectSnakeCase}
              onChange={(e) => saveSettings({
                ...settings,
                developerModeFormatting: {
                  ...settings.developerModeFormatting,
                  autoDetectSnakeCase: e.target.checked
                }
              })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Auto-Detect snake_case Spoken Patterns</div>
              <div className="text-[11px] text-slate-500">Converts "snake case api key" into api_key automatically.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.developerModeFormatting.formatCliCommands}
              onChange={(e) => saveSettings({
                ...settings,
                developerModeFormatting: {
                  ...settings.developerModeFormatting,
                  formatCliCommands: e.target.checked
                }
              })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Format CLI Command Flags</div>
              <div className="text-[11px] text-slate-500">Converts "flag save dev" to --save-dev and "flag p" to -p.</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
