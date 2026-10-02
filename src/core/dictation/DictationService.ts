/**
 * Dictation State Machine & Master Orchestrator
 * Coordinates recording, provider speech-to-text, refinement pipeline, and text insertion.
 */

import {
  DictationState,
  RefinementResult,
  WritingStyleId,
  FillerRemovalLevel,
  TranscriptRecord,
} from '../../types';
import { audioCaptureService, AudioLevelData } from '../audio/AudioCaptureService';
import { providerManager } from '../providers/ProviderManager';
import { contextService } from '../context/ContextService';
import { textInsertionService } from '../insertion/TextInsertionService';
import { storageService } from '../storage/StorageService';
import { logger } from '../logging/LoggingService';

export interface DictationSnapshot {
  state: DictationState;
  recordingDurationSeconds: number;
  audioLevel: number;
  isSpeaking: boolean;
  statusMessage: string;
  rawTranscript: string;
  finalTranscript: string;
  refinementResult: RefinementResult | null;
  developerModeActive: boolean;
  errorMessage: string | null;
}

export class DictationService {
  private static instance: DictationService;

  private state: DictationState = 'IDLE';
  private recordingDuration = 0;
  private audioLevel = 0;
  private isSpeaking = false;
  private statusMessage = 'Ready';
  private rawTranscript = '';
  private finalTranscript = '';
  private refinementResult: RefinementResult | null = null;
  private developerModeActive = false;
  private errorMessage: string | null = null;

  private abortController: AbortController | null = null;
  private recordingTimerId: number | null = null;
  private listeners: ((snapshot: DictationSnapshot) => void)[] = [];

  private constructor() {}

  public static getInstance(): DictationService {
    if (!DictationService.instance) {
      DictationService.instance = new DictationService();
    }
    return DictationService.instance;
  }

  public getSnapshot(): DictationSnapshot {
    return {
      state: this.state,
      recordingDurationSeconds: this.recordingDuration,
      audioLevel: this.audioLevel,
      isSpeaking: this.isSpeaking,
      statusMessage: this.statusMessage,
      rawTranscript: this.rawTranscript,
      finalTranscript: this.finalTranscript,
      refinementResult: this.refinementResult,
      developerModeActive: this.developerModeActive,
      errorMessage: this.errorMessage
    };
  }

  public toggleDeveloperMode(): void {
    this.developerModeActive = !this.developerModeActive;
    logger.info('formatting', `Developer mode toggled: ${this.developerModeActive ? 'ON' : 'OFF'}`);
    this.notify();
  }

  public setDeveloperMode(active: boolean): void {
    this.developerModeActive = active;
    this.notify();
  }

  public async toggleDictation(): Promise<void> {
    if (this.state === 'IDLE' || this.state === 'COMPLETED' || this.state === 'CANCELLED' || this.state === 'ERROR') {
      await this.startDictation();
    } else if (this.state === 'RECORDING') {
      await this.stopAndProcess();
    }
  }

  public async startDictation(): Promise<void> {
    if (this.state === 'RECORDING') return;

    this.transitionTo('RECORDING', 'Listening to microphone...');
    this.errorMessage = null;
    this.rawTranscript = '';
    this.finalTranscript = '';
    this.refinementResult = null;
    this.recordingDuration = 0;

    const audioSettings = storageService.getAudioSettings();
    this.abortController = new AbortController();

    try {
      this.recordingTimerId = window.setInterval(() => {
        this.recordingDuration += 0.2;
        this.notify();
      }, 200);

      await audioCaptureService.startRecording(
        audioSettings,
        (data: AudioLevelData) => {
          this.audioLevel = data.volume;
          this.isSpeaking = data.isSpeaking;
          this.notify();
        },
        () => {
          // Silence auto-stop triggered by VAD
          this.stopAndProcess();
        }
      );
    } catch (err: unknown) {
      this.clearTimers();
      this.errorMessage = `Microphone access error: ${(err as Error)?.message || 'Permission denied'}`;
      this.transitionTo('ERROR', this.errorMessage);
    }
  }

  public async stopAndProcess(): Promise<void> {
    if (this.state !== 'RECORDING') return;

    this.clearTimers();
    this.audioLevel = 0;
    this.isSpeaking = false;

    this.transitionTo('TRANSCRIBING', 'Transcribing audio via selected provider...');

    try {
      const { audioBlob, durationSeconds } = await audioCaptureService.stopRecording();
      if (!audioBlob || audioBlob.size === 0) {
        this.transitionTo('IDLE', 'No audio recorded');
        return;
      }

      // Step 1: Transcribe via configured AI Provider
      const transcription = await providerManager.transcribeAudio(
        audioBlob,
        (progress) => {
          this.statusMessage = progress.status;
          this.notify();
        },
        this.abortController?.signal
      );

      this.rawTranscript = transcription.text;
      if (!this.rawTranscript.trim()) {
        this.transitionTo('COMPLETED', 'No speech detected.');
        this.resetAfterDelay(2000);
        return;
      }

      // Step 2: Refine transcript via Refinement Engine
      this.transitionTo('REFINING', 'Refining transcript & formatting context...');

      const context = contextService.getCurrentContext();
      const styleId = (context.preferredStyle || 'professional') as WritingStyleId;

      const refinement = await providerManager.refineTranscript(
        {
          rawTranscript: this.rawTranscript,
          context,
          style: styleId,
          dictionary: storageService.getDictionary(),
          snippets: storageService.getSnippets(),
          developerMode: this.developerModeActive || !!context.developerModeRecommended,
          fillerRemovalLevel: 'normal' as FillerRemovalLevel,
          spokenPunctuation: true,
          autoListFormatting: true,
          detectBacktracking: true
        },
        this.abortController?.signal
      );

      this.refinementResult = refinement;
      this.finalTranscript = refinement.formattedText;

      // Step 3: Insert final text into target application
      this.transitionTo('INSERTING', 'Inserting formatted text into active field...');

      await textInsertionService.insertText(this.finalTranscript);

      // Save to transcript history if permitted
      const record: TranscriptRecord = {
        id: `tr-${Date.now()}`,
        timestamp: Date.now(),
        rawText: this.rawTranscript,
        finalText: this.finalTranscript,
        provider: storageService.getProviders().activeProvider,
        durationSeconds: Math.round(durationSeconds),
        correctionsCount: refinement.correctionsApplied.length,
        appContext: {
          appName: context.appName,
          category: context.category
        },
        styleUsed: styleId
      };
      storageService.addTranscript(record);

      this.transitionTo('COMPLETED', 'Text inserted successfully!');
      this.resetAfterDelay(2500);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        this.transitionTo('CANCELLED', 'Dictation cancelled');
        this.resetAfterDelay(1500);
        return;
      }
      this.errorMessage = (err as Error)?.message || 'Transcription or insertion failed';
      logger.error('provider', 'Dictation pipeline error', { error: this.errorMessage });
      this.transitionTo('ERROR', this.errorMessage);
    }
  }

  public cancel(): void {
    if (this.state === 'IDLE') return;

    logger.info('audio', 'User cancelled dictation.');
    this.clearTimers();
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    audioCaptureService.cancelRecording();
    this.audioLevel = 0;
    this.isSpeaking = false;
    this.transitionTo('CANCELLED', 'Dictation cancelled');
    this.resetAfterDelay(1200);
  }

  private transitionTo(newState: DictationState, message: string): void {
    this.state = newState;
    this.statusMessage = message;
    this.notify();
  }

  private clearTimers(): void {
    if (this.recordingTimerId) {
      clearInterval(this.recordingTimerId);
      this.recordingTimerId = null;
    }
  }

  private resetAfterDelay(delayMs: number): void {
    setTimeout(() => {
      if (this.state === 'COMPLETED' || this.state === 'CANCELLED') {
        this.state = 'IDLE';
        this.statusMessage = 'Ready';
        this.notify();
      }
    }, delayMs);
  }

  public subscribe(callback: (snapshot: DictationSnapshot) => void): () => void {
    this.listeners.push(callback);
    callback(this.getSnapshot());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Safe silence
      }
    }
  }
}

export const dictationService = DictationService.getInstance();
