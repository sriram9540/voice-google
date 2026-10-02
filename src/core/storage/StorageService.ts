/**
 * Local-First Storage Service
 * Handles persistence, settings migration, personal dictionary, voice snippets, and transcript history.
 */

import {
  ProviderConfigurations,
  DictionaryEntry,
  SnippetEntry,
  WritingStyle,
  AudioSettings,
  ShortcutSettings,
  PrivacySettings,
  AdvancedSettings,
  TranscriptRecord,
} from '../../types';
import { logger } from '../logging/LoggingService';

export const DEFAULT_PROVIDERS: ProviderConfigurations = {
  activeProvider: 'local',
  local: {
    modelPath: 'C:\\Models\\whisper-base-q4.bin',
    engineType: 'whisper_cpp',
    inferenceEndpoint: 'http://localhost:8080/v1',
    loaded: true,
    preloadOnStartup: false,
    threadCount: 4,
    memoryUsageMb: 248,
    statusMessage: 'Ready for offline voice inference (Whisper C++ runtime adapter)'
  },
  direct_api: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelId: 'whisper-1',
    refinementModelId: 'gpt-4o-mini',
    organizationId: '',
    timeoutMs: 15000,
    maxRetries: 2
  },
  huggingface: {
    token: '',
    modelId: 'openai/whisper-large-v3-turbo',
    timeoutMs: 30000,
    waitForModel: true
  }
};

export const DEFAULT_STYLES: WritingStyle[] = [
  {
    id: 'formal',
    name: 'Formal',
    description: 'Polished, grammatically pristine, complete sentences with refined business vocabulary.',
    instructions: 'Use sophisticated diction, avoid contractions, ensure strict punctuation and professional tone.',
    exampleInput: 'hey team gonna push the update tonight hopefully no bugs',
    exampleOutput: 'Dear Team, I intend to deploy the update this evening and do not anticipate any disruptions.'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clear, modern workplace communication suitable for Slack, Jira, and client emails.',
    instructions: 'Keep sentences direct, respectful, clear, and action-oriented.',
    exampleInput: 'we gotta meet up talk about the roadmap soon',
    exampleOutput: 'We should schedule a brief meeting to review and align on the product roadmap.'
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Friendly, natural, and expressive tone for team chats and quick exchanges.',
    instructions: 'Allow natural contractions, warm phrasing, and concise conversational flow.',
    exampleInput: 'im heading out for lunch be back in an hour',
    exampleOutput: "I'm heading out for lunch, will be back in about an hour!"
  },
  {
    id: 'very_casual',
    name: 'Very Casual',
    description: 'Brisk, informal, lower friction for friends and immediate peer DMs.',
    instructions: 'Ultra brief, relaxed capitalization where appropriate, minimal formalities.',
    exampleInput: 'yeah sounds good talk soon',
    exampleOutput: 'Sounds good, talk soon!'
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Engineering and developer documentation tone with exact terminology and syntax preservation.',
    instructions: 'Preserve variable names, command syntax, API specs, and structured steps.',
    exampleInput: 'run npm install then start the docker container with port 3000',
    exampleOutput: 'Execute `npm install` and start the Docker container mapped to port 3000.'
  },
  {
    id: 'concise',
    name: 'Concise / Bulleted',
    description: 'Zero fluff, condensed bulleted takeaways or 1-sentence executive summaries.',
    instructions: 'Eliminate conversational filler, condense to bullet points or minimal active verbs.',
    exampleInput: 'first we need to audit the database second migrate the schema third test endpoints',
    exampleOutput: '• Audit the database\n• Migrate the schema\n• Test API endpoints'
  },
  {
    id: 'custom',
    name: 'Custom User Style',
    description: 'User-defined persona, terminology, and prompt rules.',
    instructions: 'Preserve user specific instructions, tone, and domain jargon.',
    exampleInput: 'status update for stakeholder review',
    exampleOutput: 'Executive Summary: Weekly delivery targets met on schedule.'
  }
];

export const DEFAULT_DICTIONARY: DictionaryEntry[] = [
  {
    id: 'dict-1',
    word: 'TypeScript',
    preferredCapitalization: 'TypeScript',
    aliases: ['type script', 'typescript'],
    isTechnical: true,
    category: 'Engineering',
    createdAt: Date.now()
  },
  {
    id: 'dict-2',
    word: 'Kubernetes',
    preferredCapitalization: 'Kubernetes',
    aliases: ['k8s', 'coober netties'],
    isTechnical: true,
    category: 'Infrastructure',
    createdAt: Date.now()
  },
  {
    id: 'dict-3',
    word: 'GraphQL',
    preferredCapitalization: 'GraphQL',
    aliases: ['graph ql'],
    isTechnical: true,
    category: 'Engineering',
    createdAt: Date.now()
  },
  {
    id: 'dict-4',
    word: 'PostgreSQL',
    preferredCapitalization: 'PostgreSQL',
    aliases: ['postgres', 'post gress'],
    isTechnical: true,
    category: 'Database',
    createdAt: Date.now()
  },
  {
    id: 'dict-5',
    word: 'WebSocket',
    preferredCapitalization: 'WebSocket',
    aliases: ['web socket', 'web sockets'],
    isTechnical: true,
    category: 'Networking',
    createdAt: Date.now()
  }
];

export const DEFAULT_SNIPPETS: SnippetEntry[] = [
  {
    id: 'snip-1',
    triggerPhrase: 'my email signature',
    expansion: 'Best regards,\nAlex Mercer\nStaff Platform Engineer',
    description: 'Work email sign-off with contact info',
    enabled: true,
    isMultiline: true,
    createdAt: Date.now()
  },
  {
    id: 'snip-2',
    triggerPhrase: 'insert pr template',
    expansion: '## Summary\n- Implemented real-time audio pipeline\n- Added context detection adapter\n\n## Verification\n- Automated unit tests passing',
    description: 'Pull request description checklist',
    enabled: true,
    isMultiline: true,
    createdAt: Date.now()
  },
  {
    id: 'snip-3',
    triggerPhrase: 'insert disclaimer',
    expansion: 'Note: This message is strictly confidential and intended solely for the recipient.',
    description: 'Legal compliance disclaimer notice',
    enabled: true,
    isMultiline: false,
    createdAt: Date.now()
  },
  {
    id: 'snip-4',
    triggerPhrase: 'standup update',
    expansion: 'Yesterday: Refactored provider abstraction.\nToday: Implementing active context classifier.\nBlockers: None.',
    description: 'Daily team standup format',
    enabled: true,
    isMultiline: true,
    createdAt: Date.now()
  }
];

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  selectedDeviceId: 'default',
  sampleRate: 16000,
  echoCancellation: true,
  noiseSuppression: true,
  vadSensitivity: 0.15,
  silenceTimeoutMs: 1800,
  inputGain: 1.0
};

export const DEFAULT_SHORTCUT_SETTINGS: ShortcutSettings = {
  mode: 'toggle',
  globalToggleKey: 'Alt+D',
  cancelKey: 'Escape',
  pauseKey: 'Alt+P',
  developerModeKey: 'Alt+C'
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  storeLocalOnly: true,
  retainRawAudio: false,
  transcriptHistoryDays: 30,
  allowDiagnosticsExport: true,
  maskSensitiveWords: false
};

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  insertionStrategyOrder: ['accessibility_adapter', 'clipboard_paste', 'synthetic_dom'],
  clipboardRestoreDelayMs: 250,
  audioBufferSizeKb: 64,
  networkTimeoutMs: 12000,
  developerModeFormatting: {
    preserveCodeIdentifiers: true,
    autoDetectSnakeCase: true,
    autoDetectCamelCase: true,
    formatCliCommands: true
  }
};

class StorageService {
  private static instance: StorageService;
  private readonly PREFIX = 'vocalis_voice_studio_';

  private constructor() {
    this.enforceRetentionPolicy();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.PREFIX + key);
      if (!stored) return defaultValue;
      return JSON.parse(stored) as T;
    } catch (e) {
      logger.error('storage', `Failed to read key: ${key}`, { error: String(e) });
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (e) {
      logger.error('storage', `Failed to persist key: ${key}`, { error: String(e) });
    }
  }

  public getProviders(): ProviderConfigurations {
    return this.getItem('providers', DEFAULT_PROVIDERS);
  }

  public setProviders(providers: ProviderConfigurations): void {
    this.setItem('providers', providers);
    logger.info('storage', 'Provider configuration updated', { activeProvider: providers.activeProvider });
  }

  public getStyles(): WritingStyle[] {
    return this.getItem('styles', DEFAULT_STYLES);
  }

  public setStyles(styles: WritingStyle[]): void {
    this.setItem('styles', styles);
  }

  public getDictionary(): DictionaryEntry[] {
    return this.getItem('dictionary', DEFAULT_DICTIONARY);
  }

  public setDictionary(dictionary: DictionaryEntry[]): void {
    this.setItem('dictionary', dictionary);
  }

  public getSnippets(): SnippetEntry[] {
    return this.getItem('snippets', DEFAULT_SNIPPETS);
  }

  public setSnippets(snippets: SnippetEntry[]): void {
    this.setItem('snippets', snippets);
  }

  public getAudioSettings(): AudioSettings {
    return this.getItem('audio_settings', DEFAULT_AUDIO_SETTINGS);
  }

  public setAudioSettings(settings: AudioSettings): void {
    this.setItem('audio_settings', settings);
  }

  public getShortcutSettings(): ShortcutSettings {
    return this.getItem('shortcut_settings', DEFAULT_SHORTCUT_SETTINGS);
  }

  public setShortcutSettings(settings: ShortcutSettings): void {
    this.setItem('shortcut_settings', settings);
  }

  public getPrivacySettings(): PrivacySettings {
    return this.getItem('privacy_settings', DEFAULT_PRIVACY_SETTINGS);
  }

  public setPrivacySettings(settings: PrivacySettings): void {
    this.setItem('privacy_settings', settings);
    this.enforceRetentionPolicy();
  }

  public getAdvancedSettings(): AdvancedSettings {
    return this.getItem('advanced_settings', DEFAULT_ADVANCED_SETTINGS);
  }

  public setAdvancedSettings(settings: AdvancedSettings): void {
    this.setItem('advanced_settings', settings);
  }

  public getTranscripts(): TranscriptRecord[] {
    return this.getItem('transcripts', []);
  }

  public addTranscript(record: TranscriptRecord): void {
    const privacy = this.getPrivacySettings();
    if (privacy.transcriptHistoryDays === 0) {
      // User opted out of saving transcripts
      return;
    }
    const current = this.getTranscripts();
    current.unshift(record);
    // Keep max 200 items in history
    if (current.length > 200) {
      current.pop();
    }
    this.setItem('transcripts', current);
  }

  public clearTranscripts(): void {
    this.setItem('transcripts', []);
    logger.info('storage', 'All transcript history cleared by user request');
  }

  public deleteCredentials(): void {
    const providers = this.getProviders();
    providers.direct_api.apiKey = '';
    providers.huggingface.token = '';
    this.setProviders(providers);
    logger.info('storage', 'Secure provider credentials deleted from local storage');
  }

  public isFirstRunCompleted(): boolean {
    return this.getItem('first_run_completed', false);
  }

  public setFirstRunCompleted(completed: boolean): void {
    this.setItem('first_run_completed', completed);
  }

  public enforceRetentionPolicy(): void {
    const privacy = this.getPrivacySettings();
    if (privacy.transcriptHistoryDays === 0) {
      this.setItem('transcripts', []);
      return;
    }
    if (privacy.transcriptHistoryDays > 0) {
      const maxAgeMs = privacy.transcriptHistoryDays * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const current = this.getTranscripts();
      const filtered = current.filter(t => (now - t.timestamp) < maxAgeMs);
      if (filtered.length !== current.length) {
        this.setItem('transcripts', filtered);
        logger.info('storage', `Purged ${current.length - filtered.length} expired transcripts according to retention policy (${privacy.transcriptHistoryDays} days).`);
      }
    }
  }

  public exportAllData(): string {
    const exportData = {
      exportVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      providers: {
        activeProvider: this.getProviders().activeProvider,
        local: this.getProviders().local,
        direct_api: {
          ...this.getProviders().direct_api,
          apiKey: '[EXCLUDED_FOR_SECURITY]'
        },
        huggingface: {
          ...this.getProviders().huggingface,
          token: '[EXCLUDED_FOR_SECURITY]'
        }
      },
      dictionary: this.getDictionary(),
      snippets: this.getSnippets(),
      styles: this.getStyles(),
      audioSettings: this.getAudioSettings(),
      shortcutSettings: this.getShortcutSettings(),
      privacySettings: this.getPrivacySettings(),
      advancedSettings: this.getAdvancedSettings()
    };
    return JSON.stringify(exportData, null, 2);
  }
}

export const storageService = StorageService.getInstance();
