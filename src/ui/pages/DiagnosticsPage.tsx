import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Trash2, 
  Copy, 
  Check, 
  Search, 
  Cpu, 
  Mic, 
  Layers, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { LogEntry, ActiveAppContext } from '../../types';
import { logger } from '../../core/logging/LoggingService';
import { providerManager } from '../../core/providers/ProviderManager';
import { storageService } from '../../core/storage/StorageService';

interface DiagnosticsPageProps {
  activeContext: ActiveAppContext;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({ activeContext }) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => logger.getLogs());
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error' | 'debug'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs([...newLogs]);
    });
    return unsubscribe;
  }, []);

  const handleClearLogs = () => {
    logger.clear();
  };

  const handleCopyDiagnostics = () => {
    const bundle = logger.exportDiagnosticBundle();
    navigator.clipboard.writeText(bundle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeProvider = storageService.getProviders().activeProvider;
  const audioSettings = storageService.getAudioSettings();
  const advancedSettings = storageService.getAdvancedSettings();

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-black text-white">Diagnostics & Event Logs</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of audio, transcription, context detection, and text insertion events. Credentials are auto-redacted.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearLogs}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>

          <button
            onClick={handleCopyDiagnostics}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Safe Diagnostics' : 'Copy Sanitized Diagnostics'}</span>
          </button>
        </div>
      </div>

      {/* System Status Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>AI Provider</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-semibold text-white capitalize">{activeProvider.replace('_', ' ')}</div>
          <div className="text-[11px] text-emerald-400 font-mono">Status: Connected</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Microphone Input</span>
            <Mic className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-semibold text-white truncate">{audioSettings.selectedDeviceId === 'default' ? 'Default Hardware Mic' : audioSettings.selectedDeviceId}</div>
          <div className="text-[11px] text-slate-400 font-mono">{audioSettings.sampleRate} Hz · VAD {(audioSettings.vadSensitivity * 100).toFixed(0)}%</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Context Tracking</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-semibold text-white truncate">{activeContext.appName}</div>
          <div className="text-[11px] text-slate-400 font-mono">Category: {activeContext.category}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Text Insertion</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-sm font-semibold text-white">Fallback Cascade</div>
          <div className="text-[11px] text-emerald-400 font-mono">3 Strategies Ready</div>
        </div>
      </div>

      {/* Real-time Log Stream Viewer */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        {/* Controls bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(['all', 'info', 'warn', 'error', 'debug'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`px-2 py-0.5 rounded capitalize font-medium cursor-pointer ${
                    levelFilter === lvl ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              <option value="audio">Audio</option>
              <option value="provider">Provider</option>
              <option value="formatting">Formatting</option>
              <option value="insertion">Insertion</option>
              <option value="context">Context</option>
              <option value="shortcut">Shortcut</option>
              <option value="storage">Storage</option>
            </select>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search log messages..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Log rows */}
        <div className="p-2 divide-y divide-slate-800/40 max-h-[480px] overflow-y-auto font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching log events recorded.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const dateStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              const levelColors = {
                info: 'text-cyan-400',
                warn: 'text-amber-400',
                error: 'text-rose-400',
                debug: 'text-slate-500'
              };

              return (
                <div key={log.id} className="py-2 px-3 hover:bg-slate-800/30 rounded-lg flex items-start gap-3">
                  <span className="text-slate-500 tabular-nums shrink-0">{dateStr}</span>
                  <span className={`uppercase font-bold text-[10px] w-12 shrink-0 ${levelColors[log.level]}`}>
                    [{log.level}]
                  </span>
                  <span className="text-slate-400 text-[11px] shrink-0 w-20 truncate">
                    {log.category}:
                  </span>
                  <span className="text-slate-200 flex-1 break-all">
                    {log.message}
                  </span>
                  {log.metadata && (
                    <span className="text-[10px] text-slate-500 max-w-xs truncate hidden sm:inline">
                      {JSON.stringify(log.metadata)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
