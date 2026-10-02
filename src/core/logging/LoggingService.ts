/**
 * Privacy-preserving Logging & Diagnostics Service
 * Automatically scrubs credentials, keys, and tokens from all output.
 */

import { LogEntry } from '../../types';

class LoggingService {
  private static instance: LoggingService;
  private logs: LogEntry[] = [];
  private maxLogs: number = 200;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private sensitivePatterns: RegExp[] = [
    /bearer\s+[\w\-._~+/]+=*/gi,
    /api[_-]?key["':\s]+["']?[\w\-]{8,}["']?/gi,
    /token["':\s]+["']?[\w\-]{8,}["']?/gi,
    /sk-[a-zA-Z0-9]{20,}/gi,
    /hf_[a-zA-Z0-9]{20,}/gi,
    /password["':\s]+["']?[^"'\s]+["']?/gi,
  ];

  private constructor() {
    this.info('storage', 'Logging service initialized in local-only memory buffer.');
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public sanitize(text: string): string {
    if (!text || typeof text !== 'string') return '';
    let scrubbed = text;
    for (const pattern of this.sensitivePatterns) {
      scrubbed = scrubbed.replace(pattern, (match) => {
        const prefix = match.split(/[:=\s]/)[0] || 'credential';
        return `${prefix}: [REDACTED_SECRET]`;
      });
    }
    return scrubbed;
  }

  private sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('key') || 
        lowerKey.includes('token') || 
        lowerKey.includes('secret') || 
        lowerKey.includes('auth') ||
        lowerKey.includes('password')
      ) {
        sanitized[key] = '[REDACTED_SECRET]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  public log(level: LogEntry['level'], category: LogEntry['category'], message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      level,
      category,
      message: this.sanitize(message),
      metadata: this.sanitizeMetadata(metadata)
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.notifyListeners();
  }

  public info(category: LogEntry['category'], message: string, metadata?: Record<string, unknown>): void {
    this.log('info', category, message, metadata);
  }

  public warn(category: LogEntry['category'], message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', category, message, metadata);
  }

  public error(category: LogEntry['category'], message: string, metadata?: Record<string, unknown>): void {
    this.log('error', category, message, metadata);
  }

  public debug(category: LogEntry['category'], message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', category, message, metadata);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
    this.notifyListeners();
    this.info('storage', 'Audit logs cleared by user request.');
  }

  public subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(callback);
    callback(this.getLogs());
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getLogs());
      } catch {
        // Safe silence for listener exceptions
      }
    }
  }

  public exportDiagnosticBundle(): string {
    const bundle = {
      exportedAt: new Date().toISOString(),
      app: 'Vocalis Desktop Voice Studio',
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Node/Electron',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
      totalLogs: this.logs.length,
      logs: this.logs
    };
    return JSON.stringify(bundle, null, 2);
  }
}

export const logger = LoggingService.getInstance();
