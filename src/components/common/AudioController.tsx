import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';

interface AudioControllerProps {
  soundtrackUrl?: string;
  hasInteracted: boolean;
}

export const AudioController: React.FC<AudioControllerProps> = ({
  soundtrackUrl = '',
  hasInteracted,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);

  // Initialize Audio
  useEffect(() => {
    // Check saved mute preference
    const savedMute = localStorage.getItem('birthday_audio_muted');
    if (savedMute === 'true') {
      setIsMuted(true);
    }

    if (soundtrackUrl) {
      const audio = new Audio(soundtrackUrl);
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [soundtrackUrl]);

  // Gentle Web Audio acoustic chime generator (plays soft, romantic notes if no MP3 supplied)
  const playGentleChime = React.useCallback((frequency: number) => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.3);
    } catch {
      // Graceful fallback if Web Audio is unsupported
    }
  }, [isMuted]);

  // Play romantic pentatonic chords periodically when active and using synthesized mode
  const startSynthMelody = React.useCallback(() => {
    const notes = [261.63, 329.63, 392.00, 523.25, 587.33, 659.25]; // C, E, G, C, D, E (romantic pentatonic)
    let index = 0;

    playGentleChime(notes[0]);

    synthIntervalRef.current = window.setInterval(() => {
      index = (index + 1) % notes.length;
      playGentleChime(notes[index]);
    }, 2800);
  }, [playGentleChime]);

  const stopSynthMelody = React.useCallback(() => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  }, []);

  // When user gives first interaction gesture (e.g. clicks "Begin Story")
  useEffect(() => {
    if (hasInteracted && !isMuted) {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          // If custom MP3 fails or is missing, use gentle chime generator
          startSynthMelody();
          setIsPlaying(true);
        });
      } else {
        startSynthMelody();
        setIsPlaying(true);
      }
    }
  }, [hasInteracted, isMuted, startSynthMelody]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    localStorage.setItem('birthday_audio_muted', nextMuted ? 'true' : 'false');

    if (nextMuted) {
      if (audioRef.current) audioRef.current.pause();
      stopSynthMelody();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          startSynthMelody();
          setIsPlaying(true);
        });
      } else {
        startSynthMelody();
        setIsPlaying(true);
      }
    }
  };

  return (
    <button
      onClick={toggleSound}
      type="button"
      className="fixed top-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-plum-900/80 backdrop-blur-md shadow-card border border-lavender-200/50 hover:scale-105 active:scale-95 transition-all text-neutral-800 dark:text-cream-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-lavender-CTA"
      aria-label={isMuted ? 'Enable romantic music' : 'Mute music'}
      title={isMuted ? 'Unmute music 🎵' : 'Mute music 🔇'}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-neutral-500" />
      ) : isPlaying ? (
        <div className="relative flex items-center justify-center">
          <Volume2 className="w-5 h-5 text-rose-CTA animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-CTA rounded-full animate-ping" />
        </div>
      ) : (
        <Music className="w-5 h-5 text-lavender-CTA" />
      )}
    </button>
  );
};
