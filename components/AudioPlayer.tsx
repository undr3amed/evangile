import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Loader2 } from './Icons';
import { generateSpeech } from '../services/geminiService';

interface AudioPlayerProps {
  textToRead: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ textToRead }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  useEffect(() => {
    // Reset when text changes
    stop();
    audioBufferRef.current = null;
    pausedAtRef.current = 0;
  }, [textToRead]);

  const loadAudio = async () => {
    setIsLoading(true);
    try {
      const buffer = await generateSpeech(textToRead);
      audioBufferRef.current = buffer;
      playBuffer(buffer, 0);
    } catch (err) {
      console.error("Failed to generate speech", err);
      setIsLoading(false);
    }
  };

  const playBuffer = (buffer: AudioBuffer, offset: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    source.onended = () => {
      // Basic check to see if it ended naturally or was stopped
      // In a real app we need better state management for pause vs stop
      setIsPlaying(false);
      pausedAtRef.current = 0;
    };

    source.start(0, offset);
    
    sourceNodeRef.current = source;
    startTimeRef.current = ctx.currentTime - offset;
    setIsPlaying(true);
    setIsLoading(false);
  };

  const togglePlay = async () => {
    if (isLoading) return;

    if (isPlaying) {
      // Pause
      if (sourceNodeRef.current && audioContextRef.current) {
        sourceNodeRef.current.stop();
        pausedAtRef.current = audioContextRef.current.currentTime - startTimeRef.current;
        setIsPlaying(false);
      }
    } else {
      // Play
      if (audioBufferRef.current) {
        playBuffer(audioBufferRef.current, pausedAtRef.current);
      } else {
        await loadAudio();
      }
    }
  };

  const stop = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
    setIsLoading(false);
  };

  return (
    <button
      onClick={togglePlay}
      disabled={isLoading && !isPlaying} // Allow clicking to pause even if "loading" logic is weird
      className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-lg active:scale-95"
      aria-label={isPlaying ? "Pause" : "Lire l'Évangile"}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-5 h-5 fill-current" />
      ) : (
        <Play className="w-5 h-5 fill-current ml-0.5" />
      )}
    </button>
  );
};
