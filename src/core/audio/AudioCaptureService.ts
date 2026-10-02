/**
 * Audio Capture & Voice Activity Detection (VAD) Subsystem
 * Web Audio API based, captures real microphone input, provides live frequency visualization,
 * calculates volume metering, and detects voice activity and silence thresholds.
 */

import { AudioSettings } from '../../types';
import { logger } from '../logging/LoggingService';

export interface AudioLevelData {
  volume: number; // 0.0 to 1.0
  isSpeaking: boolean;
  frequencyData: Uint8Array;
}

export class AudioCaptureService {
  private static instance: AudioCaptureService;

  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private isRecording = false;
  private recordingStartTime = 0;
  private silenceStartTime = 0;
  private animFrameId: number | null = null;

  private onAudioLevelCallback?: (data: AudioLevelData) => void;
  private onSilenceAutoStopCallback?: () => void;

  private constructor() {}

  public static getInstance(): AudioCaptureService {
    if (!AudioCaptureService.instance) {
      AudioCaptureService.instance = new AudioCaptureService();
    }
    return AudioCaptureService.instance;
  }

  public async getAvailableAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audioinput');
    } catch (e) {
      logger.error('audio', 'Failed to enumerate audio devices', { error: String(e) });
      return [];
    }
  }

  public async startRecording(
    settings: AudioSettings,
    onAudioLevel?: (data: AudioLevelData) => void,
    onSilenceAutoStop?: () => void
  ): Promise<void> {
    if (this.isRecording) {
      await this.stopRecording();
    }

    this.onAudioLevelCallback = onAudioLevel;
    this.onSilenceAutoStopCallback = onSilenceAutoStop;
    this.audioChunks = [];

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: settings.selectedDeviceId !== 'default' ? { exact: settings.selectedDeviceId } : undefined,
          sampleRate: settings.sampleRate || 16000,
          echoCancellation: settings.echoCancellation ?? true,
          noiseSuppression: settings.noiseSuppression ?? true,
          autoGainControl: true
        },
        video: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx({ sampleRate: settings.sampleRate || 16000 });

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = settings.inputGain || 1.0;

      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.6;

      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);

      // Supported mimeTypes
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }

      this.mediaRecorder = mimeType ? new MediaRecorder(this.mediaStream, { mimeType }) : new MediaRecorder(this.mediaStream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // 100ms slice
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.silenceStartTime = 0;

      logger.info('audio', 'Audio recording started', {
        deviceId: settings.selectedDeviceId,
        sampleRate: this.audioContext.sampleRate,
        mimeType: this.mediaRecorder.mimeType
      });

      this.startVADLoop(settings);
    } catch (err) {
      logger.error('audio', 'Failed to start microphone recording', { error: String(err) });
      this.cleanup();
      throw err;
    }
  }

  private startVADLoop(settings: AudioSettings): void {
    if (!this.analyserNode) return;

    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

    const checkLevel = () => {
      if (!this.isRecording || !this.analyserNode) return;

      this.analyserNode.getByteFrequencyData(dataArray);

      // Calculate root mean square (RMS) volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedVolume = Math.min(1.0, average / 128); // 0 to 1

      const threshold = settings.vadSensitivity ?? 0.15;
      const isSpeaking = normalizedVolume > threshold;

      if (isSpeaking) {
        this.silenceStartTime = 0;
      } else {
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = Date.now();
        } else if (settings.silenceTimeoutMs && settings.silenceTimeoutMs > 0) {
          const silenceDuration = Date.now() - this.silenceStartTime;
          // Only auto-stop if recording has been going for at least 1.5s
          const recordingDuration = Date.now() - this.recordingStartTime;
          if (recordingDuration > 1500 && silenceDuration >= settings.silenceTimeoutMs) {
            logger.info('audio', `Silence detected for ${silenceDuration}ms, triggering auto-stop.`);
            this.onSilenceAutoStopCallback?.();
            return;
          }
        }
      }

      this.onAudioLevelCallback?.({
        volume: normalizedVolume,
        isSpeaking,
        frequencyData: dataArray
      });

      this.animFrameId = requestAnimationFrame(checkLevel);
    };

    this.animFrameId = requestAnimationFrame(checkLevel);
  }

  public async stopRecording(): Promise<{ audioBlob: Blob; durationSeconds: number }> {
    if (!this.isRecording) {
      return { audioBlob: new Blob(), durationSeconds: 0 };
    }

    const durationSeconds = Math.max(0.2, (Date.now() - this.recordingStartTime) / 1000);
    this.isRecording = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve({ audioBlob: blob, durationSeconds });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.audioChunks, { type: mimeType });
        logger.info('audio', `Audio recording finished. Duration: ${durationSeconds.toFixed(1)}s, Size: ${blob.size} bytes`);
        this.cleanup();
        resolve({ audioBlob: blob, durationSeconds });
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.cleanup();
        resolve({ audioBlob: blob, durationSeconds });
      }
    });
  }

  public cancelRecording(): void {
    this.isRecording = false;
    this.audioChunks = [];
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Safe silence
      }
    }
    this.cleanup();
    logger.info('audio', 'Audio recording cancelled.');
  }

  public cleanup(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.sourceNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const audioCaptureService = AudioCaptureService.getInstance();
