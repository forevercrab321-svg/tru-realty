/**
 * Generates local, offline-safe imagery for the Tru Realty demo:
 *  - /public/listings/*.svg   editorial architectural illustrations
 *  - /public/projects/*.svg   new-development renderings
 *  - /public/avatars/*.svg    monogram agent avatars
 *  - /public/brand/*.svg      logo marks + og image
 * Replace with MLS media / real headshots when a media pipeline is connected.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public");
["listings", "projects", "avatars", "brand"].forEach((d) =>
  mkdirSync(join(OUT, d), { recursive: true })
);

/* deterministic PRNG */
function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const ri = (r, a, b) => Math.floor(r() * (b - a + 1)) + a;

/* muted, warm palettes — sky, haze, far, mid, near, detail, ground */
const PALETTES = [
  { sky: ["#cfd8d9", "#f0ece3"], sun: "#f0d3a6", far: "#cbd0cd", mid: "#aab0a9", near: "#7d8580", det: "#5b625e", win: "#fbf6ea", ground: "#8e8d84" },
  { sky: ["#d3dbd6", "#f4f1e8"], sun: "#e8d7ae", far: "#c9d1ca", mid: "#a5afa5", near: "#78857a", det: "#57635a", win: "#f9f6ea", ground: "#8b8f86" },
  { sky: ["#dcd3c6", "#faf2e6"], sun: "#f2c793", far: "#d4c8b8", mid: "#b7a48c", near: "#8b7460", det: "#665445", win: "#fdf4e4", ground: "#9c8d7c" },
  { sky: ["#ccd5df", "#f1f3f6"], sun: "#dce6f0", far: "#c8cfd8", mid: "#a4adba", near: "#7b8493", det: "#5b6370", win: "#f6f9fc", ground: "#8d95a0" },
  { sky: ["#e0cfc2", "#fbf3e9"], sun: "#eeb787", far: "#d8c8bb", mid: "#bba694", near: "#8e7969", det: "#68574a", win: "#fdf3e6", ground: "#9d8b7c" },
  { sky: ["#d2dccd", "#f5f6ec"], sun: "#d8e0b6", far: "#cbd3c3", mid: "#a8b29e", near: "#7e8a76", det: "#5d6857", win: "#f8faee", ground: "#8d9484" },
];

const W = 1200, H = 800;

function windows(x, y, w, h, cols, rows, color, r, opacity = 0.92) {
  const gx = w / cols, gy = h / rows, pw = gx * 0.5, ph = gy * 0.52;
  let s = "";
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      if (r() < 0.14) continue;
      const o = (opacity * (0.62 + r() * 0.38)).toFixed(2);
      s += `<rect x="${(x + i * gx + (gx - pw) / 2).toFixed(1)}" y="${(y + j * gy + (gy - ph) / 2).toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}" rx="1" fill="${color}" opacity="${o}"/>`;
    }
  return s;
}

const TYPES = {
  /* Manhattan / Downtown tower */
  tower(r, p) {
    let s = "";
    for (let i = 0; i < 7; i++) {
      const w = ri(r, 70, 150), x = i * 175 + ri(r, -25, 25), h = ri(r, 160, 400);
      s += `<rect x="${x}" y="${H - 190 - h}" width="${w}" height="${h + 190}" fill="${p.far}" opacity="0.75"/>`;
    }
    const bw = 340, bx = (W - bw) / 2, bh = 560, by = H - 170 - bh;
    s += `<rect x="${bx - 120}" y="${H - 170 - 330}" width="110" height="330" fill="${p.mid}"/>`;
    s += windows(bx - 112, H - 170 - 318, 94, 300, 4, 12, p.win, r, 0.5);
    s += `<rect x="${bx + bw + 14}" y="${H - 170 - 400}" width="130" height="400" fill="${p.mid}"/>`;
    s += windows(bx + bw + 24, H - 170 - 386, 110, 366, 5, 14, p.win, r, 0.5);
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${p.near}"/>`;
    s += `<rect x="${bx}" y="${by}" width="26" height="${bh}" fill="${p.det}" opacity="0.5"/>`;
    s += windows(bx + 34, by + 26, bw - 68, bh - 90, 6, 17, p.win, r);
    s += `<rect x="${bx + 40}" y="${by - 46}" width="${bw - 80}" height="46" fill="${p.det}"/>`;
    s += `<rect x="${bx + bw / 2 - 4}" y="${by - 118}" width="8" height="72" fill="${p.det}"/>`;
    return s;
  },
  /* Brooklyn brownstone row */
  brownstone(r, p) {
    let s = "";
    const n = 4, bw = 250, total = n * bw, x0 = (W - total) / 2, top = 250;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * bw, h = H - 150 - top + ri(r, -22, 22);
      const c = [p.mid, p.near, p.det, p.mid][i % 4];
      s += `<rect x="${x}" y="${H - 150 - h}" width="${bw - 8}" height="${h}" fill="${c}"/>`;
      s += `<rect x="${x - 8}" y="${H - 150 - h - 20}" width="${bw + 8}" height="22" fill="${p.det}" opacity="0.85"/>`;
      for (let j = 0; j < 4; j++)
        for (let k = 0; k < 2; k++)
          s += `<path d="M${x + 42 + k * 96} ${H - 150 - h + 126 + j * 92} v-40 a31 31 0 0 1 62 0 v40 z" fill="${p.win}" opacity="${(0.6 + r() * 0.35).toFixed(2)}"/>`;
      s += `<rect x="${x + 88}" y="${H - 214}" width="70" height="64" rx="34" fill="${p.det}"/>`;
      s += `<path d="M${x + 74} ${H - 150} L${x + 172} ${H - 150} L${x + 158} ${H - 118} L${x + 88} ${H - 118} Z" fill="${p.ground}" opacity="0.9"/>`;
    }
    return s;
  },
  /* Suburban / Long Island colonial */
  colonial(r, p) {
    let s = "";
    const bw = 560, bx = (W - bw) / 2, bh = 260, by = H - 165 - bh;
    s += `<circle cx="${bx - 150}" cy="${H - 230}" r="118" fill="${p.far}" opacity="0.8"/>`;
    s += `<circle cx="${bx + bw + 140}" cy="${H - 250}" r="140" fill="${p.far}" opacity="0.7"/>`;
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${p.near}"/>`;
    s += `<path d="M${bx - 44} ${by} L${bx + bw / 2} ${by - 150} L${bx + bw + 44} ${by} Z" fill="${p.det}"/>`;
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 5; i++) {
        if (j === 1 && i === 2) continue;
        s += `<rect x="${bx + 46 + i * 98}" y="${by + 42 + j * 116}" width="66" height="80" fill="${p.win}" opacity="${(0.65 + r() * 0.3).toFixed(2)}"/>`;
      }
    s += `<rect x="${bx + bw / 2 - 40}" y="${by + 158}" width="80" height="102" rx="4" fill="${p.det}"/>`;
    s += `<rect x="${bx + bw - 120}" y="${by - 96}" width="46" height="96" fill="${p.det}"/>`;
    return s;
  },
  /* Queens / mid-rise loft */
  loft(r, p) {
    let s = "";
    for (let i = 0; i < 5; i++) {
      const w = ri(r, 120, 220), x = i * 250 + ri(r, -40, 40), h = ri(r, 120, 240);
      s += `<rect x="${x}" y="${H - 175 - h}" width="${w}" height="${h + 175}" fill="${p.far}" opacity="0.7"/>`;
    }
    const bw = 660, bx = (W - bw) / 2, bh = 380, by = H - 160 - bh;
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="${p.near}"/>`;
    for (let j = 0; j < 4; j++) {
      s += `<rect x="${bx + 26}" y="${by + 24 + j * 92}" width="${bw - 52}" height="66" fill="${p.win}" opacity="${(0.55 + r() * 0.35).toFixed(2)}"/>`;
      for (let i = 1; i < 6; i++)
        s += `<rect x="${bx + 26 + i * ((bw - 52) / 6)}" y="${by + 24 + j * 92}" width="6" height="66" fill="${p.det}"/>`;
    }
    s += `<rect x="${bx - 18}" y="${by - 22}" width="${bw + 36}" height="24" fill="${p.det}"/>`;
    return s;
  },
  /* Waterfront / Hamptons modern */
  waterfront(r, p) {
    let s = `<rect x="0" y="${H - 200}" width="${W}" height="200" fill="${p.far}" opacity="0.55"/>`;
    for (let i = 0; i < 16; i++)
      s += `<rect x="${ri(r, 0, W)}" y="${H - 190 + ri(r, 0, 170)}" width="${ri(r, 40, 140)}" height="3" rx="2" fill="${p.win}" opacity="0.5"/>`;
    const bw = 720, bx = (W - bw) / 2, by = H - 300;
    s += `<rect x="${bx}" y="${by}" width="${bw}" height="120" fill="${p.near}"/>`;
    s += `<rect x="${bx + 90}" y="${by - 130}" width="${bw - 260}" height="132" fill="${p.mid}"/>`;
    s += `<rect x="${bx + 16}" y="${by + 22}" width="${bw - 32}" height="76" fill="${p.win}" opacity="0.82"/>`;
    s += `<rect x="${bx + 108}" y="${by - 108}" width="${bw - 296}" height="88" fill="${p.win}" opacity="0.7"/>`;
    for (let i = 1; i < 7; i++) s += `<rect x="${bx + 16 + i * ((bw - 32) / 7)}" y="${by + 22}" width="7" height="76" fill="${p.det}"/>`;
    s += `<rect x="${bx - 40}" y="${by + 118}" width="${bw + 80}" height="14" fill="${p.det}"/>`;
    return s;
  },
  /* New development massing */
  development(r, p) {
    let s = "";
    const n = ri(r, 4, 6);
    const blocks = Array.from({ length: n }, () => [ri(r, 150, 300), ri(r, 260, 660)]);
    let x = ri(r, 60, 200);
    blocks.forEach(([w, h], i) => {
      s += `<rect x="${x}" y="${H - 150 - h}" width="${w}" height="${h}" fill="${i % 2 ? p.mid : p.near}"/>`;
      s += windows(x + 16, H - 150 - h + 20, w - 32, h - 48, Math.max(3, Math.round(w / 55)), Math.round(h / 40), p.win, r, 0.62);
      s += `<rect x="${x - 8}" y="${H - 150 - h - 16}" width="${w + 16}" height="18" fill="${p.det}" opacity="0.8"/>`;
      x += w + 24;
    });
    for (let i = 0; i < 5; i++)
      s += `<circle cx="${140 + i * 230}" cy="${H - 118}" r="26" fill="${p.ground}" opacity="0.55"/>`;
    return s;
  },
};

function scene(seed, type) {
  const r = rng(seed);
  const p = PALETTES[Math.floor(rng(seed + "p")() * PALETTES.length)];
  const body = TYPES[type](r, p);
  const sunX = ri(r, 200, W - 200), sunY = ri(r, 110, 230);
  const fgSide = r() > 0.5 ? "left" : "right";
  const fg = fgSide === "left"
    ? `<path d="M0 ${H} L0 ${ri(r, 60, 220)} L${ri(r, 90, 170)} ${ri(r, 150, 320)} L${ri(r, 100, 190)} ${H} Z" fill="${p.det}" opacity="0.5"/>`
    : `<path d="M${W} ${H} L${W} ${ri(r, 60, 220)} L${W - ri(r, 90, 170)} ${ri(r, 150, 320)} L${W - ri(r, 100, 190)} ${H} Z" fill="${p.det}" opacity="0.5"/>`;
  const horizon = H - 150;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="0.62" stop-color="${p.sky[1]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${p.sun}" stop-opacity="0.95"/><stop offset="0.45" stop-color="${p.sun}" stop-opacity="0.32"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[1]}" stop-opacity="0"/><stop offset="1" stop-color="${p.sky[1]}" stop-opacity="0.78"/></linearGradient>
<linearGradient id="street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.ground}"/><stop offset="1" stop-color="${p.det}" stop-opacity="0.9"/></linearGradient>
<radialGradient id="vig" cx="50%" cy="46%" r="72%"><stop offset="0.55" stop-color="#16181a" stop-opacity="0"/><stop offset="1" stop-color="#16181a" stop-opacity="0.24"/></radialGradient>
<linearGradient id="warm" x1="0" y1="0" x2="1" y2="0.4"><stop offset="0" stop-color="${p.sun}" stop-opacity="0.18"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<circle cx="${sunX}" cy="${sunY}" r="300" fill="url(#glow)"/>
<circle cx="${sunX}" cy="${sunY}" r="52" fill="${p.sun}" opacity="0.85"/>
${body}
<rect x="0" y="${horizon - 210}" width="${W}" height="210" fill="url(#haze)" opacity="0.34"/>
<rect x="0" y="${horizon}" width="${W}" height="150" fill="url(#street)"/>
<rect x="0" y="${horizon}" width="${W}" height="7" fill="${p.win}" opacity="0.28"/>
<rect x="0" y="${horizon + 78}" width="${W}" height="2" fill="${p.win}" opacity="0.16"/>
${fg}
<rect width="${W}" height="${H}" fill="url(#warm)"/>
<rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

const LISTING_TYPES = ["tower", "brownstone", "colonial", "loft", "waterfront", "tower", "brownstone", "loft", "waterfront", "colonial", "tower", "loft", "brownstone", "colonial", "waterfront", "tower", "loft", "brownstone", "waterfront", "colonial", "tower", "loft", "brownstone", "colonial"];
LISTING_TYPES.forEach((t, i) => {
  for (let v = 1; v <= 3; v++)
    writeFileSync(join(OUT, "listings", `l${i + 1}-${v}.svg`), scene(`listing-${i + 1}-${v}`, v === 1 ? t : pick(rng(`v${i}${v}`), ["tower", "loft", "brownstone", "waterfront", "colonial"])));
});
for (let i = 1; i <= 8; i++)
  writeFileSync(join(OUT, "projects", `p${i}.svg`), scene(`project-${i}`, "development"));

/* ---------- Monogram avatars ---------- */
const AV = [
  ["#e6e2d8", "#5c5a50"], ["#dee6e0", "#4a5c50"], ["#e3e1ea", "#525068"],
  ["#eae0da", "#6b5346"], ["#dfe5ec", "#47576b"], ["#e8e4dd", "#655c4c"],
  ["#e0e8e4", "#41564c"], ["#ece2e6", "#6b4f58"], ["#e2e6de", "#4f5c46"],
  ["#e5e1e9", "#57506a"],
];
export function avatar(initials, seed) {
  const [bg, fg] = AV[Math.floor(rng(seed)() * AV.length)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg}" stop-opacity="0.65"/></linearGradient></defs><rect width="200" height="200" fill="url(#g)"/><text x="100" y="100" font-family="Inter, sans-serif" font-size="76" font-weight="500" fill="${fg}" text-anchor="middle" dominant-baseline="central" letter-spacing="1">${initials}</text></svg>`;
}

const PEOPLE = process.env.TRU_PEOPLE ? JSON.parse(process.env.TRU_PEOPLE) : [];
PEOPLE.forEach(({ id, name }) => {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  writeFileSync(join(OUT, "avatars", `${id}.svg`), avatar(initials, id));
});

/* ---------- Brand ---------- */
writeFileSync(join(OUT, "brand", "og.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630"><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c2921"/><stop offset="1" stop-color="#2f4635"/></linearGradient></defs><rect width="1200" height="630" fill="url(#b)"/><text x="80" y="330" font-family="Inter, sans-serif" font-size="86" font-weight="600" fill="#f6f5f2" letter-spacing="-2">Tru Realty</text><text x="80" y="396" font-family="Inter, sans-serif" font-size="30" fill="#9bb59d">Real Estate. Built Around You.</text></svg>`);
console.log("assets generated");

/* ---------- Wide hero skyline (public site) ---------- */
function hero(seed) {
  const r = rng(seed);
  const HW = 2400, HH = 1200, horizon = HH - 210;
  const sky = ["#1b2a2b", "#3d4a44", "#7d7a68", "#c9a279"];
  let bands = "";
  const layers = [
    { y: horizon, min: 120, max: 380, w: [70, 190], fill: "#26332f", op: 0.55, step: 150 },
    { y: horizon, min: 200, max: 620, w: [80, 220], fill: "#1d2926", op: 0.78, step: 190 },
    { y: horizon, min: 280, max: 820, w: [110, 260], fill: "#141d1b", op: 1, step: 250 },
  ];
  layers.forEach((L, li) => {
    for (let x = -80; x < HW + 80; x += ri(r, L.step * 0.6, L.step)) {
      const w = ri(r, L.w[0], L.w[1]), h = ri(r, L.min, L.max);
      bands += `<rect x="${x}" y="${L.y - h}" width="${w}" height="${h + 220}" fill="${L.fill}" opacity="${L.op}"/>`;
      if (li === 2) {
        const cols = Math.max(2, Math.round(w / 46)), rows = Math.round(h / 46);
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          if (r() < 0.55) continue;
          bands += `<rect x="${(x + 12 + i * ((w - 24) / cols)).toFixed(0)}" y="${(L.y - h + 16 + j * ((h - 32) / rows)).toFixed(0)}" width="12" height="16" fill="#e8c89a" opacity="${(0.25 + r() * 0.6).toFixed(2)}"/>`;
        }
      }
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${HW} ${HH}" width="${HW}" height="${HH}">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${sky[0]}"/><stop offset="0.45" stop-color="${sky[1]}"/>
<stop offset="0.78" stop-color="${sky[2]}"/><stop offset="1" stop-color="${sky[3]}"/></linearGradient>
<radialGradient id="sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f4c98d" stop-opacity="0.9"/><stop offset="1" stop-color="#f4c98d" stop-opacity="0"/></radialGradient>
<linearGradient id="haze2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[2]}" stop-opacity="0"/><stop offset="1" stop-color="${sky[3]}" stop-opacity="0.6"/></linearGradient>
<linearGradient id="wtr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3735"/><stop offset="1" stop-color="#161f1e"/></linearGradient>
</defs>
<rect width="${HW}" height="${HH}" fill="url(#s)"/>
<circle cx="1560" cy="${horizon - 60}" r="520" fill="url(#sun)"/>
<circle cx="1560" cy="${horizon - 60}" r="72" fill="#f6d6a4" opacity="0.9"/>
${bands}
<rect x="0" y="${horizon - 320}" width="${HW}" height="320" fill="url(#haze2)"/>
<rect x="0" y="${horizon}" width="${HW}" height="210" fill="url(#wtr)"/>
${Array.from({ length: 40 }).map(() => `<rect x="${ri(r, 0, HW)}" y="${horizon + ri(r, 10, 195)}" width="${ri(r, 60, 240)}" height="3" rx="2" fill="#e8c89a" opacity="${(0.05 + r() * 0.16).toFixed(2)}"/>`).join("")}
</svg>`;
}
writeFileSync(join(OUT, "brand", "hero.svg"), hero("tru-hero-9"));
writeFileSync(join(OUT, "brand", "hero-alt.svg"), hero("tru-hero-3"));
console.log("hero generated");
