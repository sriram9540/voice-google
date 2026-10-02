import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  X, 
  Play, 
  RefreshCw, 
  Layers, 
  Check 
} from 'lucide-react';
import { TestRunner, TestCaseResult } from '../../core/tests/unitTests';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ passed: number; failed: number; results: TestCaseResult[] } | null>(null);

  if (!isOpen) return null;

  const handleExecuteTests = async () => {
    setRunning(true);
    setResults(null);
    try {
      const res = await TestRunner.runAllTests();
      setResults(res);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display font-bold text-white text-base">Automated Engine Test Suite</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Status bar */}
        <div className="p-5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              {results 
                ? `${results.passed} of ${results.passed + results.failed} tests passed` 
                : 'Validates pipelines, self-correction, list formatting, and provider contracts.'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Covers Section 32 automated verification requirements.
            </p>
          </div>

          <button
            onClick={handleExecuteTests}
            disabled={running}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{running ? 'Running Suite...' : 'Run All Tests'}</span>
          </button>
        </div>

        {/* Results scroll area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2">
          {!results && !running && (
            <div className="p-8 text-center text-slate-500 text-xs">
              Click "Run All Tests" above to execute the automated verification suite.
            </div>
          )}

          {results?.results.map((r) => (
            <div
              key={r.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                r.passed
                  ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                  : 'bg-rose-950/30 border-rose-900/60 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {r.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <span>{r.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">[{r.suite}]</span>
                  </div>
                  {r.expected && (
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">
                      Expected: <span className="text-slate-300">{r.expected}</span>
                    </div>
                  )}
                  {r.actual && (
                    <div className="text-[11px] text-slate-400 font-mono">
                      Actual: <span className="text-cyan-300">{r.actual}</span>
                    </div>
                  )}
                  {r.error && (
                    <div className="text-[11px] text-rose-400 mt-1 font-mono">
                      Error: {r.error}
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                {r.durationMs}ms
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
