import * as React from "react";
import { ChevronLeft, ChevronRight, Expand, Film, Images, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ModalRoot } from "./dialog";
import { VideoPlayer } from "./video-player";

/**
 * Property MediaGallery:
 * - Places the walkthrough video (`video.url`) as the FIRST slide when present,
 *   followed by all photos (`images[]`).
 * - Swipeable on touch devices, keyboard navigable, thumbnail strip on desktop,
 *   and fullscreen modal viewer.
 */
export function MediaGallery({ images = [], video = null, title = "Property", className }) {
  const slides = React.useMemo(() => {
    const out = [];
    if (video?.url) {
      out.push({
        type: "video",
        url: video.url,
        poster: video.thumbnail || images?.[0] || "",
      });
    }
    for (const img of images || []) {
      if (img) out.push({ type: "image", url: img });
    }
    return out;
  }, [images, video]);

  const [index, setIndex] = React.useState(0);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const touchStartX = React.useRef(null);

  React.useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  const count = slides.length;
  const go = React.useCallback(
    (delta) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  if (count === 0) {
    return (
      <div
        className={cn(
          "flex aspect-[16/10] w-full flex-col items-center justify-center rounded-3xl border border-border/70 bg-muted text-muted-foreground",
          className,
        )}
      >
        <Images className="mb-2 size-8 opacity-60" aria-hidden="true" />
        <p className="text-sm font-medium">No media uploaded</p>
      </div>
    );
  }

  const current = slides[index] || slides[0];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="group relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[16/9] sm:rounded-3xl"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
          touchStartX.current = null;
          if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
        }}
      >
        {current.type === "video" ? (
          <VideoPlayer
            key={current.url}
            src={current.url}
            poster={current.poster}
            aboveFold
            autoPlayInView
            aspectClassName="h-full w-full"
          />
        ) : (
          <img
            key={current.url}
            src={current.url}
            alt={`${title} — photo ${index + 1} of ${count}`}
            width={1280}
            height={800}
            onClick={() => setLightboxOpen(true)}
            className="size-full cursor-zoom-in object-cover transition-transform duration-500"
          />
        )}

        {/* Prev / Next arrows */}
        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous media"
              className="absolute left-3 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next media"
              className="absolute right-3 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}

        {/* Top-right counter + expand */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-md">
            {current.type === "video" ? (
              <Film className="size-3.5" aria-hidden="true" />
            ) : (
              <Images className="size-3.5" aria-hidden="true" />
            )}
            <span>
              {index + 1} / {count}
            </span>
          </span>
          {current.type === "image" ? (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="Open fullscreen gallery"
              className="inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-black/75"
            >
              <Expand className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Thumbnail rail */}
      {count > 1 ? (
        <div className="flex items-center gap-2 overflow-x-auto px-4 sm:px-0 scrollbar-hide">
          {slides.map((s, idx) => {
            const active = idx === index;
            return (
              <button
                key={`${s.type}-${s.url}-${idx}`}
                type="button"
                onClick={() => setIndex(idx)}
                aria-label={s.type === "video" ? "Show walkthrough video" : `Show photo ${idx + 1}`}
                className={cn(
                  "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                  active
                    ? "border-foreground opacity-100"
                    : "border-transparent opacity-55 hover:opacity-100",
                )}
              >
                {s.type === "video" ? (
                  <>
                    {s.poster ? (
                      <img src={s.poster} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full bg-neutral-900" />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                      <Film className="size-4" aria-hidden="true" />
                    </span>
                  </>
                ) : (
                  <img src={s.url} alt="" loading="lazy" className="size-full object-cover" />
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Fullscreen Lightbox */}
      <ModalRoot
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        ariaLabel={`${title} fullscreen gallery`}
        backdropClassName="bg-black/92 backdrop-blur-md"
      >
        <div className="pointer-events-auto relative flex size-full flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close fullscreen gallery"
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center py-4">
            {current.type === "video" ? (
              <VideoPlayer
                src={current.url}
                poster={current.poster}
                aboveFold
                autoPlayInView={false}
                className="max-h-full max-w-5xl rounded-2xl"
              />
            ) : (
              <img
                src={current.url}
                alt={`${title} — photo ${index + 1}`}
                className="max-h-full max-w-full rounded-xl object-contain"
              />
            )}

            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous"
                  className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next"
                  className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </ModalRoot>
    </div>
  );
}
