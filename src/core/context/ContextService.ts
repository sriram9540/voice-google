/**
 * Context Awareness Service
 * Detects and classifies the active application, window title, focused field, and surrounding text.
 * Gracefully falls back to generic text context if system inspection is restricted.
 */

import { ActiveAppContext, AppCategory, WritingStyleId } from '../../types';
import { logger } from '../logging/LoggingService';

export interface AppProfile {
  appName: string;
  category: AppCategory;
  defaultStyle: WritingStyleId;
  developerMode: boolean;
}

export const KNOWN_APPLICATIONS: Record<string, AppProfile> = {
  'Visual Studio Code': {
    appName: 'Visual Studio Code',
    category: 'code_editor',
    defaultStyle: 'technical',
    developerMode: true
  },
  'Cursor': {
    appName: 'Cursor AI Editor',
    category: 'code_editor',
    defaultStyle: 'technical',
    developerMode: true
  },
  'Windows Terminal': {
    appName: 'Windows Terminal / PowerShell',
    category: 'terminal',
    defaultStyle: 'technical',
    developerMode: true
  },
  'Slack': {
    appName: 'Slack',
    category: 'work_messaging',
    defaultStyle: 'professional',
    developerMode: false
  },
  'Microsoft Teams': {
    appName: 'Microsoft Teams',
    category: 'work_messaging',
    defaultStyle: 'professional',
    developerMode: false
  },
  'Gmail': {
    appName: 'Google Mail',
    category: 'email',
    defaultStyle: 'formal',
    developerMode: false
  },
  'Outlook': {
    appName: 'Microsoft Outlook',
    category: 'email',
    defaultStyle: 'formal',
    developerMode: false
  },
  'Notion': {
    appName: 'Notion Workspace',
    category: 'documentation',
    defaultStyle: 'concise',
    developerMode: false
  },
  'Obsidian': {
    appName: 'Obsidian Notes',
    category: 'notes',
    defaultStyle: 'concise',
    developerMode: false
  },
  'ChatGPT / Claude': {
    appName: 'AI Assistant Interface',
    category: 'ai_chat',
    defaultStyle: 'professional',
    developerMode: true
  },
  'Discord': {
    appName: 'Discord',
    category: 'personal_messaging',
    defaultStyle: 'casual',
    developerMode: false
  },
  'Generic Text Editor': {
    appName: 'Generic Text Editor',
    category: 'generic',
    defaultStyle: 'professional',
    developerMode: false
  }
};

class ContextService {
  private static instance: ContextService;

  private currentContext: ActiveAppContext = {
    appName: 'Visual Studio Code',
    windowTitle: 'App.tsx - Vocalis Desktop - VS Code',
    category: 'code_editor',
    focusedElement: 'monaco-editor',
    surroundingText: 'export const processAudio = async () => {\n  ',
    preferredStyle: 'technical',
    developerModeRecommended: true
  };

  private listeners: ((context: ActiveAppContext) => void)[] = [];

  private constructor() {
    this.setupWindowListeners();
  }

  public static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  private setupWindowListeners(): void {
    if (typeof window === 'undefined') return;

    // Track active focused DOM elements inside the app
    window.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        this.updateFocusedElement(target);
      }
    });
  }

  public getCurrentContext(): ActiveAppContext {
    return { ...this.currentContext };
  }

  public setSimulatedAppContext(appName: string, customTitle?: string): void {
    const profile = KNOWN_APPLICATIONS[appName] || {
      appName,
      category: 'generic' as AppCategory,
      defaultStyle: 'professional' as WritingStyleId,
      developerMode: false
    };

    this.currentContext = {
      appName: profile.appName,
      windowTitle: customTitle || `${profile.appName} - Active Window`,
      category: profile.category,
      preferredStyle: profile.defaultStyle,
      developerModeRecommended: profile.developerMode,
      focusedElement: 'active_input_buffer'
    };

    logger.info('context', `Active application context switched to: ${profile.appName} (${profile.category})`);
    this.notify();
  }

  private updateFocusedElement(el: HTMLElement): void {
    let surrounding = '';
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      surrounding = el.value.substring(Math.max(0, el.selectionStart ? el.selectionStart - 50 : 0), el.selectionStart || 0);
    }

    this.currentContext = {
      ...this.currentContext,
      focusedElement: el.tagName.toLowerCase(),
      surroundingText: surrounding
    };
    this.notify();
  }

  public subscribe(callback: (context: ActiveAppContext) => void): () => void {
    this.listeners.push(callback);
    callback(this.getCurrentContext());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getCurrentContext());
      } catch {
        // Safe silence
      }
    }
  }
}

export const contextService = ContextService.getInstance();
