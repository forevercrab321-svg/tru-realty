# Backdrop footage

`components/public/page-backdrop.tsx` renders one fixed, looping video behind the entire
homepage. These are the files it looks for, in order:

| File | Role |
|---|---|
| `nyc-hero.mp4` | H.264 High, the file every mainstream browser plays |
| `nyc-hero.webm` | VP9 fallback for Chromium builds shipped without an H.264 decoder |
| `nyc-hero-poster.jpg` | Painted first and kept until the video is genuinely playing |

The component probes with `canPlayType()` and then a `HEAD` request before attaching a
`<source>`, so any of these can be deleted and the page quietly falls back to the poster.

## What is in there now

The client's dusk fly-through of Lower Manhattan — One World Trade left, the Empire State
Building right, the harbour centre. The source was 1470×630, 10 s, 24 fps, 22 MB.

## How it was processed

Three things had to happen before it could sit behind a scrolling page, and they matter if
the footage is ever replaced:

**1 · Slowed to about 60%.** The original dolly is fast. Behind scrolling content, fast
camera movement fights the scroll and gets tiring within seconds. `setpts` alone would
have produced 15 fps judder, so the frame rate is rebuilt with motion interpolation:

```bash
ffmpeg -i source.mp4 -an \
  -vf "setpts=1.6*PTS,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" \
  -c:v libx264 -crf 16 -preset veryfast -pix_fmt yuv420p master.mp4
```

**2 · Made seamless as a palindrome.** The clip starts on a wide skyline and ends dark and
tight between two towers, so a hard cut jumps and a cross-dissolve turns to mud. Playing it
forward then backward is mathematically seamless, and on a slow dolly it reads as a camera
breathing rather than a rewind. Drop one frame at each turnaround so no frame is doubled:

```bash
ffmpeg -i master.mp4 -vf "reverse,trim=start_frame=1:end_frame=<N-1>,setpts=PTS-STARTPTS" \
  -an -c:v libx264 -crf 15 -preset veryfast rev.mp4
printf "file 'master.mp4'\nfile 'rev.mp4'\n" > cat.txt
ffmpeg -f concat -safe 0 -i cat.txt -c copy palindrome.mp4
```

**3 · Encoded for the web.** `aq-mode=3` is not optional — the sky is a wide, flat gradient
and it bands badly without it. `+faststart` lets playback begin before the file is done.

```bash
ffmpeg -i palindrome.mp4 -an -c:v libx264 -profile:v high -crf 30 -preset slow \
  -pix_fmt yuv420p -g 48 -x264-params "aq-mode=3" -movflags +faststart nyc-hero.mp4
ffmpeg -i palindrome.mp4 -an -c:v libvpx-vp9 -crf 46 -b:v 0 -row-mt 1 \
  -deadline good -cpu-used 4 -pix_fmt yuv420p nyc-hero.webm
ffmpeg -i palindrome.mp4 -frames:v 1 -q:v 4 nyc-hero-poster.jpg
```

Result: 32 s, 5.1 MB mp4 / 2.8 MB webm / 120 KB poster.

## Replacing the footage

Drop the new files in at these exact names and push — no code change. Then check three
things, because they are what actually break:

- **Budget.** Aim under 6 MB for the mp4. Push CRF up before you cut length; the footage is
  slow, so it takes compression well.
- **The left third and the top.** The headline sits on the left of the hero on desktop and
  across the top on phones. Keep those areas calm — sky, water, an unlit facade. Bright
  moving detail there fights the type no matter how heavy the scrim.
- **The phone crop.** The layer is `object-fit: cover` at `50% 45%`. On a 390×844 phone a
  2.33:1 frame is cropped to roughly its centre 25%, so whatever is at the middle of the
  frame is the entire mobile experience. Check it before you ship:

  ```bash
  ffmpeg -i nyc-hero.mp4 -vf "crop=ih*390/844:ih" -frames:v 1 -ss 3 phone-crop.png
  ```

If the new clip already loops cleanly, skip step 2 and encode it directly — the palindrome
exists only because this one does not.
