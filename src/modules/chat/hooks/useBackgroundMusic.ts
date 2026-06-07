'use client';

import { useEffect, useRef } from 'react';

interface UseBackgroundMusicOptions {
  enabled: boolean;
  volume?: number;
}

export function useBackgroundMusic({ enabled, volume = 0.12 }: UseBackgroundMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/background.mp3');
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;
    audio.volume = volume;

    if (enabled) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Browsers may block playback until a user gesture. The next click will retry.
        });
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
    };
  }, [enabled, volume]);
}
