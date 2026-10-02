/**
 * Hugging Face API Provider
 * Connects to Hugging Face Inference API / Dedicated Inference Endpoints.
 * Handles cold-start 503 loading delays, tokens, timeouts, and cancellation.
 */

import { IAIProvider, TranscriptionProgress } from '../AIProvider';
import {
  AIProviderCapabilities,
  HuggingFaceConfig,
  RefinementRequest,
  RefinementResult,
} from '../../../types';
import { RefinementPipeline } from '../../formatting/refinementPipeline';
import { logger } from '../../logging/LoggingService';

export class HuggingFaceApiProvider implements IAIProvider<HuggingFaceConfig> {
  public readonly id = 'huggingface';
  public readonly name = 'Hugging Face API';
  public readonly description = 'Runs inference using Hugging Face hosted models or dedicated inference endpoints with your HF User Token.';

  public getCapabilities(): AIProviderCapabilities {
    return {
      supportsAudioInput: true,
      supportsStreaming: false,
      supportsRefinement: true,
      supportsContext: true,
      supportsCancellation: true,
      localOffline: false
    };
  }

  public validateConfiguration(config: HuggingFaceConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.token || config.token.trim() === '') {
      errors.push('Hugging Face Access Token is required.');
    }
    if (!config.modelId || config.modelId.trim() === '') {
      errors.push('Hugging Face Model ID (e.g. org/model-name) is required.');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  public async healthCheck(config: HuggingFaceConfig): Promise<{ healthy: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();
    try {
      const validation = this.validateConfiguration(config);
      if (!validation.valid) {
        return { healthy: false, message: validation.errors[0] };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(config.timeoutMs || 10000, 10000));

      const cleanModel = config.modelId.trim();
      const endpoint = config.customEndpoint?.trim() || `https://api-inference.huggingface.co/status/${cleanModel}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        const state = data.state || 'ready';
        return {
          healthy: true,
          message: `Hugging Face model status: ${state} (${latencyMs}ms)`,
          latencyMs
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          healthy: false,
          message: 'Authentication failed. Please verify your Hugging Face User Access Token.'
        };
      } else if (response.status === 404) {
        return {
          healthy: false,
          message: `Model repository "${config.modelId}" was not found on Hugging Face.`
        };
      } else {
        return {
          healthy: false,
          message: `Hugging Face returned status ${response.status}: ${response.statusText}`
        };
      }
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') {
        return { healthy: false, message: 'Connection timed out while querying Hugging Face API.' };
      }
      return {
        healthy: false,
        message: `Hugging Face health check failed: ${(e as Error)?.message || 'Network error'}`
      };
    }
  }

  public async transcribeAudio(
    audioBlob: Blob,
    config: HuggingFaceConfig,
    onProgress?: (progress: TranscriptionProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<{ text: string; confidence: number; durationSeconds?: number }> {
    const validation = this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    logger.info('provider', 'Calling Hugging Face speech model inference', {
      modelId: config.modelId,
      blobSize: audioBlob.size
    });

    onProgress?.({ status: 'Connecting to Hugging Face Inference Endpoint...', percent: 10 });

    const cleanModel = config.modelId.trim();
    const endpoint = config.customEndpoint?.trim() || `https://api-inference.huggingface.co/models/${cleanModel}`;

    let isModelLoading = true;
    let attempts = 0;
    const maxLoadingAttempts = 6;

    while (isModelLoading && attempts < maxLoadingAttempts) {
      attempts++;
      if (abortSignal?.aborted) {
        throw new DOMException('Transcription cancelled by user', 'AbortError');
      }

      onProgress?.({
        status: attempts > 1 ? `Model is warming up on GPU, retry ${attempts}...` : 'Uploading audio to Hugging Face...',
        percent: Math.min(20 + attempts * 12, 85)
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': audioBlob.type || 'audio/wav',
          'x-wait-for-model': config.waitForModel ? 'true' : 'false'
        },
        body: audioBlob,
        signal: abortSignal
      });

      if (response.status === 503) {
        // Model loading
        const errData = await response.json().catch(() => ({}));
        const estimatedTime = errData.estimated_time || 15;
        logger.info('provider', `Hugging Face model cold-start loading. Estimated time: ${estimatedTime}s`);
        onProgress?.({
          status: `Hugging Face model is cold-starting (~${Math.round(estimatedTime)}s)...`,
          percent: 50
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.min(estimatedTime * 1000, 5000)));
        continue;
      }

      if (response.ok) {
        isModelLoading = false;
        const data = await response.json();
        onProgress?.({ status: 'Completed', percent: 100 });
        const text = data.text || (Array.isArray(data) ? data[0]?.text : '') || '';
        return {
          text,
          confidence: 0.97,
          durationSeconds: Math.round(audioBlob.size / 32000)
        };
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('Hugging Face authentication failed: Invalid or expired token.');
      }

      if (response.status === 429) {
        throw new Error('Hugging Face rate limit exceeded. Please wait a moment or use a PRO endpoint.');
      }

      const errText = await response.text().catch(() => '');
      throw new Error(`Hugging Face inference error (${response.status}): ${errText.substring(0, 100)}`);
    }

    throw new Error('Hugging Face model did not finish loading within timeout window.');
  }

  public async refineTranscript(
    request: RefinementRequest,
    _config: HuggingFaceConfig,
    _abortSignal?: AbortSignal
  ): Promise<RefinementResult> {
    // Uses the deterministic local pipeline for immediate formatting
    return RefinementPipeline.process(request);
  }
}
