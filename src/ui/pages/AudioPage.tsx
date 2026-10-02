import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  Mic, 
  Sliders, 
  RotateCcw, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { AudioSettings } from '../../types';
import { storageService, DEFAULT_AUDIO_SETTINGS } from '../../core/storage/StorageService';
import { audioCaptureService } from '../../core/audio/AudioCaptureService';
import { AudioVisualizer } from '../components/AudioVisualizer';

export const AudioPage: React.FC = () => {
  const [settings, setSettings] = useState<AudioSettings>(() => storageService.getAudioSettings());
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [testingMic, setTestingMic] = useState(false);
  const [testVolume, setTestVolume] = useState(0);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    const list = await audioCaptureService.getAvailableAudioDevices();
    setDevices(list);
  };

  const saveSettings = (updated: AudioSettings) => {
    setSettings(updated);
    storageService.setAudioSettings(updated);
  };

  const handleStartMicTest = async () => {
    try {
      setTestingMic(true);
      await audioCaptureService.startRecording(
        settings,
        (data) => {
          setTestVolume(data.volume);
        }
      );
    } catch (e) {
      alert(`Could not start audio test: ${String(e)}`);
      setTestingMic(false);
    }
  };

  const handleStopMicTest = async () => {
    setTestingMic(false);
    setTestVolume(0);
    await audioCaptureService.stopRecording();
  };

  const handleResetDefaults = () => {
    saveSettings(DEFAULT_AUDIO_SETTINGS);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-display font-black text-white">Audio & Hardware Devices</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Microphone hardware configuration, Voice Activity Detection (VAD), and silence auto-stop thresholds.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Audio Defaults</span>
        </button>
      </div>

      {/* Live Mic Test Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Live Microphone Hardware Monitor</h2>
          </div>
          <button
            onClick={loadDevices}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            title="Refresh connected devices"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Devices</span>
          </button>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-200">
              Input Activity Spectrogram:
            </div>
            <p className="text-xs text-slate-500">
              {testingMic ? 'Testing input stream... Speak to see live levels.' : 'Click "Test Microphone" to verify hardware.'}
            </p>
          </div>

          <div className="w-64">
            <AudioVisualizer isRecording={testingMic} audioLevel={testVolume} className="h-10 w-full" />
          </div>

          <div>
            {!testingMic ? (
              <button
                onClick={handleStartMicTest}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Test Microphone
              </button>
            ) : (
              <button
                onClick={handleStopMicTest}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Stop Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audio Parameters Grid */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Selected Device */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Select Input Microphone:</label>
            <select
              value={settings.selectedDeviceId}
              onChange={(e) => saveSettings({ ...settings, selectedDeviceId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="default">Default System Audio Input</option>
              {devices.map((device, idx) => (
                <option key={device.deviceId || idx} value={device.deviceId}>
                  {device.label || `Microphone ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Sample Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Sample Rate (Hz):</label>
            <select
              value={settings.sampleRate}
              onChange={(e) => saveSettings({ ...settings, sampleRate: parseInt(e.target.value) || 16000 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="16000">16,000 Hz (Optimal for AI Speech Models)</option>
              <option value="44100">44,100 Hz (Studio Standard)</option>
              <option value="48000">48,000 Hz (High Fidelity)</option>
            </select>
          </div>

          {/* Input Gain */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Microphone Gain Multiplier:</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.inputGain.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.inputGain}
              onChange={(e) => saveSettings({ ...settings, inputGain: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* VAD Sensitivity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">VAD Voice Activity Threshold:</span>
              <span className="font-mono text-cyan-400 tabular-nums">{(settings.vadSensitivity * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.40"
              step="0.01"
              value={settings.vadSensitivity}
              onChange={(e) => saveSettings({ ...settings, vadSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <p className="text-[11px] text-slate-500">Lower values trigger speech more easily in quiet environments.</p>
          </div>

          {/* Silence Timeout */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Silence Auto-Stop Duration:</span>
              <span className="font-mono text-cyan-400 tabular-nums">{settings.silenceTimeoutMs} ms</span>
            </div>
            <input
              type="range"
              min="800"
              max="4000"
              step="100"
              value={settings.silenceTimeoutMs}
              onChange={(e) => saveSettings({ ...settings, silenceTimeoutMs: parseInt(e.target.value) })}
              className="w-full accent-cyan-500"
            />
            <p className="text-[11px] text-slate-500">Automatically stops recording after this period of continuous silence.</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.echoCancellation}
              onChange={(e) => saveSettings({ ...settings, echoCancellation: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Hardware Echo Cancellation</div>
              <div className="text-[11px] text-slate-500">Prevents computer speaker audio from looping into dictation.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.noiseSuppression}
              onChange={(e) => saveSettings({ ...settings, noiseSuppression: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-cyan-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-semibold text-slate-200">Acoustic Noise Suppression</div>
              <div className="text-[11px] text-slate-500">Attenuates fan hum, keyboard clicks, and ambient noise.</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
