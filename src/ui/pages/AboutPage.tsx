import React, { useState } from 'react';
import { 
  Info, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Code2, 
  Terminal, 
  Check, 
  Copy 
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const [copiedDiagram, setCopiedDiagram] = useState(false);

  const mermaidDiagram = `graph TD
    UI[Desktop UI Layer / Floating HUD] --> State[Application State & Config]
    State --> DictationService[Dictation Service Orchestrator]
    DictationService --> AudioCapture[Audio Pipeline / VAD / Web Audio]
    DictationService --> ProviderManager[AI Provider Manager]
    ProviderManager --> LocalModel[A. Local Model: Whisper.cpp / Ollama / Native]
    ProviderManager --> DirectAPI[B. Direct API: OpenAI-Compatible / Custom]
    ProviderManager --> HuggingFace[C. Hugging Face API: Serverless / Dedicated]
    ProviderManager --> RefinementPipeline[Transcript Refinement Pipeline]
    RefinementPipeline --> Backtracking[Speech Self-Correction Engine]
    RefinementPipeline --> FillerRemoval[Filler Word Stripper]
    RefinementPipeline --> Punctuation[Spoken Punctuation Commands]
    RefinementPipeline --> Dictionary[Personal Dictionary & Aliases]
    RefinementPipeline --> Snippets[Voice-Triggered Snippets]
    RefinementPipeline --> DevMode[Developer Mode / Identifier Formatter]
    RefinementPipeline --> ContextEngine[Active Application & Context Classifier]
    ContextEngine --> TextInsertion[Text Insertion Engine: Accessibility / Clipboard / DOM]
    TextInsertion --> ActiveApp[Focused Text Field in Active Window]`;

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidDiagram);
    setCopiedDiagram(true);
    setTimeout(() => setCopiedDiagram(false), 2000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-display font-black text-white">About Vocalis & Architecture</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Production-grade, model-agnostic voice dictation engine. Designed from first principles for privacy, speed, and cross-application text insertion.
        </p>
      </div>

      {/* Zero Payment Guarantee Banner */}
      <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200 flex items-start gap-4">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-semibold text-sm text-cyan-100">Zero Payment & Billing Guarantee</h3>
          <p className="text-xs text-cyan-300/80 leading-relaxed">
            Vocalis contains strictly zero payment gateways, billing tables, subscription locks, trial limitations, or Stripe/PayPal integrations. It is a genuine free, local-first utility where users bring their own models or endpoints.
          </p>
        </div>
      </div>

      {/* Visual System Architecture Diagram */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">System Architecture (Mermaid)</h2>
          </div>
          <button
            onClick={handleCopyMermaid}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            {copiedDiagram ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDiagram ? 'Copied' : 'Copy Mermaid Source'}</span>
          </button>
        </div>

        {/* Visual Architecture Flow Representation */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-cyan-300 font-semibold shadow-md">
              Desktop UI / Floating Recording HUD (Unobtrusive)
            </div>
          </div>

          <div className="text-center text-slate-600 font-mono">↓ User Hotkey (Alt+D or Push-to-Talk)</div>

          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-medium">
              Audio Pipeline & VAD (Echo Cancellation · Silence Detection)
            </div>
          </div>

          <div className="text-center text-slate-600 font-mono">↓ Captured Speech Audio Buffer</div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center">
              Pluggable AI Provider Manager (EXACTLY 3 OPTIONS)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-900/40 text-center">
                <span className="font-semibold text-cyan-300 block">A. Local Model</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Whisper.cpp / Ollama / Native</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-indigo-900/40 text-center">
                <span className="font-semibold text-indigo-300 block">B. Direct API</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">OpenAI-Compatible / Custom Endpoint</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-amber-900/40 text-center">
                <span className="font-semibold text-amber-300 block">C. Hugging Face API</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Serverless / Dedicated Inference</span>
              </div>
            </div>
          </div>

          <div className="text-center text-slate-600 font-mono">↓ Raw Speech-to-Text String</div>

          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-medium text-center">
              Refinement Engine (Backtracking · Fillers · Punctuation · Snippets · Dictionary · Dev Mode)
            </div>
          </div>

          <div className="text-center text-slate-600 font-mono">↓ Context-Aware Polished Text</div>

          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-semibold text-center">
              Text Insertion Engine (Accessibility Adapter → Clipboard+Restore → DOM Injection)
            </div>
          </div>

          <div className="text-center text-slate-600 font-mono">↓ Active Focused Text Field</div>

          <div className="flex items-center justify-center">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px]">
              Focused Input in Visual Studio Code / Slack / Browser / Terminal
            </div>
          </div>
        </div>

        {/* Mermaid Raw Code Box */}
        <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 overflow-x-auto">
          {mermaidDiagram}
        </pre>
      </div>

      {/* Platform Adapter Strategy & Build Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-white">Platform Adapter Architecture</h4>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The core engine is 100% decoupled from operating system APIs. Platform adapters handle:
          </p>
          <ul className="space-y-1.5 text-slate-300 list-disc list-inside text-[11px]">
            <li><strong className="text-slate-100">Windows:</strong> Win32 SendInput, RegisterHotKey, UI Automation</li>
            <li><strong className="text-slate-100">macOS:</strong> Accessibility API (AXUIElement), Carbon Hotkeys</li>
            <li><strong className="text-slate-100">Linux:</strong> X11 XTest / Wayland virtual keyboard, libinput</li>
            <li><strong className="text-slate-100">Web/Preview:</strong> Web Audio API, KeyboardEvent, Clipboard API</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-white">Build & Packaging Pipeline</h4>
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            To build and package for desktop:
          </p>
          <pre className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
{`# 1. Install dependencies
npm install

# 2. Compile and test
npm run build
npm run lint

# 3. Desktop packaging (Electron/Tauri)
npm run package:win`}
          </pre>
        </div>
      </div>
    </div>
  );
};
