import React, { useState } from 'react';
import { 
  Shield, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Lock, 
  Key, 
  EyeOff, 
  FileText 
} from 'lucide-react';
import { PrivacySettings } from '../../types';
import { storageService } from '../../core/storage/StorageService';
import { logger } from '../../core/logging/LoggingService';

export const PrivacyPage: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings>(() => storageService.getPrivacySettings());
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  const saveSettings = (updated: PrivacySettings) => {
    setSettings(updated);
    storageService.setPrivacySettings(updated);
  };

  const handleClearTranscripts = () => {
    if (confirm('Are you sure you want to permanently delete all local transcript history?')) {
      storageService.clearTranscripts();
      setClearedNotice('All local transcripts have been wiped.');
      setTimeout(() => setClearedNotice(null), 3000);
    }
  };

  const handleDeleteCredentials = () => {
    if (confirm('Are you sure you want to delete stored API keys and tokens from local memory?')) {
      storageService.deleteCredentials();
      setClearedNotice('API keys and tokens have been wiped from local storage.');
      setTimeout(() => setClearedNotice(null), 3000);
    }
  };

  const handleExportDiagnostics = () => {
    const bundle = logger.exportDiagnosticBundle();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(bundle);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vocalis_safe_diagnostics_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-display font-black text-white">Privacy & Local Data Management</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Vocalis is built on strict local-first data governance. No telemetry, no cloud accounts, and no payment systems.
        </p>
      </div>

      {clearedNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{clearedNotice}</span>
        </div>
      )}

      {/* Core Privacy Toggles Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Data Retention Policies</h2>
        </div>

        <div className="space-y-4">
          {/* Audio retention */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-xs text-white">Raw Audio Recording Retention</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Never save raw microphone audio files to disk. Audio is discarded immediately after transcription finishes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!settings.retainRawAudio}
                onChange={(e) => saveSettings({ ...settings, retainRawAudio: !e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Transcript History Days */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-xs text-white">Transcript History Retention</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically purge stored transcripts older than this period.
              </p>
            </div>
            <select
              value={settings.transcriptHistoryDays}
              onChange={(e) => saveSettings({ ...settings, transcriptHistoryDays: parseInt(e.target.value) })}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="0">0 Days (Do not save history)</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days (Default)</option>
              <option value="-1">Indefinite (Never auto-purge)</option>
            </select>
          </div>

          {/* Mask Sensitive words */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-xs text-white">Mask Credentials & Tokens in Diagnostics</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically scrub authorization headers, Bearer tokens, and secrets from exportable logs.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Enforced</span>
            </span>
          </div>
        </div>
      </div>

      {/* Wipe & Export Actions */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white">Local Data Erasure & Export</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between gap-3">
            <div>
              <div className="font-semibold text-xs text-slate-200">Clear Transcript History</div>
              <p className="text-xs text-slate-400 mt-1">
                Deletes all recorded dictation items from your browser/desktop storage.
              </p>
            </div>
            <button
              onClick={handleClearTranscripts}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between gap-3">
            <div>
              <div className="font-semibold text-xs text-slate-200">Erase API Credentials</div>
              <p className="text-xs text-slate-400 mt-1">
                Wipes API keys, Hugging Face tokens, and custom endpoints immediately.
              </p>
            </div>
            <button
              onClick={handleDeleteCredentials}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Erase Stored Keys</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col justify-between gap-3">
            <div>
              <div className="font-semibold text-xs text-slate-200">Export Sanitized Diagnostics</div>
              <p className="text-xs text-slate-400 mt-1">
                Download a clean diagnostic JSON file with scrubbed credentials for debugging.
              </p>
            </div>
            <button
              onClick={handleExportDiagnostics}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Safe Logs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
