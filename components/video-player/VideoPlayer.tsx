'use client';

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gauge, Pause, Play, Volume2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/trackEvent';

type VideoPlayerProps = {
  lessonId: string;
  courseId: string;
  videoUrl: string;
  durationSeconds: number | null;
  initialWatchedSeconds: number;
  onProgressSaved: (progress: { watchedSeconds: number; completed: boolean }) => void;
};

type ProgressApiResponse = {
  data: {
    watched_seconds: number;
    completed: boolean;
  } | null;
  error: string | null;
  status: number;
};

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};

const formatTime = (seconds: number): string => {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function VideoPlayer({
  lessonId,
  courseId,
  videoUrl,
  durationSeconds,
  initialWatchedSeconds,
  onProgressSaved,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mountedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const queuedWatchedSecondsRef = useRef<number | null>(null);
  const lastSavedBucketRef = useRef(Math.floor(initialWatchedSeconds / 10));

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialWatchedSeconds);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const effectiveDuration = useMemo(() => {
    if (duration > 0) {
      return duration;
    }

    if (durationSeconds && durationSeconds > 0) {
      return durationSeconds;
    }

    return 0;
  }, [duration, durationSeconds]);

  const saveProgress = useCallback(
    async (watchedSeconds: number) => {
      const sanitizedWatchedSeconds = Math.max(0, Math.floor(watchedSeconds));

      if (saveInFlightRef.current) {
        queuedWatchedSecondsRef.current = sanitizedWatchedSeconds;
        return;
      }

      saveInFlightRef.current = true;

      try {
        const response = await fetch('/api/enrollments/progress', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lesson_id: lessonId,
            watched_seconds: sanitizedWatchedSeconds,
          }),
        });

        const result = (await response.json()) as ProgressApiResponse;

        if (!response.ok || !result.data) {
          setError(result.error ?? 'Unable to save progress.');
          return;
        }

        setError(null);
        onProgressSaved({
          watchedSeconds: result.data.watched_seconds,
          completed: result.data.completed,
        });
      } catch {
        setError('Unable to save progress.');
      } finally {
        saveInFlightRef.current = false;

        const queuedWatchedSeconds = queuedWatchedSecondsRef.current;
        queuedWatchedSecondsRef.current = null;

        if (queuedWatchedSeconds !== null) {
          void saveProgress(queuedWatchedSeconds);
        }
      }
    },
    [lessonId, onProgressSaved],
  );

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const handleLoadedMetadata = () => {
      const nativeDuration = Number.isFinite(video.duration) ? video.duration : 0;
      if (nativeDuration > 0) {
        setDuration(nativeDuration);
      }

      if (!mountedRef.current) {
        const maxSeek = nativeDuration > 0 ? nativeDuration : effectiveDuration;
        const startPosition = clamp(initialWatchedSeconds, 0, maxSeek > 0 ? maxSeek : initialWatchedSeconds);
        video.currentTime = startPosition;
        setCurrentTime(startPosition);
        mountedRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const watchedSeconds = Math.floor(video.currentTime);
      const currentBucket = Math.floor(watchedSeconds / 10);

      if (currentBucket > lastSavedBucketRef.current) {
        lastSavedBucketRef.current = currentBucket;
        void saveProgress(watchedSeconds);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      void trackEvent('video_play', {
        course_id: courseId,
        lesson_id: lessonId,
        at_second: Math.floor(video.currentTime),
      });
    };
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      const watchedSeconds = Math.floor(video.currentTime);
      const endedBucket = Math.floor(watchedSeconds / 10);

      if (endedBucket > lastSavedBucketRef.current) {
        lastSavedBucketRef.current = endedBucket;
      }

      void saveProgress(watchedSeconds);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [courseId, effectiveDuration, initialWatchedSeconds, lessonId, saveProgress]);

  const togglePlayback = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const handleSeekChange = (event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextTime = Number(event.target.value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextVolume = Number(event.target.value);
    video.volume = clamp(nextVolume, 0, 1);
    setVolume(video.volume);
  };

  const handlePlaybackRateChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextPlaybackRate = Number(event.target.value);
    video.playbackRate = nextPlaybackRate;
    setPlaybackRate(nextPlaybackRate);
  };

  return (
    <div className="space-y-4 rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-4 shadow-glass backdrop-blur-xl">
      <video ref={videoRef} src={videoUrl} className="w-full rounded-xl border border-brand-border bg-black" playsInline />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void togglePlayback()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-[#0f1734] px-3 py-2">
            <Gauge className="h-4 w-4 text-brand-muted" />
            <label htmlFor="playback-speed" className="text-xs text-brand-muted">
              Speed
            </label>
            <select
              id="playback-speed"
              value={playbackRate}
              onChange={handlePlaybackRateChange}
              className="bg-transparent text-sm text-white outline-none"
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <option key={speed} value={speed} className="bg-[#0A0F1E]">
                  {speed}x
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-[#0f1734] px-3 py-2">
            <Volume2 className="h-4 w-4 text-brand-muted" />
            <input
              id="volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>

        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={effectiveDuration > 0 ? effectiveDuration : 0}
            step={0.1}
            value={Math.min(currentTime, effectiveDuration || currentTime)}
            onChange={handleSeekChange}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-brand-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-500/60 bg-red-500/10 px-2.5 py-2 text-xs text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
