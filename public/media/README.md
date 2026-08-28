# Hero media

Drop the NYC hero footage here as **`nyc-hero.mp4`** (and optionally `nyc-hero.webm`).
The homepage picks it up automatically — no code change needed. Until a file exists the
hero falls back to the generated skyline still, so the page never looks broken.

## Encoding targets

GitHub Pages caps a single file at 100 MB, but the number that matters is how fast it
starts on a phone. Aim for **4–8 MB**, 10–20 seconds, seamlessly loopable.

```bash
# H.264 — plays everywhere
ffmpeg -i source.mov -t 16 -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -crf 26 -preset slow -profile:v high -pix_fmt yuv420p \
  -movflags +faststart -an nyc-hero.mp4

# VP9 — ~30% smaller where supported, optional
ffmpeg -i source.mov -t 16 -vf "scale=1920:-2,fps=30" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -an nyc-hero.webm

# Poster frame pulled from the video itself, so the handoff is invisible
ffmpeg -i nyc-hero.mp4 -vf "select=eq(n\,0)" -q:v 2 -frames:v 1 nyc-hero-poster.jpg
```

`-movflags +faststart` matters: without it the browser downloads the whole file before
the first frame paints.

## Shooting / choosing the clip

- **Slow movement.** A drifting aerial or a locked-off timelapse reads as premium; fast
  cuts fight the headline sitting on top of it.
- **Keep the left third calm.** The headline and CTAs sit there. Busy detail behind text
  is the most common way a video hero turns illegible.
- **Dusk or blue hour** sits best against the brand palette and makes white text easy.
- **Loop point.** Start and end on a similar frame or the restart will visibly jump.

## Muted, always

The hero video is `muted` + `playsinline` — required for autoplay on iOS and Chrome, and
correct anyway: nobody wants sound on a homepage.
