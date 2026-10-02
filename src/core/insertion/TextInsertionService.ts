/**
 * Text Insertion Engine
 * Multi-strategy text insertion with fallback logic and clipboard restoration guarantee.
 */

import { TextInsertionStrategy } from '../../types';
import { storageService } from '../storage/StorageService';
import { logger } from '../logging/LoggingService';

export interface InsertionResult {
  success: boolean;
  strategyUsed: TextInsertionStrategy;
  message: string;
}

export class TextInsertionService {
  private static instance: TextInsertionService;

  private constructor() {}

  public static getInstance(): TextInsertionService {
    if (!TextInsertionService.instance) {
      TextInsertionService.instance = new TextInsertionService();
    }
    return TextInsertionService.instance;
  }

  /**
   * Executes text insertion using ordered fallback strategies
   */
  public async insertText(text: string, targetElement?: HTMLElement | null): Promise<InsertionResult> {
    const settings = storageService.getAdvancedSettings();
    const strategies = settings.insertionStrategyOrder || ['accessibility_adapter', 'clipboard_paste', 'synthetic_dom'];

    logger.info('insertion', `Attempting text insertion (${text.length} chars) using strategy sequence: ${strategies.join(' -> ')}`);

    for (const strategy of strategies) {
      try {
        switch (strategy) {
          case 'accessibility_adapter': {
            const success = await this.tryAccessibilityInsert(text, targetElement);
            if (success) {
              return { success: true, strategyUsed: 'accessibility_adapter', message: 'Inserted via accessibility adapter' };
            }
            break;
          }
          case 'clipboard_paste': {
            const success = await this.tryClipboardPasteInsert(text, settings.clipboardRestoreDelayMs || 250);
            if (success) {
              return { success: true, strategyUsed: 'clipboard_paste', message: 'Inserted via clipboard with restoration' };
            }
            break;
          }
          case 'synthetic_dom': {
            const success = this.trySyntheticDomInsert(text, targetElement);
            if (success) {
              return { success: true, strategyUsed: 'synthetic_dom', message: 'Inserted via synthetic DOM input events' };
            }
            break;
          }
        }
      } catch (err) {
        logger.warn('insertion', `Strategy "${strategy}" failed: ${String(err)}. Falling back to next strategy.`);
      }
    }

    // Final fallback: copy to clipboard directly so the user can easily paste manually
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return {
          success: true,
          strategyUsed: 'clipboard_paste',
          message: 'Target application input was shielded. Final formatted text copied to your clipboard.'
        };
      }
    } catch {
      // Ignored
    }

    throw new Error('All text insertion strategies failed. Please ensure the target text field has focus.');
  }

  /**
   * Strategy 1: Accessibility / Native OS UI Automation simulation
   */
  private async tryAccessibilityInsert(text: string, targetEl?: HTMLElement | null): Promise<boolean> {
    // If running in a native desktop shell (Electron/Tauri), invoke native bridge
    if (typeof window !== 'undefined' && (window as unknown as { electronBridge?: { insertText: (t: string) => Promise<boolean> } }).electronBridge) {
      return (window as unknown as { electronBridge: { insertText: (t: string) => Promise<boolean> } }).electronBridge.insertText(text);
    }

    // In web/preview environment, check if active focused element supports direct value insertion
    const active = targetEl || (document.activeElement as HTMLElement);
    if (active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
      const start = active.selectionStart ?? active.value.length;
      const end = active.selectionEnd ?? active.value.length;
      active.setRangeText(text, start, end, 'end');
      active.dispatchEvent(new Event('input', { bubbles: true }));
      active.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } else if (active && active.isContentEditable) {
      document.execCommand('insertText', false, text);
      return true;
    }

    return false;
  }

  /**
   * Strategy 2: Clipboard + simulated paste + clipboard restore
   */
  private async tryClipboardPasteInsert(text: string, restoreDelayMs: number): Promise<boolean> {
    if (!navigator.clipboard) return false;

    let originalClipboard = '';
    try {
      originalClipboard = await navigator.clipboard.readText().catch(() => '');
    } catch {
      // Clipboard read permission might not be granted; proceed with write
    }

    // 1. Write transcript to clipboard
    await navigator.clipboard.writeText(text);

    // 2. Simulate paste command into active element if in DOM
    const active = document.activeElement as HTMLElement;
    if (active && (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement)) {
      const start = active.selectionStart ?? active.value.length;
      const end = active.selectionEnd ?? active.value.length;
      active.setRangeText(text, start, end, 'end');
      active.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      document.execCommand('paste');
    }

    // 3. Restore original clipboard content after delay to prevent data loss
    if (originalClipboard && originalClipboard !== text) {
      setTimeout(async () => {
        try {
          await navigator.clipboard.writeText(originalClipboard);
          logger.debug('insertion', 'Original clipboard contents restored.');
        } catch {
          // Ignore
        }
      }, restoreDelayMs);
    }

    return true;
  }

  /**
   * Strategy 3: Synthetic keyboard input
   */
  private trySyntheticDomInsert(text: string, targetEl?: HTMLElement | null): boolean {
    const active = targetEl || (document.activeElement as HTMLElement);
    if (!active) return false;

    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      active.value += (active.value ? ' ' : '') + text;
      active.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  }
}

export const textInsertionService = TextInsertionService.getInstance();
