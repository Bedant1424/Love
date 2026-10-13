import React, { useState, useRef, useEffect } from 'react';
import { AudioConfig } from '../../types/content.types';
import { readFileAsDataUrl } from '../../utils/imageCompressor';
import { Music, UploadCloud, Play, Pause, Trash2, CheckCircle2 } from 'lucide-react';

interface AdminAudioTabProps {
  audio: AudioConfig;
  onChange: (newAudio: AudioConfig) => void;
}

export const AdminAudioTab: React.FC<AdminAudioTabProps> = ({
  audio,
  onChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!audio.soundtrackUrl) return;

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const resolvedUrl =
        audio.soundtrackUrl.startsWith('http') || audio.soundtrackUrl.startsWith('data:')
          ? audio.soundtrackUrl
          : `${import.meta.env.BASE_URL}${audio.soundtrackUrl.replace(/^\.?\//, '')}`;

      if (!audioRef.current) {
        audioRef.current = new Audio(resolvedUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      } else {
        audioRef.current.src = resolvedUrl;
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const processAudioFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, AAC, M4A)');
      return;
    }
    setUploadLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange({
        soundtrackUrl: dataUrl,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
    } catch {
      alert('Could not read audio file. Please try another file or enter an audio URL.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processAudioFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processAudioFile(e.target.files[0]);
    }
  };

  const handleClearAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    onChange({
      soundtrackUrl: '',
      title: 'Bundled Gentle Chimes',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h3 className="text-xl font-heading text-neutral-800 flex items-center gap-2">
          <Music className="w-5 h-5 text-rose-CTA" />
          Background Soundtrack & Audio
        </h3>
        <p className="text-sm text-neutral-600 mt-1">
          Drag and drop an MP3 audio file, or provide an audio URL. If left empty, the website automatically plays bundled gentle romantic acoustic chords!
        </p>
      </div>

      {/* Drag & Drop Audio Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? 'border-rose-CTA bg-rose-50/70 scale-101'
            : 'border-stone-300 bg-white hover:border-stone-400'
        }`}
      >
        <input
          type="file"
          accept="audio/*"
          id="audio-upload-input"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-CTA flex items-center justify-center shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-base font-bold text-neutral-800">
              Drag & Drop your song file here
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Supports MP3, WAV, AAC, M4A, OGG
            </p>
          </div>

          <label
            htmlFor="audio-upload-input"
            className="px-5 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-neutral-800 text-xs font-bold cursor-pointer transition-colors"
          >
            {uploadLoading ? 'Uploading...' : 'Browse Audio Files'}
          </label>
        </div>
      </div>

      {/* Direct URL Input */}
      <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
        <label className="block text-xs font-bold text-neutral-800">
          Or Enter a Custom Soundtrack URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={audio.soundtrackUrl.startsWith('data:') ? '[Uploaded Audio File]' : audio.soundtrackUrl}
            disabled={audio.soundtrackUrl.startsWith('data:')}
            onChange={(e) =>
              onChange({
                ...audio,
                soundtrackUrl: e.target.value,
              })
            }
            placeholder="e.g. /Love/audio/song.mp3 or https://.../melody.mp3"
            className="flex-1 p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-CTA"
          />
          {audio.soundtrackUrl && (
            <button
              type="button"
              onClick={handleClearAudio}
              className="px-3.5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Reset to bundled chimes"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1">
            Song Title / Label
          </label>
          <input
            type="text"
            value={audio.title}
            onChange={(e) => onChange({ ...audio, title: e.target.value })}
            placeholder="e.g. Can't Help Falling in Love"
            className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-CTA"
          />
        </div>
      </div>

      {/* Active Sound Status & Test Player */}
      <div className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-lavender-100 flex items-center justify-center text-lavender-CTA">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <span>{audio.title || 'Gentle Romantic Chimes'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xs text-neutral-500">
              {audio.soundtrackUrl
                ? 'Custom audio track configured'
                : 'Using default bundled acoustic pentatonic chimes'}
            </div>
          </div>
        </div>

        {audio.soundtrackUrl && (
          <button
            type="button"
            onClick={handleTogglePlay}
            className="px-4 py-2 rounded-full bg-rose-CTA hover:bg-rose-CTA-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Test Play</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
