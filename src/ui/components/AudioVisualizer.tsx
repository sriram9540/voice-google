import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isRecording: boolean;
  audioLevel: number;
  className?: string;
  barCount?: number;
  variant?: 'bars' | 'wave';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isRecording,
  audioLevel,
  className = 'h-10 w-full',
  barCount = 28,
  variant = 'bars'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const heightsRef = useRef<number[]>(new Array(barCount).fill(4));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const targetHeight = isRecording ? Math.max(0.08, audioLevel) : 0.04;

      if (variant === 'bars') {
        const gap = 3;
        const totalGap = gap * (barCount - 1);
        const barWidth = Math.max(2, (width - totalGap) / barCount);

        for (let i = 0; i < barCount; i++) {
          // Dynamic wave jitter based on audio level and index
          const jitter = isRecording 
            ? Math.sin(Date.now() / 150 + i * 0.4) * 0.35 + 0.65
            : 0.2;
          const target = Math.max(3, targetHeight * height * jitter);
          // Smooth interpolate
          heightsRef.current[i] += (target - heightsRef.current[i]) * 0.25;

          const barH = Math.min(height, Math.max(3, heightsRef.current[i]));
          const x = i * (barWidth + gap);
          const y = (height - barH) / 2;

          // Color gradient from cyan to emerald when speaking, muted slate when idle
          if (isRecording) {
            const grad = ctx.createLinearGradient(0, y, 0, y + barH);
            grad.addColorStop(0, '#06b6d4'); // cyan-500
            grad.addColorStop(1, '#10b981'); // emerald-500
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = 'rgba(100, 116, 139, 0.35)'; // slate-500
          }

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, 2);
          ctx.fill();
        }
      } else {
        // Continuous wave
        ctx.beginPath();
        const sliceWidth = width / barCount;
        let x = 0;

        for (let i = 0; i < barCount; i++) {
          const jitter = isRecording ? Math.sin(Date.now() / 120 + i * 0.5) * (audioLevel * 18) : 2;
          const y = height / 2 + jitter;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.strokeStyle = isRecording ? '#06b6d4' : 'rgba(100, 116, 139, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isRecording, audioLevel, barCount, variant]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={48}
      className={`block ${className}`}
    />
  );
};
