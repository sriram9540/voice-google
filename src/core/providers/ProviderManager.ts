/**
 * Provider Manager
 * Coordinates the 3 model-agnostic AI providers: Local Model, Direct API, and Hugging Face API.
 */

import { IAIProvider, TranscriptionProgress } from './AIProvider';
import { LocalModelProvider } from './local/LocalModelProvider';
import { DirectApiProvider } from './direct/DirectApiProvider';
import { HuggingFaceApiProvider } from './huggingface/HuggingFaceApiProvider';
import {
  AIProviderType,
  AIProviderCapabilities,
  ProviderConfigurations,
  RefinementRequest,
  RefinementResult,
} from '../../types';
import { storageService } from '../storage/StorageService';
import { logger } from '../logging/LoggingService';

export class ProviderManager {
  private static instance: ProviderManager;

  private localProvider = new LocalModelProvider();
  private directApiProvider = new DirectApiProvider();
  private huggingFaceProvider = new HuggingFaceApiProvider();

  private constructor() {}

  public static getInstance(): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager();
    }
    return ProviderManager.instance;
  }

  public getProvider(type: AIProviderType): IAIProvider<unknown> {
    switch (type) {
      case 'local':
        return this.localProvider as unknown as IAIProvider<unknown>;
      case 'direct_api':
        return this.directApiProvider as unknown as IAIProvider<unknown>;
      case 'huggingface':
        return this.huggingFaceProvider as unknown as IAIProvider<unknown>;
      default:
        return this.localProvider as unknown as IAIProvider<unknown>;
    }
  }

  public getActiveProvider(): IAIProvider<unknown> {
    const config = storageService.getProviders();
    return this.getProvider(config.activeProvider);
  }

  public getActiveCapabilities(): AIProviderCapabilities {
    return this.getActiveProvider().getCapabilities();
  }

  public getActiveConfig(type?: AIProviderType): unknown {
    const providers = storageService.getProviders();
    const targetType = type || providers.activeProvider;
    switch (targetType) {
      case 'local':
        return providers.local;
      case 'direct_api':
        return providers.direct_api;
      case 'huggingface':
        return providers.huggingface;
    }
  }

  public setActiveProvider(type: AIProviderType): void {
    const providers = storageService.getProviders();
    providers.activeProvider = type;
    storageService.setProviders(providers);
    logger.info('provider', `Switched active provider to: ${type}`);
  }

  public async transcribeAudio(
    audioBlob: Blob,
    onProgress?: (progress: TranscriptionProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<{ text: string; confidence: number; durationSeconds?: number }> {
    const providers = storageService.getProviders();
    const provider = this.getProvider(providers.activeProvider);
    const config = this.getActiveConfig(providers.activeProvider);

    return provider.transcribeAudio(audioBlob, config, onProgress, abortSignal);
  }

  public async refineTranscript(
    request: RefinementRequest,
    abortSignal?: AbortSignal
  ): Promise<RefinementResult> {
    const providers = storageService.getProviders();
    const provider = this.getProvider(providers.activeProvider);
    const config = this.getActiveConfig(providers.activeProvider);

    return provider.refineTranscript(request, config, abortSignal);
  }

  public async testProviderConnection(type: AIProviderType): Promise<{ healthy: boolean; message: string; latencyMs?: number }> {
    const provider = this.getProvider(type);
    const config = this.getActiveConfig(type);
    return provider.healthCheck(config);
  }

  public updateProviderConfig<K extends keyof ProviderConfigurations>(
    section: K,
    updatedValue: ProviderConfigurations[K]
  ): void {
    const current = storageService.getProviders();
    current[section] = updatedValue;
    storageService.setProviders(current);
  }
}

export const providerManager = ProviderManager.getInstance();
