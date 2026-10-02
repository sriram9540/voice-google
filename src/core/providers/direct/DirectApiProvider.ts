/**
 * Direct API Provider
 * Connects directly to any user-configured OpenAI-compatible or speech-to-text API endpoint.
 * Protects credentials and handles timeouts, retries, rate limits, and cancellation.
 */

import { IAIProvider, TranscriptionProgress } from '../AIProvider';
import {
  AIProviderCapabilities,
  DirectApiConfig,
  RefinementRequest,
  RefinementResult,
} from '../../../types';
import { RefinementPipeline } from '../../formatting/refinementPipeline';
import { logger } from '../../logging/LoggingService';

export class DirectApiProvider implements IAIProvider<DirectApiConfig> {
  public readonly id = 'direct_api';
  public readonly name = 'Direct API';
  public readonly description = 'Connects directly to your own configured API endpoint (e.g., OpenAI-compatible, custom proxy, or hosted inference server).';

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

  public validateConfiguration(config: DirectApiConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.baseUrl || config.baseUrl.trim() === '') {
      errors.push('API Base URL is required.');
    }
    if (!config.apiKey || config.apiKey.trim() === '') {
      errors.push('API Key is required.');
    }
    if (!config.modelId || config.modelId.trim() === '') {
      errors.push('Model identifier is required.');
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }

  public async healthCheck(config: DirectApiConfig): Promise<{ healthy: boolean; message: string; latencyMs?: number }> {
    const start = performance.now();
    try {
      const validation = this.validateConfiguration(config);
      if (!validation.valid) {
        return { healthy: false, message: validation.errors[0] };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.min(config.timeoutMs || 8000, 8000));

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        ...(config.organizationId ? { 'OpenAI-Organization': config.organizationId } : {}),
        ...(config.customHeaders || {})
      };

      // Strip trailing slash
      const cleanBase = config.baseUrl.replace(/\/+$/, '');
      const response = await fetch(`${cleanBase}/models`, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        return {
          healthy: true,
          message: `Endpoint verified successfully (${latencyMs}ms)`,
          latencyMs
        };
      } else if (response.status === 401 || response.status === 403) {
        return {
          healthy: false,
          message: `Authentication failed (HTTP ${response.status}): Please check your API key.`
        };
      } else if (response.status === 429) {
        return {
          healthy: false,
          message: 'Rate limit reached on target endpoint (HTTP 429).'
        };
      } else {
        return {
          healthy: false,
          message: `Endpoint returned HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') {
        return { healthy: false, message: 'Connection timed out while contacting API endpoint.' };
      }
      return {
        healthy: false,
        message: `Connection failed: ${(e as Error)?.message || 'Network error'}`
      };
    }
  }

  public async transcribeAudio(
    audioBlob: Blob,
    config: DirectApiConfig,
    onProgress?: (progress: TranscriptionProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<{ text: string; confidence: number; durationSeconds?: number }> {
    const validation = this.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    logger.info('provider', 'Initiating Direct API transcription request', {
      modelId: config.modelId,
      blobSize: audioBlob.size,
      mimeType: audioBlob.type
    });

    onProgress?.({ status: 'Preparing audio payload...', percent: 15 });

    const cleanBase = config.baseUrl.replace(/\/+$/, '');
    const url = `${cleanBase}/audio/transcriptions`;

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', config.modelId);
    formData.append('response_format', 'json');

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${config.apiKey}`,
      ...(config.organizationId ? { 'OpenAI-Organization': config.organizationId } : {}),
      ...(config.customHeaders || {})
    };

    let attempts = 0;
    const maxAttempts = (config.maxRetries || 1) + 1;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        onProgress?.({ status: `Sending audio to API (attempt ${attempts}/${maxAttempts})...`, percent: 40 });

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: abortSignal
        });

        if (response.ok) {
          const data = await response.json();
          onProgress?.({ status: 'Transcription received', percent: 100 });
          return {
            text: data.text || '',
            confidence: 0.98,
            durationSeconds: Math.round(audioBlob.size / 32000)
          };
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error('API Authentication error: Invalid credentials provided.');
        }

        if (response.status === 429) {
          if (attempts < maxAttempts) {
            logger.warn('provider', 'API rate limit encountered, backing off...');
            await new Promise(r => setTimeout(r, 1500 * attempts));
            continue;
          }
          throw new Error('API Rate limit exceeded. Please wait a few seconds and try again.');
        }

        const errorText = await response.text().catch(() => '');
        throw new Error(`API returned HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') {
          throw err;
        }
        if (attempts >= maxAttempts) {
          throw err;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    throw new Error('Direct API transcription failed after retries.');
  }

  public async refineTranscript(
    request: RefinementRequest,
    config: DirectApiConfig,
    abortSignal?: AbortSignal
  ): Promise<RefinementResult> {
    // If user configured a refinement model (e.g. gpt-4o-mini), we can optionally use the chat completions API
    if (config.refinementModelId && config.apiKey) {
      try {
        const cleanBase = config.baseUrl.replace(/\/+$/, '');
        const prompt = `You are a voice dictation text refinement engine.
Context: Application "${request.context?.appName || 'Generic'}" (${request.context?.category || 'generic'}).
Writing Style: ${request.style}.
Task: Clean up the spoken text, apply correct punctuation, format lists cleanly, and replace slang if appropriate. Output ONLY the final refined text with no commentary or quotes.`;

        const response = await fetch(`${cleanBase}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
            ...(config.organizationId ? { 'OpenAI-Organization': config.organizationId } : {}),
            ...(config.customHeaders || {})
          },
          body: JSON.stringify({
            model: config.refinementModelId,
            messages: [
              { role: 'system', content: prompt },
              { role: 'user', content: request.rawTranscript }
            ],
            temperature: 0.2
          }),
          signal: abortSignal
        });

        if (response.ok) {
          const data = await response.json();
          const aiRefined = data.choices?.[0]?.message?.content?.trim();
          if (aiRefined) {
            // Then apply local snippets & dictionary to guarantee exact match overrides
            const localResult = RefinementPipeline.process({
              ...request,
              rawTranscript: aiRefined
            });
            return {
              ...localResult,
              correctionsApplied: ['Remote AI Model Refinement', ...localResult.correctionsApplied]
            };
          }
        }
      } catch (e: unknown) {
        if ((e as Error)?.name === 'AbortError') throw e;
        logger.warn('provider', 'Remote AI refinement fallback to local pipeline', { error: String(e) });
      }
    }

    // Default fast local pipeline
    return RefinementPipeline.process(request);
  }
}
