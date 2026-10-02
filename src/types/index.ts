/**
 * Core type definitions for Vocalis Desktop Voice Studio
 */

export type DictationState = 
  | 'IDLE'
  | 'RECORDING'
  | 'TRANSCRIBING'
  | 'REFINING'
  | 'INSERTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ERROR';

export type AIProviderType = 'local' | 'direct_api' | 'huggingface';

export interface AIProviderCapabilities {
  supportsAudioInput: boolean;
  supportsStreaming: boolean;
  supportsRefinement: boolean;
  supportsContext: boolean;
  supportsCancellation: boolean;
  localOffline: boolean;
}

export interface LocalModelConfig {
  modelPath: string;
  engineType: 'whisper_cpp' | 'ollama' | 'local_http' | 'native_onnx' | 'custom_binary';
  inferenceEndpoint?: string; // e.g. http://localhost:8080/v1
  loaded: boolean;
  preloadOnStartup: boolean;
  threadCount: number;
  memoryUsageMb?: number;
  statusMessage?: string;
}

export interface DirectApiConfig {
  baseUrl: string; // e.g. https://api.openai.com/v1 or custom proxy
  apiKey: string;
  modelId: string; // e.g. whisper-1 or custom speech-to-text model
  refinementModelId?: string; // optional separate model for text refinement
  organizationId?: string;
  customHeaders?: Record<string, string>;
  timeoutMs: number;
  maxRetries: number;
}

export interface HuggingFaceConfig {
  token: string;
  modelId: string; // e.g. openai/whisper-large-v3-turbo
  customEndpoint?: string;
  timeoutMs: number;
  waitForModel: boolean; // wait for 503 warm-up
}

export interface ProviderConfigurations {
  activeProvider: AIProviderType;
  local: LocalModelConfig;
  direct_api: DirectApiConfig;
  huggingface: HuggingFaceConfig;
}

export interface RefinementRequest {
  rawTranscript: string;
  context?: ActiveAppContext;
  style: WritingStyleId;
  dictionary: DictionaryEntry[];
  snippets: SnippetEntry[];
  developerMode: boolean;
  fillerRemovalLevel: FillerRemovalLevel;
  spokenPunctuation: boolean;
  autoListFormatting: boolean;
  detectBacktracking: boolean;
}

export interface RefinementResult {
  formattedText: string;
  confidence: number;
  correctionsApplied: string[];
  snippetsExpanded: string[];
  detectedList: boolean;
  processingTimeMs: number;
}

export type FillerRemovalLevel = 'off' | 'conservative' | 'normal' | 'aggressive';

export type WritingStyleId = 
  | 'formal' 
  | 'professional' 
  | 'casual' 
  | 'very_casual' 
  | 'technical' 
  | 'concise' 
  | 'custom';

export interface WritingStyle {
  id: WritingStyleId;
  name: string;
  description: string;
  instructions: string;
  exampleInput: string;
  exampleOutput: string;
  isCustom?: boolean;
}

export interface DictionaryEntry {
  id: string;
  word: string;
  preferredCapitalization: string;
  aliases: string[];
  isTechnical: boolean;
  category?: string;
  createdAt: number;
}

export interface SnippetEntry {
  id: string;
  triggerPhrase: string; // e.g. "my email signature"
  expansion: string;     // e.g. "Best regards,\nJane Doe\nStaff Engineer"
  description: string;
  enabled: boolean;
  isMultiline: boolean;
  createdAt: number;
}

export type AppCategory = 
  | 'email'
  | 'work_messaging'
  | 'personal_messaging'
  | 'documentation'
  | 'notes'
  | 'browser_text'
  | 'ai_chat'
  | 'code_editor'
  | 'terminal'
  | 'generic';

export interface ActiveAppContext {
  appName: string;
  windowTitle: string;
  category: AppCategory;
  urlOrDomain?: string;
  focusedElement?: string;
  surroundingText?: string;
  selectedText?: string;
  cursorPosition?: number;
  preferredStyle?: WritingStyleId;
  developerModeRecommended?: boolean;
}

export type TextInsertionStrategy = 'accessibility_adapter' | 'clipboard_paste' | 'synthetic_dom';

export interface AudioSettings {
  selectedDeviceId: string;
  sampleRate: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  vadSensitivity: number; // 0.0 to 1.0 threshold
  silenceTimeoutMs: number; // auto-stop after ms of silence
  inputGain: number; // 0.5 to 2.0
}

export interface ShortcutSettings {
  mode: 'toggle' | 'push_to_talk';
  globalToggleKey: string; // e.g. "Space" with modifier or "Alt+D"
  cancelKey: string;       // e.g. "Escape"
  pauseKey: string;        // e.g. "Alt+P"
  developerModeKey: string;// e.g. "Alt+C"
}

export interface PrivacySettings {
  storeLocalOnly: boolean;
  retainRawAudio: boolean; // default false
  transcriptHistoryDays: number; // 0 = do not retain, 7, 30, -1 = forever
  allowDiagnosticsExport: boolean;
  maskSensitiveWords: boolean;
}

export interface AdvancedSettings {
  insertionStrategyOrder: TextInsertionStrategy[];
  clipboardRestoreDelayMs: number;
  audioBufferSizeKb: number;
  networkTimeoutMs: number;
  developerModeFormatting: {
    preserveCodeIdentifiers: boolean;
    autoDetectSnakeCase: boolean;
    autoDetectCamelCase: boolean;
    formatCliCommands: boolean;
  };
}

export interface TranscriptRecord {
  id: string;
  timestamp: number;
  rawText: string;
  finalText: string;
  provider: AIProviderType;
  durationSeconds: number;
  correctionsCount: number;
  appContext?: {
    appName: string;
    category: AppCategory;
  };
  styleUsed: WritingStyleId;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'audio' | 'provider' | 'formatting' | 'insertion' | 'context' | 'shortcut' | 'storage';
  message: string;
  metadata?: Record<string, unknown>;
}
