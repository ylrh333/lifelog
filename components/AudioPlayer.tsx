import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';

interface AudioPlayerProps {
  blob: Blob;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ blob }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const url = useRef<string>(URL.createObjectURL(blob));

  useEffect(() => {
    return () => {
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-2 w-fit mt-2">
      <audio 
        ref={audioRef} 
        src={url.current} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />
      <button 
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm text-gray-800 hover:scale-105 transition-transform"
      >
        {isPlaying ? <ICONS.Pause size={14} /> : <ICONS.Play size={14} fill="currentColor" />}
      </button>
      <span className="text-xs font-medium text-gray-500">Audio Memo</span>
      {/* Visualizer bars simulation */}
      <div className="flex gap-1 items-center h-4">
        {[1,2,3,4,5].map(i => (
           <div 
             key={i} 
             className={`w-1 bg-gray-400 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
             style={{ height: isPlaying ? `${Math.random() * 12 + 4}px` : '4px' }}
           />
        ))}
      </div>
    </div>
  );
};