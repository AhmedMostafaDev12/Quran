'use client';
import { useState, useRef, useEffect } from 'react';
import { getAyahAudioUrl } from '@/lib/audioApi';

export function AudioPlayer({ globalAyahNumber }: { globalAyahNumber: number }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) {
      audioRef.current = new Audio(getAyahAudioUrl(globalAyahNumber, 'ar.alafasy'));
      audioRef.current.onended = () => setPlaying(false);
      audioRef.current.onerror = () => {
        setPlaying(false);
        console.error('Audio playback failed');
      };
    }
    if (playing) { 
      audioRef.current.pause(); 
    } else { 
      audioRef.current.play().catch(e => console.error(e)); 
    }
    setPlaying(p => !p);
  };

  return (
    <button onClick={toggle} className="text-[#C9A84C] hover:text-[#F0D070] transition-colors text-sm ml-2">
      {playing ? '⏸' : '▶'}
    </button>
  );
}
