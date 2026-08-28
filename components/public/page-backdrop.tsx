"use client";
import * as React from "react";
import { asset } from "@/lib/utils";

const SOURCES = [
  { src: "/media/nyc-hero.mp4", type: 'video/mp4; codecs="avc1.640020"' },
  { src: "/media/nyc-hero.webm", type: 'video/webm; codecs="vp9"' },
];

const POSTER = "/media/nyc-hero-poster.jpg";

/**
 * The page's backdrop — one fixed, looping video that every section scrolls over, so the
 * skyline stays visible from the hero all the way to the footer instead of ending at the
 * fold.
 *
 * It is `position: fixed` rather than a background on the hero, which means:
 *   - one decode for the whole page, not one per section
 *   - the footage never scrolls out of view, so panes read as glass floating over the city
 *   - no `background-attachment: fixed`, which iOS has never implemented properly
 *
 * Everything about it is progressive enhancement. The poster still is painted underneath
 * and stays put until the video is genuinely playing, so the page is never blank, never
 * flashes, and looks deliberate on every path that ends without motion:
 *
 *   1. `prefers-reduced-motion: reduce` — we never even fetch the video.
 *   2. `canPlayType()` before the network call. A Chromium build without the H.264
 *      decoder renders a silent 0x0 video, which is indistinguishable from "broken".
 *   3. A `HEAD` probe before attaching a `<source>`, so a missing file degrades quietly
 *      instead of throwing 404s that look alarming in a demo.
 *   4. Reveal on `playing`, never `canplay` — `canplay` would fade in a frozen first
 *      frame whenever playback was blocked, which is worse than the still.
 *   5. Retry `play()` on visibility change and on the first gesture. A muted autoplay is
 *      still refused or suspended by background tabs, iOS Low Power Mode and strict
 *      autoplay settings; one attempt at mount is not enough.
 */
export function PageBackdrop() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [source, setSource] = React.useState<{ src: string; type: string } | null>(null);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;

    (async () => {
      const probe = document.createElement("video");
      const playable = SOURCES.filter((s) => probe.canPlayType(s.type) !== "");

      for (const s of playable) {
        try {
          const res = await fetch(asset(s.src), { method: "HEAD" });
          if (res.ok && !cancelled) {
            setSource(s);
            return;
          }
        } catch {
          // Absent or unreachable — try the next encoding, then fall back to the still.
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el || !source) return;
    el.load();

    const reveal = () => setPlaying(true);
    const conceal = () => setPlaying(false);
    const attempt = () => {
      if (el.paused) void el.play().catch(() => {});
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") attempt();
    };

    el.addEventListener("playing", reveal);
    el.addEventListener("error", conceal);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pointerdown", attempt, { passive: true });
    window.addEventListener("keydown", attempt);
    attempt();

    return () => {
      el.removeEventListener("playing", reveal);
      el.removeEventListener("error", conceal);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointerdown", attempt);
      window.removeEventListener("keydown", attempt);
    };
  }, [source]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink" aria-hidden>
      <img
        src={asset(POSTER)}
        alt=""
        className="absolute inset-0 size-full object-cover"
        style={{ objectPosition: "50% 45%" }}
      />
      {source && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={asset(POSTER)}
          style={{ objectPosition: "50% 45%" }}
          className={`absolute inset-0 size-full object-cover transition-opacity duration-[1200ms] ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src={asset(source.src)} type={source.type} />
        </video>
      )}
      {/* A permanent, very light knock-down. The footage is dusk-lit and high contrast;
          without this the white panes above it pick up too much moving detail at their
          edges. Weak enough that the hero still reads as full-strength video. */}
      <div className="absolute inset-0 bg-ink/15" />
    </div>
  );
}

/**
 * A full-bleed band where the video plays at full strength between two content panes.
 * These are what make the backdrop legible as a *video* rather than a texture — the panes
 * veil it by necessity, so the page needs moments that do not.
 */
export function RevealBand({
  eyebrow,
  children,
  className = "",
}: {
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`relative z-10 flex min-h-[300px] items-center py-16 sm:py-20 ${className}`}>
      {/* Feathered top and bottom so the band does not read as a hard-edged window, plus a
          left-weighted wash — the copy sits left and the sky in this footage is bright. */}
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/28 to-ink/50" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-ink/45 via-ink/10 to-transparent sm:block" />
      <div className="relative mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        {eyebrow && (
          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.14em] text-white/75">
            {eyebrow}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
