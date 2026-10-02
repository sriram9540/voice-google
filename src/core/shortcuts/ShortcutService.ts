/**
 * Global Keyboard Shortcut Service
 * Handles toggle mode, push-to-talk (hold to record, release to finalize), and shortcut listeners.
 */

import { ShortcutSettings } from '../../types';
import { storageService } from '../storage/StorageService';
import { logger } from '../logging/LoggingService';

export interface ShortcutHandlers {
  onToggleDictation: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancel: () => void;
  onToggleDeveloperMode?: () => void;
}

export class ShortcutService {
  private static instance: ShortcutService;

  private isListening = false;
  private isKeyDown = false;
  private handlers: ShortcutHandlers | null = null;

  private constructor() {}

  public static getInstance(): ShortcutService {
    if (!ShortcutService.instance) {
      ShortcutService.instance = new ShortcutService();
    }
    return ShortcutService.instance;
  }

  public register(handlers: ShortcutHandlers): void {
    this.handlers = handlers;
    if (!this.isListening) {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
      this.isListening = true;
      logger.info('shortcut', 'Global keyboard shortcut listeners registered');
    }
  }

  public unregister(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.isListening = false;
    this.handlers = null;
    logger.info('shortcut', 'Global keyboard shortcut listeners unbound');
  }

  private matchKey(e: KeyboardEvent, shortcutKey: string): boolean {
    const parts = shortcutKey.toLowerCase().split('+');
    const key = parts[parts.length - 1];
    const requireAlt = parts.includes('alt');
    const requireCtrl = parts.includes('ctrl') || parts.includes('control');
    const requireShift = parts.includes('shift');
    const requireMeta = parts.includes('cmd') || parts.includes('meta');

    if (requireAlt !== e.altKey) return false;
    if (requireCtrl !== e.ctrlKey) return false;
    if (requireShift !== e.shiftKey) return false;
    if (requireMeta !== e.metaKey) return false;

    if (key === 'space') return e.code === 'Space';
    if (key === 'escape') return e.key === 'Escape';
    return e.key.toLowerCase() === key;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.handlers) return;
    const settings: ShortcutSettings = storageService.getShortcutSettings();

    // Check Cancel
    if (this.matchKey(e, settings.cancelKey || 'Escape')) {
      e.preventDefault();
      this.handlers.onCancel();
      return;
    }

    // Check Developer Mode Toggle
    if (settings.developerModeKey && this.matchKey(e, settings.developerModeKey)) {
      e.preventDefault();
      this.handlers.onToggleDeveloperMode?.();
      return;
    }

    // Check Dictation Hotkey
    if (this.matchKey(e, settings.globalToggleKey || 'Alt+D')) {
      // Don't trigger if user is just typing inside an input field UNLESS using Alt/Ctrl modifier
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (isInput && !e.altKey && !e.ctrlKey && !e.metaKey) {
        return;
      }

      e.preventDefault();

      if (settings.mode === 'push_to_talk') {
        if (!this.isKeyDown) {
          this.isKeyDown = true;
          this.handlers.onStartRecording();
        }
      } else {
        // Toggle mode
        if (!e.repeat) {
          this.handlers.onToggleDictation();
        }
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (!this.handlers) return;
    const settings: ShortcutSettings = storageService.getShortcutSettings();

    if (settings.mode === 'push_to_talk') {
      if (this.matchKey(e, settings.globalToggleKey || 'Alt+D')) {
        e.preventDefault();
        this.isKeyDown = false;
        this.handlers.onStopRecording();
      }
    }
  };
}

export const shortcutService = ShortcutService.getInstance();
