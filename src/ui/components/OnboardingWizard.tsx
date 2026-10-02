import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Mic, 
  Cpu, 
  Globe, 
  Flame, 
  Keyboard, 
  Check, 
  Sparkles,
  Volume2
} from 'lucide-react';
import { AIProviderType } from '../../types';
import { storageService } from '../../core/storage/StorageService';
import { providerManager } from '../../core/providers/ProviderManager';
import { audioCaptureService } from '../../core/audio/AudioCaptureService';
import { AudioVisualizer } from './AudioVisualizer';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderType>('local');
  const [localPath, setLocalPath] = useState('C:\\Models\\whisper-base-q4.bin');
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [apiModelId, setApiModelId] = useState('whisper-1');
  const [hfToken, setHfToken] = useState('');
  const [hfModelId, setHfModelId] = useState('openai/whisper-large-v3-turbo');
  const [shortcutKey, setShortcutKey] = useState('Alt+D');

  // Mic test state
  const [micTesting, setMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micPassed, setMicPassed] = useState(false);

  // Provider test state
  const [testingProvider, setTestingProvider] = useState(false);
  const [providerTestResult, setProviderTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const totalSteps = 8;

  const handleStartMicTest = async () => {
    try {
      setMicTesting(true);
      const settings = storageService.getAudioSettings();
      await audioCaptureService.startRecording(
        settings,
        (data) => {
          setMicLevel(data.volume);
          if (data.volume > 0.08) {
            setMicPassed(true);
          }
        }
      );
    } catch (e) {
      alert(`Microphone permission error: ${String(e)}`);
      setMicTesting(false);
    }
  };

  const handleStopMicTest = async () => {
    setMicTesting(false);
    await audioCaptureService.stopRecording();
  };

  const handleTestProvider = async () => {
    setTestingProvider(true);
    setProviderTestResult(null);

    // Save temporary configs
    const provs = storageService.getProviders();
    provs.activeProvider = selectedProvider;
    if (selectedProvider === 'local') {
      provs.local.modelPath = localPath;
    } else if (selectedProvider === 'direct_api') {
      provs.direct_api.baseUrl = apiBaseUrl;
      provs.direct_api.apiKey = apiKey;
      provs.direct_api.modelId = apiModelId;
    } else if (selectedProvider === 'huggingface') {
      provs.huggingface.token = hfToken;
      provs.huggingface.modelId = hfModelId;
    }
    storageService.setProviders(provs);

    try {
      const res = await providerManager.testProviderConnection(selectedProvider);
      setProviderTestResult({ success: res.healthy, message: res.message });
    } catch (e) {
      setProviderTestResult({ success: false, message: (e as Error)?.message || 'Test failed' });
    } finally {
      setTestingProvider(false);
    }
  };

  const handleFinish = () => {
    // Save all configurations
    const provs = storageService.getProviders();
    provs.activeProvider = selectedProvider;
    if (selectedProvider === 'local') {
      provs.local.modelPath = localPath;
      provs.local.loaded = true;
    } else if (selectedProvider === 'direct_api') {
      provs.direct_api.baseUrl = apiBaseUrl;
      provs.direct_api.apiKey = apiKey;
      provs.direct_api.modelId = apiModelId;
    } else if (selectedProvider === 'huggingface') {
      provs.huggingface.token = hfToken;
      provs.huggingface.modelId = hfModelId;
    }
    storageService.setProviders(provs);

    const shortcuts = storageService.getShortcutSettings();
    shortcuts.globalToggleKey = shortcutKey;
    storageService.setShortcutSettings(shortcuts);

    storageService.setFirstRunCompleted(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Progress bar */}
        <div className="px-8 pt-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              <span>Step {step} of {totalSteps}</span>
              <span>·</span>
              <span>Initial Setup</span>
            </div>
            <h2 className="text-xl font-display font-bold text-white mt-1">
              {step === 1 && 'Welcome to Vocalis'}
              {step === 2 && 'Microphone Access & Audio Setup'}
              {step === 3 && 'Choose Your AI Processing Option'}
              {step === 4 && 'Configure Selected AI Provider'}
              {step === 5 && 'Verify Microphone Audio Capture'}
              {step === 6 && 'Test AI Provider Endpoint'}
              {step === 7 && 'Configure Global Dictation Hotkey'}
              {step === 8 && 'Setup Complete & Ready'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === step ? 'w-6 bg-cyan-400' : i + 1 < step ? 'w-2 bg-emerald-400' : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content body */}
        <div className="p-8 overflow-y-auto flex-1 text-slate-300 text-sm">
          {/* STEP 1: Welcome */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200">
                <p className="font-medium text-base text-cyan-100">
                  Model-agnostic, system-wide voice dictation engine.
                </p>
                <p className="text-xs text-cyan-300/80 mt-1">
                  Transcribe speech at the speed of thought, apply context-aware formatting, and insert text directly into any desktop text field.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-2">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-100 text-xs">No Model Lock-In</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Bring your own weights or use local/remote endpoints. Replace models anytime.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-100 text-xs">Context-Aware</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Understands code editors, email clients, terminal syntax, and personal snippets.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-100 text-xs">Zero Pricing / Billing</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Strictly free, local-first software. No subscription, no telemetry, no payment system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Mic permissions */}
          {step === 2 && (
            <div className="space-y-4">
              <p>
                Vocalis needs access to your microphone to capture spoken voice commands and dictation streams.
              </p>
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                  <Mic className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100">Microphone Input</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hardware audio processing with real-time echo cancellation, noise suppression, and voice activity detection (VAD).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Choose AI provider */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Choose one of the EXACT THREE supported AI provider categories. The app never hard-codes or enforces a specific model.
              </p>

              <div className="space-y-3">
                {/* Provider A */}
                <div
                  onClick={() => setSelectedProvider('local')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedProvider === 'local'
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md'
                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">A. Local Model</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Runs offline on your machine (Whisper.cpp, Ollama, native ONNX, or local server).
                        </div>
                      </div>
                    </div>
                    {selectedProvider === 'local' && <Check className="w-5 h-5 text-cyan-400" />}
                  </div>
                </div>

                {/* Provider B */}
                <div
                  onClick={() => setSelectedProvider('direct_api')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedProvider === 'direct_api'
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md'
                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">B. Direct API</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Connect to any OpenAI-compatible API endpoint, custom inference proxy, or private gateway.
                        </div>
                      </div>
                    </div>
                    {selectedProvider === 'direct_api' && <Check className="w-5 h-5 text-cyan-400" />}
                  </div>
                </div>

                {/* Provider C */}
                <div
                  onClick={() => setSelectedProvider('huggingface')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedProvider === 'huggingface'
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md'
                      : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 text-sm">C. Hugging Face API</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Use Hugging Face Serverless Inference or Dedicated Inference Endpoints with your HF Token.
                        </div>
                      </div>
                    </div>
                    {selectedProvider === 'huggingface' && <Check className="w-5 h-5 text-cyan-400" />}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Configure provider */}
          {step === 4 && (
            <div className="space-y-4">
              {selectedProvider === 'local' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-200">
                    Local Model Path / Directory:
                  </label>
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    placeholder="e.g. C:\Models\whisper-base-q4.bin"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-xs text-slate-400">
                    Point to your local Whisper GGML/GGUF weights or local inference directory.
                  </p>
                </div>
              )}

              {selectedProvider === 'direct_api' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      API Base URL:
                    </label>
                    <input
                      type="text"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder="https://api.openai.com/v1"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      API Key:
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Model Identifier:
                    </label>
                    <input
                      type="text"
                      value={apiModelId}
                      onChange={(e) => setApiModelId(e.target.value)}
                      placeholder="whisper-1"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {selectedProvider === 'huggingface' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Hugging Face User Access Token:
                    </label>
                    <input
                      type="password"
                      value={hfToken}
                      onChange={(e) => setHfToken(e.target.value)}
                      placeholder="hf_..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Model / Repository Identifier:
                    </label>
                    <input
                      type="text"
                      value={hfModelId}
                      onChange={(e) => setHfModelId(e.target.value)}
                      placeholder="openai/whisper-large-v3-turbo"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Test mic */}
          {step === 5 && (
            <div className="space-y-4">
              <p>Speak into your microphone to verify hardware audio levels.</p>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-4">
                <AudioVisualizer
                  isRecording={micTesting}
                  audioLevel={micLevel}
                  className="h-12 w-64"
                />

                <div className="flex items-center gap-3">
                  {!micTesting ? (
                    <button
                      onClick={handleStartMicTest}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Start Audio Test</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopMicTest}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-medium text-xs rounded-xl border border-rose-900/40 transition-colors cursor-pointer"
                    >
                      <span>Stop Test</span>
                    </button>
                  )}
                </div>

                {micPassed && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Microphone audio activity verified!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Test provider */}
          {step === 6 && (
            <div className="space-y-4">
              <p>Check connectivity to your selected AI provider ({selectedProvider}).</p>

              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-4">
                <button
                  onClick={handleTestProvider}
                  disabled={testingProvider}
                  className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{testingProvider ? 'Testing Connection...' : 'Run Provider Health Check'}</span>
                </button>

                {providerTestResult && (
                  <div className={`p-3 rounded-xl border text-xs w-full text-center ${
                    providerTestResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-800 text-amber-300'
                  }`}>
                    {providerTestResult.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 7: Shortcut */}
          {step === 7 && (
            <div className="space-y-4">
              <p>Set the global hotkey to start and stop dictation system-wide.</p>

              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Keyboard className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h4 className="font-semibold text-slate-100">Global Toggle Key</h4>
                    <p className="text-xs text-slate-400">Works in any active desktop application</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {['Alt+D', 'Alt+Space', 'Ctrl+Shift+Space'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setShortcutKey(preset)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer ${
                        shortcutKey === preset
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Finish */}
          {step === 8 && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white font-display">You're All Set!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Press <span className="font-mono text-cyan-300 font-semibold">{shortcutKey}</span> anytime to record speech. Vocalis will refine your words, handle self-corrections, and paste the result directly into your focused app.
              </p>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-8 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-100 disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Launch Studio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
