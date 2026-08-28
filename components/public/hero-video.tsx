"use client";
import * as React from "react";
import { asset } from "@/lib/utils";

const SOURCES = [
  { src: "/media/nyc-hero.mp4", type: 'video/mp4; codecs="avc1.42E01E"' },
  { src: "/media/nyc-hero.webm", type: 'video/webm; codecs="vp9"' },
];

/**
 * Full-bleed looping hero background.
 *
 * The video is progressive enhancement. The generated skyline still is painted first and
 * stays visible until the video can actually play, so the hero is never blank and never
 * flashes.
 *
 * We probe for the file with a HEAD request before attaching any <source>. Without that,
 * a site that has not had footage added yet throws 404s into the console on every visit —
 * harmless, but it looks broken to anyone who opens devtools during a demo.
 *
 * Falls back to the still, silently, when: no video has been uploaded, the browser blocks
 * autoplay, or the visitor has asked for reduced motion.
 */
export function HeroVideo({ className }: { className?: string }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [source, setSource] = React.useState<{ src: string; type: string } | null>(null);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;

    (async () => {
      // Ask the browser what it can decode before asking the network for it. Chromium
      // builds without the proprietary H.264 decoder will silently show a 0x0 video if
      // handed an mp4, which looks identical to "no video" but wastes the download.
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
          // Absent or unreachable — fall through to the next encoding, then to the still.
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
    el.addEventListener("canplay", reveal, { once: true });
    el.play().catch(() => {});
    return () => el.removeEventListener("canplay", reveal);
  }, [source]);

  return (
    <div className={className} aria-hidden>
      <img
        src={asset("/brand/hero.svg")}
        alt=""
        className="absolute inset-0 size-full object-cover object-bottom"
      />
      {source && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="auto"
          className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
            playing ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src={asset(source.src)} type={source.type} />
        </video>
      )}
    </div>
  );
}

/** Animated scroll cue. Decoration, so it is hidden from assistive tech. */
export function ScrollCue({ label = "Scroll to explore" }: { label?: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-white/45"
    >
      <span>{label}</span>
      <span className="relative block h-5 w-px overflow-hidden bg-white/20">
        <span className="absolute inset-x-0 top-0 h-1.5 animate-[cue_2s_ease-in-out_infinite] bg-white/70" />
      </span>
    </div>
  );
}
