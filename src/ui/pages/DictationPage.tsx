import React, { useState } from 'react';
import { 
  Mic, 
  Square, 
  RotateCcw, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Code2, 
  Layers
} from 'lucide-react';
import { DictationSnapshot } from '../../core/dictation/DictationService';
import { AudioVisualizer } from '../components/AudioVisualizer';
import { textInsertionService } from '../../core/insertion/TextInsertionService';
import { contextService } from '../../core/context/ContextService';
import { RefinementPipeline } from '../../core/formatting/refinementPipeline';
import { storageService } from '../../core/storage/StorageService';

interface DictationPageProps {
  snapshot: DictationSnapshot;
  onToggleDictation: () => void;
  onCancel: () => void;
  onToggleDevMode: () => void;
}

export const DictationPage: React.FC<DictationPageProps> = ({
  snapshot,
  onToggleDictation,
  onCancel,
  onToggleDevMode
}) => {
  // Test target input element
  const [testFieldText, setTestFieldText] = useState('');
  const [targetType, setTargetType] = useState<'text' | 'textarea' | 'code'>('textarea');
  const [copied, setCopied] = useState(false);
  const [manualSample, setManualSample] = useState('');
  const [manualRefined, setManualRefined] = useState<string | null>(null);

  const isRecording = snapshot.state === 'RECORDING';

  const handleCopyFinal = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSimulateInsert = async () => {
    const textToInsert = snapshot.finalTranscript || manualRefined || 'Hello from Vocalis Voice Studio!';
    const textarea = document.getElementById('dictation-target-field') as HTMLElement;
    await textInsertionService.insertText(textToInsert, textarea);
  };

  const handleTestSamplePhrase = (phrase: string) => {
    setManualSample(phrase);
    const context = contextService.getCurrentContext();
    const result = RefinementPipeline.process({
      rawTranscript: phrase,
      context,
      style: context.preferredStyle || 'professional',
      dictionary: storageService.getDictionary(),
      snippets: storageService.getSnippets(),
      developerMode: snapshot.developerModeActive || !!context.developerModeRecommended,
      fillerRemovalLevel: 'normal',
      spokenPunctuation: true,
      autoListFormatting: true,
      detectBacktracking: true
    });
    setManualRefined(result.formattedText);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-black text-white">Live Dictation Console</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test audio capture, inspect intermediate refinement stages, and verify direct text insertion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleDevMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer border ${
              snapshot.developerModeActive
                ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Dev Mode: {snapshot.developerModeActive ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Recording Console Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleDictation}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-500'
              }`}
            >
              {isRecording ? <Square className="w-6 h-6 fill-current" /> : <Mic className="w-6 h-6" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  State:
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  snapshot.state === 'RECORDING' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' :
                  snapshot.state === 'ERROR' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                  snapshot.state === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  'bg-slate-800 text-slate-300'
                }`}>
                  {snapshot.state}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {snapshot.statusMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-48">
              <AudioVisualizer isRecording={isRecording} audioLevel={snapshot.audioLevel} className="h-10 w-full" />
            </div>

            {isRecording && (
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Audio VU meter line */}
        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ${
              isRecording ? 'bg-gradient-to-r from-cyan-500 to-emerald-400' : 'bg-slate-800'
            }`}
            style={{ width: `${Math.round(snapshot.audioLevel * 100)}%` }}
          />
        </div>
      </div>

      {/* Target Input Simulation & Pipeline Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Target Application Input Field */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Target Input Field</h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setTargetType('textarea')}
                className={`px-2 py-0.5 rounded cursor-pointer ${targetType === 'textarea' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
              >
                Text Area
              </button>
              <button
                onClick={() => setTargetType('code')}
                className={`px-2 py-0.5 rounded cursor-pointer ${targetType === 'code' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400'}`}
              >
                Code Editor
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Simulated focused window</span>
              <button
                onClick={() => setTestFieldText('')}
                className="text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            <textarea
              id="dictation-target-field"
              rows={7}
              value={testFieldText}
              onChange={(e) => setTestFieldText(e.target.value)}
              placeholder="Focus here and speak, or dictate above. Formatted text will insert into this field directly..."
              className={`w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors ${
                targetType === 'code' ? 'font-mono text-cyan-200' : 'font-sans'
              }`}
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Supports accessibility, simulated paste, and DOM injection.
              </span>
              <button
                onClick={handleSimulateInsert}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Insert Latest Transcript</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick test phrases */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-semibold text-slate-400">
              Sample Voice Utterance Tests (Click to preview pipeline):
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handleTestSamplePhrase('schedule the meeting for 2 pm actually 3 pm')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Self-Correction ("actually 3 pm")
              </button>
              <button
                onClick={() => handleTestSamplePhrase('we should um like basically test the endpoint')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Filler Words ("um like basically")
              </button>
              <button
                onClick={() => handleTestSamplePhrase('groceries one apples two bananas three milk')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                List Detection ("one apples two...")
              </button>
              <button
                onClick={() => handleTestSamplePhrase('declare camel case get user data function')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Dev Mode ("camel case get user data")
              </button>
              <button
                onClick={() => handleTestSamplePhrase('thanks for your help and my email signature')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Snippet ("my email signature")
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Pipeline Inspector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Refinement Pipeline Inspector</h2>
            </div>
            {(snapshot.finalTranscript || manualRefined) && (
              <button
                onClick={() => handleCopyFinal(snapshot.finalTranscript || manualRefined || '')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Formatted Text'}</span>
              </button>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            {/* Raw speech box */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                1. Raw Speech-to-Text Output:
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 font-mono italic min-h-[48px]">
                {snapshot.rawTranscript || manualSample || 'Waiting for spoken voice stream...'}
              </div>
            </div>

            {/* Corrections applied */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                2. Pipeline Transformations Applied:
              </div>
              <div className="space-y-1">
                {(snapshot.refinementResult?.correctionsApplied || ['Backtracking detection active', 'Filler word stripping active', 'Punctuation engine online']).map((cor, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{cor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Formatted Output */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                3. Final Inserted Text:
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-900/40 text-xs text-slate-100 font-sans whitespace-pre-wrap leading-relaxed min-h-[72px]">
                {snapshot.finalTranscript || manualRefined || 'Final refined text will appear here once audio is transcribed.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
