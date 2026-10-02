import React, { useState } from 'react';
import { 
  FileCode2, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Check, 
  ToggleLeft, 
  ToggleRight,
  Sparkles
} from 'lucide-react';
import { SnippetEntry } from '../../types';
import { storageService } from '../../core/storage/StorageService';

export const SnippetsPage: React.FC = () => {
  const [snippets, setSnippets] = useState<SnippetEntry[]>(() => storageService.getSnippets());
  const [searchQuery, setSearchQuery] = useState('');

  // New snippet form
  const [newTrigger, setNewTrigger] = useState('');
  const [newExpansion, setNewExpansion] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const saveSnippets = (updated: SnippetEntry[]) => {
    setSnippets(updated);
    storageService.setSnippets(updated);
  };

  const handleAddSnippet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger.trim() || !newExpansion.trim()) return;

    const newEntry: SnippetEntry = {
      id: `snip-${Date.now()}`,
      triggerPhrase: newTrigger.trim(),
      expansion: newExpansion,
      description: newDesc.trim() || 'Custom snippet',
      enabled: true,
      isMultiline: newExpansion.includes('\n'),
      createdAt: Date.now()
    };

    saveSnippets([newEntry, ...snippets]);
    setNewTrigger('');
    setNewExpansion('');
    setNewDesc('');
  };

  const handleDelete = (id: string) => {
    saveSnippets(snippets.filter(s => s.id !== id));
  };

  const handleToggle = (id: string) => {
    saveSnippets(
      snippets.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
    );
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snippets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vocalis_snippets_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            saveSnippets(parsed);
          }
        } catch {
          alert('Invalid JSON snippets file.');
        }
      };
    }
  };

  const filtered = snippets.filter(s =>
    s.triggerPhrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.expansion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-black text-white">Voice Snippets</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice-triggered expansions. Say the trigger phrase during dictation to insert complex multiline templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Add Snippet Box */}
      <form onSubmit={handleAddSnippet} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Create Voice Trigger Snippet</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Spoken Trigger Phrase (What you say):
              </label>
              <input
                type="text"
                required
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                placeholder="e.g. my email signature"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Description / Label:
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Work email sign-off with phone number"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">
              Expanded Replacement Text (Supports multiple lines):
            </label>
            <textarea
              rows={4}
              required
              value={newExpansion}
              onChange={(e) => setNewExpansion(e.target.value)}
              placeholder="Best regards,&#10;Jane Doe&#10;Staff Platform Engineer"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Save Snippet
          </button>
        </div>
      </form>

      {/* Snippets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search triggers or expansions..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {filtered.length} snippets
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.length === 0 ? (
            <div className="md:col-span-2 p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
              No voice snippets found matching query.
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border transition-all ${
                  s.enabled
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-slate-900/40 border-slate-850 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>"{s.triggerPhrase}"</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{s.description}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggle(s.id)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      title={s.enabled ? 'Disable snippet' : 'Enable snippet'}
                    >
                      {s.enabled ? (
                        <ToggleRight className="w-5 h-5 text-cyan-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-28 overflow-y-auto">
                  {s.expansion}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
