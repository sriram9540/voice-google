/**
 * Pluggable AI Provider Interface & Contract
 * Strictly model-agnostic. The application never couples to specific model names.
 */

import {
  AIProviderCapabilities,
  RefinementRequest,
  RefinementResult,
} from '../../types';

export interface TranscriptionProgress {
  status: string;
  percent?: number;
}

export interface IAIProvider<TConfig = unknown> {
  readonly id: string;
  readonly name: string;
  readonly description: string;

  getCapabilities(): AIProviderCapabilities;

  validateConfiguration(config: TConfig): { valid: boolean; errors: string[] };

  healthCheck(config: TConfig): Promise<{ healthy: boolean; message: string; latencyMs?: number }>;

  transcribeAudio(
    audioBlob: Blob,
    config: TConfig,
    onProgress?: (progress: TranscriptionProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<{ text: string; confidence: number; durationSeconds?: number }>;

  streamTranscription?(
    audioStream: MediaStream,
    config: TConfig,
    onChunk: (partialText: string) => void,
    abortSignal?: AbortSignal
  ): Promise<void>;

  refineTranscript(
    request: RefinementRequest,
    config: TConfig,
    abortSignal?: AbortSignal
  ): Promise<RefinementResult>;
}
