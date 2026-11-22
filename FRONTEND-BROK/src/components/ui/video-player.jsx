import * as React from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";

/**
 * Walkthrough VideoPlayer:
 * - Explicit integer `width` and `height` attributes prevent 300x150 CLS fallback.
 * - Autoplays muted when intersecting the viewport (`autoPlayInView`), pauses when scrolled away,
 *   and respects `prefers-reduced-motion: reduce`.
 * - Tap-to-unmute, play/pause toggle, scrubbable progress bar, and fullscreen button.
 */
export function VideoPlayer({
  src,
  poster,
  autoPlayInView = true,
  aboveFold = false,
  loop = true,
  className,
  aspectClassName = "aspect-video",
}) {
  const videoRef = React.useRef(null);
  const containerRef = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(true);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const userPausedRef = React.useRef(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(mq.matches);
      if (mq.matches && videoRef.current) {
        videoRef.current.pause();
      }
    };
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v || !autoPlayInView || reducedMotion) return undefined;
    if (typeof IntersectionObserver === "undefined") return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
            if (!userPausedRef.current) {
              v.muted = muted;
              v.play().catch(() => {});
            }
          } else if (!v.paused) {
            v.pause();
          }
        }
      },
      { threshold: [0, 0.45, 0.8] },
    );

    io.observe(v);
    return () => io.disconnect();
  }, [autoPlayInView, reducedMotion, src, muted]);

  const togglePlay = (e) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      userPausedRef.current = false;
      v.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      v.pause();
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (v.paused && !next) {
      userPausedRef.current = false;
      v.play().catch(() => {});
    }
  };

  const enterFullscreen = (e) => {
    e?.stopPropagation();
    const el = videoRef.current || containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen();
  };

  const handleScrub = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    v.currentTime = ratio * duration;
  };

  if (!src) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative w-full overflow-hidden bg-black select-none",
        aspectClassName,
        className,
      )}
      onClick={toggleMute}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        width={1280}
        height={720}
        loop={loop}
        muted={muted}
        playsInline
        preload="metadata"
        {...(!aboveFold ? { loading: "lazy" } : {})}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          const ct = e.currentTarget.currentTime || 0;
          const dur = e.currentTarget.duration || 0;
          setCurrentTime(ct);
          setProgress(dur > 0 ? (ct / dur) * 100 : 0);
        }}
        className="size-full object-cover"
      />

      {/* Subtle bottom scrim for controls */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
      />

      {/* Center play pill when paused */}
      {!playing ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play walkthrough video"
          className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-float ring-1 ring-white/25 backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
        >
          <Play className="ml-0.5 size-6 fill-current" aria-hidden="true" />
        </button>
      ) : null}

      {/* Top-left walkthrough badge */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white ring-1 ring-white/15 backdrop-blur-md">
        <span className="size-1.5 rounded-full bg-white animate-pulse" />
        <span>VIDEO TOUR</span>
        {duration > 0 ? (
          <span className="text-white/70 tabular-nums">· {formatDuration(duration - currentTime || duration)}</span>
        ) : null}
      </div>

      {/* Bottom control bar */}
      <div
        className="absolute inset-x-3 bottom-3 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          role="slider"
          tabIndex={0}
          aria-label="Seek video"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          onClick={handleScrub}
          onKeyDown={(e) => {
            const v = videoRef.current;
            if (!v) return;
            if (e.key === "ArrowRight") v.currentTime = Math.min(duration, v.currentTime + 5);
            if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
          }}
          className="h-1 w-full cursor-pointer overflow-hidden rounded-full bg-white/25"
        >
          <div
            className="h-full rounded-full bg-white transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause video" : "Play video"}
              className="inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-black/75"
            >
              {playing ? (
                <Pause className="size-4 fill-current" aria-hidden="true" />
              ) : (
                <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute video" : "Mute video"}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-black/75"
            >
              {muted ? (
                <>
                  <VolumeX className="size-4" aria-hidden="true" />
                  <span>Tap for sound</span>
                </>
              ) : (
                <>
                  <Volume2 className="size-4" aria-hidden="true" />
                  <span>Sound on</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={enterFullscreen}
            aria-label="Fullscreen video"
            className="inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-black/75"
          >
            <Maximize2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
