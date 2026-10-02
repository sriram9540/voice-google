import React, { useState } from 'react';
import { 
  BookA, 
  Plus, 
  Trash2, 
  Search, 
  Download, 
  Upload, 
  Edit3, 
  Check, 
  X,
  Code
} from 'lucide-react';
import { DictionaryEntry } from '../../types';
import { storageService } from '../../core/storage/StorageService';

export const DictionaryPage: React.FC = () => {
  const [entries, setEntries] = useState<DictionaryEntry[]>(() => storageService.getDictionary());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // New word form state
  const [newWord, setNewWord] = useState('');
  const [newCapitalization, setNewCapitalization] = useState('');
  const [newAliases, setNewAliases] = useState('');
  const [newIsTechnical, setNewIsTechnical] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Editing state
  const [editCapitalization, setEditCapitalization] = useState('');
  const [editAliases, setEditAliases] = useState('');
  const [editIsTechnical, setEditIsTechnical] = useState(false);

  const saveEntries = (updated: DictionaryEntry[]) => {
    setEntries(updated);
    storageService.setDictionary(updated);
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;

    const aliasList = newAliases
      .split(',')
      .map(a => a.trim().toLowerCase())
      .filter(Boolean);

    const newEntry: DictionaryEntry = {
      id: `dict-${Date.now()}`,
      word: newWord.trim(),
      preferredCapitalization: newCapitalization.trim() || newWord.trim(),
      aliases: aliasList,
      isTechnical: newIsTechnical,
      category: newCategory.trim() || 'General',
      createdAt: Date.now()
    };

    const updated = [newEntry, ...entries];
    saveEntries(updated);

    // Reset form
    setNewWord('');
    setNewCapitalization('');
    setNewAliases('');
    setNewIsTechnical(false);
    setNewCategory('');
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    saveEntries(updated);
  };

  const startEdit = (entry: DictionaryEntry) => {
    setEditingId(entry.id);
    setEditCapitalization(entry.preferredCapitalization);
    setEditAliases(entry.aliases.join(', '));
    setEditIsTechnical(entry.isTechnical);
  };

  const saveEdit = (id: string) => {
    const updated = entries.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          preferredCapitalization: editCapitalization.trim(),
          aliases: editAliases.split(',').map(a => a.trim().toLowerCase()).filter(Boolean),
          isTechnical: editIsTechnical
        };
      }
      return entry;
    });
    saveEntries(updated);
    setEditingId(null);
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vocalis_dictionary_${new Date().toISOString().slice(0, 10)}.json`);
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
            saveEntries(parsed);
          }
        } catch {
          alert('Invalid JSON dictionary file.');
        }
      };
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.preferredCapitalization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-black text-white">Personal Dictionary</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Teach Vocalis custom terminology, company names, code identifiers, and spoken aliases.
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

      {/* Add Entry Card */}
      <form onSubmit={handleAddWord} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Add Custom Dictionary Term</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Spoken Word / Term:</label>
            <input
              type="text"
              required
              value={newWord}
              onChange={(e) => {
                setNewWord(e.target.value);
                if (!newCapitalization) setNewCapitalization(e.target.value);
              }}
              placeholder="e.g. typescript"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Preferred Capitalization:</label>
            <input
              type="text"
              required
              value={newCapitalization}
              onChange={(e) => setNewCapitalization(e.target.value)}
              placeholder="e.g. TypeScript"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Aliases (comma-separated):</label>
            <input
              type="text"
              value={newAliases}
              onChange={(e) => setNewAliases(e.target.value)}
              placeholder="type script, ts"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium block mb-1">Category (Optional):</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g. Engineering"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsTechnical}
              onChange={(e) => setNewIsTechnical(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <span>Mark as technical / code term (preserves exact syntax in code editors)</span>
          </label>

          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            Add to Dictionary
          </button>
        </div>
      </form>

      {/* Dictionary Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {/* Table header / search bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search words, aliases, or technical terms..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-mono">
            {filteredEntries.length} {filteredEntries.length === 1 ? 'word' : 'words'} active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800/80">
              <tr>
                <th className="px-5 py-3">Spoken Word</th>
                <th className="px-5 py-3">Preferred Output</th>
                <th className="px-5 py-3">Aliases</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                    No matching dictionary entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isEditing = editingId === entry.id;
                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-white">
                        {entry.word}
                      </td>

                      <td className="px-5 py-3 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCapitalization}
                            onChange={(e) => setEditCapitalization(e.target.value)}
                            className="px-2 py-1 bg-slate-950 border border-cyan-500 rounded text-xs text-white"
                          />
                        ) : (
                          <span className="text-cyan-300 font-semibold">{entry.preferredCapitalization}</span>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editAliases}
                            onChange={(e) => setEditAliases(e.target.value)}
                            className="px-2 py-1 bg-slate-950 border border-cyan-500 rounded text-xs text-white w-full"
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {entry.aliases.map((a, i) => (
                              <span key={i} className="text-slate-400 font-mono text-[11px]">
                                "{a}"{i < entry.aliases.length - 1 ? ',' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3">
                        {isEditing ? (
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editIsTechnical}
                              onChange={(e) => setEditIsTechnical(e.target.checked)}
                            />
                            <span>Tech</span>
                          </label>
                        ) : (
                          entry.isTechnical ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
                              <Code className="w-3 h-3" />
                              <span>Code/Tech</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Standard</span>
                          )
                        )}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => saveEdit(entry.id)}
                              className="p-1 text-emerald-400 hover:bg-slate-800 rounded cursor-pointer"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-800 rounded cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => startEdit(entry)}
                              className="p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
