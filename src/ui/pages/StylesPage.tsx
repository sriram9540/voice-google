import React, { useState } from 'react';
import { 
  Palette, 
  Sparkles, 
  ArrowRight, 
  Check, 
  RotateCcw,
  Sliders
} from 'lucide-react';
import { WritingStyle, WritingStyleId } from '../../types';
import { storageService } from '../../core/storage/StorageService';
import { RefinementPipeline } from '../../core/formatting/refinementPipeline';

export const StylesPage: React.FC = () => {
  const [styles, setStyles] = useState<WritingStyle[]>(() => storageService.getStyles());
  const [activeStyleId, setActiveStyleId] = useState<WritingStyleId>('professional');

  // Interactive style preview test state
  const [testInput, setTestInput] = useState('hey team gonna push the update tonight hopefully no bugs');
  const [previewOutput, setPreviewOutput] = useState('');

  const activeStyle = styles.find(s => s.id === activeStyleId) || styles[0];

  const handleUpdateCustomInstructions = (instructions: string) => {
    const updated = styles.map(s => s.id === activeStyleId ? { ...s, instructions } : s);
    setStyles(updated);
    storageService.setStyles(updated);
  };

  const handleRunPreview = (styleId: WritingStyleId, text: string) => {
    const res = RefinementPipeline.applyStyleFormatting(text, styleId);
    setPreviewOutput(RefinementPipeline.cleanWhitespaceAndPunctuation(res));
  };

  React.useEffect(() => {
    handleRunPreview(activeStyleId, testInput);
  }, [activeStyleId, testInput]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-display font-black text-white">Writing Styles & Tone</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Provider-independent style engine. Control how transcripts are polished according to context and preference.
        </p>
      </div>

      {/* Style selector cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {styles.map((style) => {
          const isActive = style.id === activeStyleId;
          return (
            <button
              key={style.id}
              onClick={() => setActiveStyleId(style.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 border-cyan-500 shadow-sm ring-1 ring-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-white capitalize">{style.name}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Style Deep Dive Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Active Style Profile
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              {activeStyle.name} Style
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Provider-Independent Contract
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instructions editor */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              Transformation & Formatting Directives:
            </label>
            <textarea
              rows={5}
              value={activeStyle.instructions}
              onChange={(e) => handleUpdateCustomInstructions(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-500">
              These directives are passed inside the structured formatting request regardless of which AI provider is active.
            </p>
          </div>

          {/* Example comparison */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300">Default Baseline Example:</div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">Spoken Input:</span>
                <span className="text-xs text-slate-300 italic">"{activeStyle.exampleInput}"</span>
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/40">
                <span className="text-[10px] uppercase font-semibold text-cyan-400 block mb-1">Refined Result:</span>
                <span className="text-xs text-cyan-200">"{activeStyle.exampleOutput}"</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Transformer Preview */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-semibold text-white">Live Style Sandbox</h4>
            </div>
            <button
              onClick={() => setTestInput('hey team gonna push the update tonight hopefully no bugs')}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sample</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Test Spoken Text:</label>
              <textarea
                rows={3}
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-cyan-400 block mb-1">Transformed Output ({activeStyle.name}):</label>
              <div className="p-2.5 bg-slate-950 border border-cyan-900/50 rounded-xl text-xs text-cyan-100 min-h-[76px] leading-relaxed">
                {previewOutput || 'Type something on the left to see live transform...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
