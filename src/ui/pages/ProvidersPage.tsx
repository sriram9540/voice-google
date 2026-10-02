import React, { useState } from 'react';
import { 
  Cpu, 
  Globe, 
  Flame, 
  Check, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { 
  AIProviderType, 
  ProviderConfigurations, 
  LocalModelConfig, 
  DirectApiConfig, 
  HuggingFaceConfig 
} from '../../types';
import { providerManager } from '../../core/providers/ProviderManager';
import { storageService } from '../../core/storage/StorageService';
import { LocalModelProvider } from '../../core/providers/local/LocalModelProvider';

interface ProvidersPageProps {
  onProviderChange?: (provider: AIProviderType) => void;
}

export const ProvidersPage: React.FC<ProvidersPageProps> = () => {
  const [providers, setProviders] = useState<ProviderConfigurations>(() => storageService.getProviders());
  const [activeTab, setActiveTab] = useState<AIProviderType>(providers.activeProvider);

  // Masked visibility toggles
  const [showApiKey, setShowApiKey] = useState(false);
  const [showHfToken, setShowHfToken] = useState(false);

  // Test states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ healthy: boolean; message: string; latencyMs?: number } | null>(null);

  // Model loading states for Local
  const [loadingLocal, setLoadingLocal] = useState(false);

  const handleSelectActiveProvider = (type: AIProviderType) => {
    providerManager.setActiveProvider(type);
    setProviders({ ...providers, activeProvider: type });
    setTestResult(null);
  };

  const handleUpdateLocal = (updates: Partial<LocalModelConfig>) => {
    const updated: LocalModelConfig = { ...providers.local, ...updates };
    const newProvs = { ...providers, local: updated };
    setProviders(newProvs);
    storageService.setProviders(newProvs);
  };

  const handleUpdateDirectApi = (updates: Partial<DirectApiConfig>) => {
    const updated: DirectApiConfig = { ...providers.direct_api, ...updates };
    const newProvs = { ...providers, direct_api: updated };
    setProviders(newProvs);
    storageService.setProviders(newProvs);
  };

  const handleUpdateHuggingFace = (updates: Partial<HuggingFaceConfig>) => {
    const updated: HuggingFaceConfig = { ...providers.huggingface, ...updates };
    const newProvs = { ...providers, huggingface: updated };
    setProviders(newProvs);
    storageService.setProviders(newProvs);
  };

  const handleTestConnection = async (type: AIProviderType) => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await providerManager.testProviderConnection(type);
      setTestResult(result);
    } catch (e) {
      setTestResult({
        healthy: false,
        message: (e as Error)?.message || 'Connection test encountered an error.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleLoadLocalModel = async () => {
    setLoadingLocal(true);
    try {
      const localProv = providerManager.getProvider('local') as LocalModelProvider;
      const res = await localProv.loadModel(providers.local);
      handleUpdateLocal({ loaded: true, memoryUsageMb: res.memoryMb, statusMessage: res.message });
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleUnloadLocalModel = async () => {
    setLoadingLocal(true);
    try {
      const localProv = providerManager.getProvider('local') as LocalModelProvider;
      await localProv.unloadModel();
      handleUpdateLocal({ loaded: false, statusMessage: 'Model unloaded from RAM.' });
    } finally {
      setLoadingLocal(false);
    }
  };

  const capabilities = providerManager.getActiveCapabilities();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-display font-black text-white">Models & AI Providers</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Vocalis is completely model-agnostic. Choose from exactly three provider options and configure your own model runtime.
        </p>
      </div>

      {/* Provider Selector Tabs (EXACTLY 3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Option A: Local Model */}
        <button
          onClick={() => { setActiveTab('local'); handleSelectActiveProvider('local'); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'local'
              ? 'bg-slate-900 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">A. Local Model</div>
                <div className="text-[11px] text-slate-400">Offline & On-Device</div>
              </div>
            </div>
            {providers.activeProvider === 'local' && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            )}
          </div>
        </button>

        {/* Option B: Direct API */}
        <button
          onClick={() => { setActiveTab('direct_api'); handleSelectActiveProvider('direct_api'); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'direct_api'
              ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">B. Direct API</div>
                <div className="text-[11px] text-slate-400">OpenAI / Compatible Proxy</div>
              </div>
            </div>
            {providers.activeProvider === 'direct_api' && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            )}
          </div>
        </button>

        {/* Option C: Hugging Face API */}
        <button
          onClick={() => { setActiveTab('huggingface'); handleSelectActiveProvider('huggingface'); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'huggingface'
              ? 'bg-slate-900 border-amber-500 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">C. Hugging Face API</div>
                <div className="text-[11px] text-slate-400">Serverless / Dedicated Inference</div>
              </div>
            </div>
            {providers.activeProvider === 'huggingface' && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 font-semibold">
                <Check className="w-3.5 h-3.5" />
                <span>Active</span>
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Main Configuration Card for Selected Tab */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* TAB A: LOCAL MODEL */}
        {activeTab === 'local' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white">Local Model Settings</h3>
                <p className="text-xs text-slate-400">Run voice inference on your own hardware with no cloud calls.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                  providers.local.loaded ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {providers.local.loaded ? `Loaded (${providers.local.memoryUsageMb} MB)` : 'Unloaded'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Model File or Directory Path:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={providers.local.modelPath}
                    onChange={(e) => handleUpdateLocal({ modelPath: e.target.value })}
                    placeholder="e.g. C:\AI\Models\whisper-base-q4.bin"
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleUpdateLocal({ modelPath: 'C:\\Models\\whisper-large-v3-q5.bin' })}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                    title="Select model file"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Inference Engine Adapter:</label>
                <select
                  value={providers.local.engineType}
                  onChange={(e) => handleUpdateLocal({ engineType: e.target.value as LocalModelConfig['engineType'] })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="whisper_cpp">Whisper.cpp (C++ Native Adapter)</option>
                  <option value="ollama">Ollama Local Server</option>
                  <option value="local_http">Local HTTP Inference Server (vLLM / FastWhisper)</option>
                  <option value="native_onnx">Native ONNX Runtime</option>
                  <option value="custom_binary">Custom Command-line Inference Binary</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Local Inference Endpoint (Optional):</label>
                <input
                  type="text"
                  value={providers.local.inferenceEndpoint || ''}
                  onChange={(e) => handleUpdateLocal({ inferenceEndpoint: e.target.value })}
                  placeholder="http://localhost:8080/v1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">CPU Compute Threads:</label>
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={providers.local.threadCount}
                  onChange={(e) => handleUpdateLocal({ threadCount: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providers.local.preloadOnStartup}
                    onChange={(e) => handleUpdateLocal({ preloadOnStartup: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-600 focus:ring-0"
                  />
                  <span>Preload model weights into RAM on app startup</span>
                </label>
              </div>
            </div>

            {/* Model Management Actions */}
            <div className="flex items-center gap-3 pt-2">
              {!providers.local.loaded ? (
                <button
                  onClick={handleLoadLocalModel}
                  disabled={loadingLocal}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  {loadingLocal ? 'Loading Model...' : 'Load Model into Memory'}
                </button>
              ) : (
                <button
                  onClick={handleUnloadLocalModel}
                  disabled={loadingLocal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  {loadingLocal ? 'Unloading...' : 'Unload from Memory'}
                </button>
              )}

              <button
                onClick={() => handleTestConnection('local')}
                disabled={testing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Validate & Test Model</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB B: DIRECT API */}
        {activeTab === 'direct_api' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Direct API Settings</h3>
              <p className="text-xs text-slate-400">Connect to OpenAI, Deepgram, Groq, or any compatible self-hosted speech endpoint.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">API Base URL:</label>
                <input
                  type="text"
                  value={providers.direct_api.baseUrl}
                  onChange={(e) => handleUpdateDirectApi({ baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">API Key (Protected in Local Secure Memory):</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={providers.direct_api.apiKey}
                    onChange={(e) => handleUpdateDirectApi({ apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Speech-to-Text Model ID:</label>
                <input
                  type="text"
                  value={providers.direct_api.modelId}
                  onChange={(e) => handleUpdateDirectApi({ modelId: e.target.value })}
                  placeholder="whisper-1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Refinement Model ID (Optional):</label>
                <input
                  type="text"
                  value={providers.direct_api.refinementModelId || ''}
                  onChange={(e) => handleUpdateDirectApi({ refinementModelId: e.target.value })}
                  placeholder="gpt-4o-mini"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Organization ID (Optional):</label>
                <input
                  type="text"
                  value={providers.direct_api.organizationId || ''}
                  onChange={(e) => handleUpdateDirectApi({ organizationId: e.target.value })}
                  placeholder="org-..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Request Timeout (ms):</label>
                <input
                  type="number"
                  value={providers.direct_api.timeoutMs}
                  onChange={(e) => handleUpdateDirectApi({ timeoutMs: parseInt(e.target.value) || 15000 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleTestConnection('direct_api')}
                disabled={testing}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test API Connection & Models</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB C: HUGGING FACE API */}
        {activeTab === 'huggingface' && (
          <div className="space-y-5">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">Hugging Face API Settings</h3>
              <p className="text-xs text-slate-400">Connect to Hugging Face Inference API or your own dedicated inference endpoint.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Hugging Face User Access Token:</label>
                <div className="relative">
                  <input
                    type={showHfToken ? 'text' : 'password'}
                    value={providers.huggingface.token}
                    onChange={(e) => handleUpdateHuggingFace({ token: e.target.value })}
                    placeholder="hf_..."
                    className="w-full pl-3.5 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHfToken(!showHfToken)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showHfToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Model / Repository Identifier:</label>
                <input
                  type="text"
                  value={providers.huggingface.modelId}
                  onChange={(e) => handleUpdateHuggingFace({ modelId: e.target.value })}
                  placeholder="openai/whisper-large-v3-turbo"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-300">Custom Inference Endpoint (Optional):</label>
                <input
                  type="text"
                  value={providers.huggingface.customEndpoint || ''}
                  onChange={(e) => handleUpdateHuggingFace({ customEndpoint: e.target.value })}
                  placeholder="https://xyz.endpoints.huggingface.cloud"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 md:col-span-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={providers.huggingface.waitForModel}
                    onChange={(e) => handleUpdateHuggingFace({ waitForModel: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Wait for model if cold-starting on GPU (HTTP 503 retry handler)</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleTestConnection('huggingface')}
                disabled={testing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test Hugging Face Token & Model</span>
              </button>
            </div>
          </div>
        )}

        {/* Test Result Display */}
        {testResult && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            testResult.healthy
              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}>
            {testResult.healthy ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="flex-1">{testResult.message}</span>
            {testResult.latencyMs !== undefined && (
              <span className="font-mono tabular-nums text-slate-400">{testResult.latencyMs}ms</span>
            )}
          </div>
        )}
      </div>

      {/* Active Capabilities Summary */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Capabilities of Active Provider ({providers.activeProvider}):
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
            <div className="text-[11px] text-slate-500">Audio Input</div>
            <div className="font-semibold text-emerald-400 mt-0.5">Supported</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
            <div className="text-[11px] text-slate-500">Streaming</div>
            <div className={`font-semibold mt-0.5 ${capabilities.supportsStreaming ? 'text-emerald-400' : 'text-slate-500'}`}>
              {capabilities.supportsStreaming ? 'Supported' : 'Batch only'}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
            <div className="text-[11px] text-slate-500">Refinement</div>
            <div className="font-semibold text-emerald-400 mt-0.5">Supported</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
            <div className="text-[11px] text-slate-500">Context</div>
            <div className="font-semibold text-emerald-400 mt-0.5">Supported</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
            <div className="text-[11px] text-slate-500">Cancellation</div>
            <div className="font-semibold text-emerald-400 mt-0.5">Supported</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
            <div className="text-[11px] text-slate-500">Offline / Local</div>
            <div className={`font-semibold mt-0.5 ${capabilities.localOffline ? 'text-cyan-400' : 'text-slate-500'}`}>
              {capabilities.localOffline ? '100% Offline' : 'Remote API'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
