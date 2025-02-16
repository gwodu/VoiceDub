import { useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";

interface WaveformProps {
  audioBlob: Blob;
  className?: string;
}

export function Waveform({ audioBlob, className }: WaveformProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#FF5500",
        progressColor: "#FF5500",
        cursorColor: "#2C3E50",
        barWidth: 2,
        barGap: 1,
        height: 100,
        normalize: true,
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      wavesurferRef.current.load(audioUrl);

      return () => {
        URL.revokeObjectURL(audioUrl);
        wavesurferRef.current?.destroy();
      };
    }
  }, [audioBlob]);

  return <div ref={waveformRef} className={className} />;
}
