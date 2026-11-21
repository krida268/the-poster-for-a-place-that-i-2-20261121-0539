// Velmora — a travel poster for a place that isn't there.
// A sky city floating above a sea of clouds in a high mountain valley.
// Pure Node stdlib: hand-rolled PNG encoder, a 5x7 bitmap font drawn by
// this program, and vector scenery painted pixel by pixel. No network,
// no clock, no randomness: the same bytes come out every run.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

const buf = Buffer.alloc(W * H * 4);

function px(x: number, y: number, c: RGB): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || ix >= W || iy < 0 || iy >= H) return;
  const o = (iy * W + ix) * 4;
  buf[o] = c[0];
  buf[o + 1] = c[1];
  buf[o + 2] = c[2];
  buf[o + 3] = 255;
}

function blend(x: number, y: number, c: RGB, a: number): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || ix >= W || iy < 0 || iy >= H) return;
  const o = (iy * W + ix) * 4;
  buf[o] = Math.round(buf[o] * (1 - a) + c[0] * a);
  buf[o + 1] = Math.round(buf[o + 1] * (1 - a) + c[1] * a);
  buf[o + 2] = Math.round(buf[o + 2] * (1 - a) + c[2] * a);
  buf[o + 3] = 255;
}

function rect(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  for (let y = Math.max(0, Math.round(y0)); y <= Math.min(H - 1, Math.round(y1)); y++) {
    for (let x = Math.max(0, Math.round(x0)); x <= Math.min(W - 1, Math.round(x1)); x++) {
      px(x, y, c);
    }
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(c1: RGB, c2: RGB, t: number): RGB {
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}

// ---- sky: a dawn gradient from indigo night to gold morning ----
const skyStops: [number, RGB][] = [
  [0, [26, 30, 66]],
  [0.28, [84, 66, 110]],
  [0.48, [186, 96, 96]],
  [0.62, [240, 158, 94]],
  [0.78, [248, 208, 138]],
  [1, [250, 226, 170]],
];

function skyAt(y: number): RGB {
  const t = Math.min(1, Math.max(0, y / 800));
  for (let i = 1; i < skyStops.length; i++) {
    if (t <= skyStops[i][0]) {
      const [t0, c0] = skyStops[i - 1];
      const [t1, c1] = skyStops[i];
      return mix(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return skyStops[skyStops.length - 1][1];
}

for (let y = 0; y < 800; y++) {
  const c = skyAt(y);
  for (let x = 0; x < W; x++) px(x, y, c);
}

// ---- stars fading out as dawn rises (fixed positions, no random) ----
for (let i = 0; i < 90; i++) {
  const sx = (i * 173 + 41) % W;
  const sy = ((i * 97 + 13) % 240) + 8;
  const s = i % 3 === 0 ? 2 : 1;
  const a = sy < 120 ? 0.9 : 0.55;
  for (let dy = 0; dy < s; dy++)
    for (let dx = 0; dx < s; dx++) blend(sx + dx, sy + dy, [255, 244, 214], a);
}

// ---- sun with a soft halo, upper right ----
function disc(cx: number, cy: number, r: number, c: RGB, a: number): void {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) blend(x, y, c, a);
    }
  }
}

disc(782, 208, 132, [255, 214, 140], 0.16);
disc(782, 208, 96, [255, 216, 150], 0.28);
disc(782, 208, 62, [255, 226, 160], 1);
disc(782, 208, 46, [255, 240, 196], 1);

// ---- mountain ridges, far then near ----
function poly(points: [number, number][], c: RGB): void {
  let minY = H;
  let maxY = 0;
  for (const [, y] of points) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  for (let y = Math.max(0, Math.floor(minY)); y <= Math.min(H - 1, Math.ceil(maxY)); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.max(0, Math.ceil(xs[k])); x <= Math.min(W - 1, Math.floor(xs[k + 1])); x++) {
        px(x, y, c);
      }
    }
  }
}

poly(
  [
    [0, 560], [90, 470], [170, 540], [260, 452], [360, 548], [470, 478],
    [560, 552], [660, 462], [760, 545], [860, 488], [950, 548], [1024, 500],
    [1024, 800], [0, 800],
  ],
  [74, 52, 96],
);
poly(
  [
    [0, 610], [120, 540], [230, 606], [330, 528], [440, 612], [560, 540],
    [680, 614], [800, 545], [920, 610], [1024, 560], [1024, 800], [0, 800],
  ],
  [58, 40, 80],
);

// ---- sea of clouds: stacked soft ellipses ----
function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB, a = 1): void {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) {
        if (a >= 1) px(x, y, c);
        else blend(x, y, c, a);
      }
    }
  }
}

const cloudPuffs: [number, number, number, number, RGB][] = [
  [90, 700, 210, 52, [253, 243, 227]],
  [260, 724, 250, 60, [250, 234, 214]],
  [470, 706, 270, 58, [253, 246, 232]],
  [690, 726, 260, 62, [248, 230, 210]],
  [920, 706, 220, 55, [253, 244, 228]],
  [150, 760, 260, 64, [232, 214, 238]],
  [420, 768, 300, 66, [238, 220, 240]],
  [760, 764, 300, 64, [230, 210, 236]],
  [512, 792, 520, 70, [244, 228, 238]],
];
for (const [cx, cy, rx, ry, c] of cloudPuffs) ellipse(cx, cy, rx, ry, c);
// cool shadows tucked under the puffs
ellipse(300, 742, 200, 26, [206, 184, 220], 0.55);
ellipse(700, 744, 210, 26, [206, 184, 220], 0.55);
ellipse(512, 786, 320, 24, [196, 172, 214], 0.5);

// ---- the floating island: rock, grass rim, and the city ----
poly(
  [
    [330, 428], [694, 428], [668, 500], [620, 580], [560, 660], [512, 712],
    [464, 660], [404, 580], [356, 500],
  ],
  [110, 74, 58],
);
poly(
  [
    [356, 500], [668, 500], [620, 580], [560, 660], [512, 712],
    [464, 660], [404, 580],
  ],
  [90, 58, 46],
);
poly(
  [[330, 428], [694, 428], [678, 452], [346, 452]],
  [111, 158, 95],
);
poly(
  [[346, 452], [678, 452], [668, 470], [356, 470]],
  [146, 120, 74],
);
// strata lines on the rock face
for (const [y0, y1] of [[520, 524], [586, 590], [640, 644]] as const) {
  poly(
    [[380 + (y0 - 500) * 0.35, y0], [644 - (y0 - 500) * 0.35, y0], [644 - (y1 - 500) * 0.35, y1], [380 + (y1 - 500) * 0.35, y1]],
    [138, 95, 69],
  );
}

// waterfalls spilling off the island into the clouds
function fall(x: number, y0: number, y1: number): void {
  for (let y = y0; y <= y1; y++) {
    const w = 5 + Math.round(2 * Math.sin(y / 9));
    for (let x2 = x - w; x2 <= x + w; x2++) blend(x2, y, [214, 232, 244], 0.75);
  }
}
fall(430, 470, 690);
fall(596, 470, 700);

// ---- towers, domes and spires of Velmora ----
const cream: RGB = [242, 227, 194];
const creamDark: RGB = [214, 192, 150];
const roofRed: RGB = [184, 69, 63];
const teal: RGB = [47, 127, 122];
const gold: RGB = [255, 217, 122];
const lit: RGB = [255, 214, 110];

function tower(x: number, yBase: number, w: number, h: number, roof: RGB, dome: boolean): void {
  rect(x, yBase - h, x + w, yBase, cream);
  rect(x, yBase - h, x + 3, yBase, creamDark);
  if (dome) {
    ellipse(x + w / 2, yBase - h, w / 2 + 2, w / 2, roof);
  } else {
    poly(
      [[x - 4, yBase - h], [x + w + 4, yBase - h], [x + w / 2, yBase - h - w * 0.7]],
      roof,
    );
  }
  // lit windows
  const rows = Math.floor(h / 26);
  for (let r = 0; r < rows; r++) {
    const wy = yBase - h + 12 + r * 26;
    for (let wx = x + 8; wx + 6 <= x + w - 4; wx += 14) {
      rect(wx, wy, wx + 5, wy + 8, lit);
    }
  }
}

tower(372, 428, 46, 96, roofRed, false);
tower(428, 428, 54, 140, teal, true);
tower(492, 428, 60, 176, roofRed, false); // the great spire
tower(562, 428, 50, 128, teal, true);
tower(622, 428, 44, 92, roofRed, false);
// pennant on the great spire
poly([[522, 428 - 176 - 42], [522, 428 - 176 - 8], [556, 428 - 176 - 25]], [255, 190, 80]);
rect(520, 428 - 176 - 46, 524, 428 - 176, [60, 44, 40]);
// a low arcade along the terrace, with small lit arch windows
rect(360, 408, 664, 428, creamDark);
for (let ax = 372; ax < 660; ax += 18) {
  rect(ax, 414, ax + 7, 428, lit);
  ellipse(ax + 3, 414, 4, 4, lit);
}

// ---- two smaller floating islets with a lookout each ----
function islet(cx: number, cy: number, s: number): void {
  poly(
    [[cx - 70 * s, cy], [cx + 70 * s, cy], [cx + 40 * s, cy + 46 * s], [cx, cy + 78 * s], [cx - 40 * s, cy + 46 * s]],
    [96, 62, 48],
  );
  ellipse(cx, cy, 70 * s, 12 * s, [111, 158, 95]);
}
islet(168, 560, 0.9);
tower(148, 560, 30, 62, roofRed, true);
islet(872, 586, 0.8);
tower(856, 586, 26, 54, teal, false);

// ---- rope bridges from the city to the islets ----
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, th = 2): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(lerp(x0, x1, t));
    const y = Math.round(lerp(y0, y1, t) + Math.sin(t * Math.PI) * 14);
    for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < th; dx++) px(x + dx, y + dy, c);
  }
}
line(330, 440, 232, 566, [70, 52, 44], 2);
line(694, 440, 806, 590, [70, 52, 44], 2);

// ---- airships drifting in the morning light ----
function airship(cx: number, cy: number, s: number, body: RGB): void {
  ellipse(cx, cy, 74 * s, 26 * s, body);
  ellipse(cx, cy - 6 * s, 74 * s, 20 * s, [255, 244, 220]);
  poly([[cx - 74 * s, cy], [cx + 74 * s, cy], [cx, cy + 30 * s]], [120, 60, 52]);
  rect(cx - 22 * s, cy + 28 * s, cx + 22 * s, cy + 42 * s, [96, 66, 48]);
  rect(cx - 14 * s, cy + 32 * s, cx - 6 * s, cy + 38 * s, lit);
  rect(cx + 6 * s, cy + 32 * s, cx + 14 * s, cy + 38 * s, lit);
}
airship(216, 268, 0.85, [196, 84, 74]);
airship(846, 330, 0.7, [62, 120, 116]);

// ---- birds: short straight chevrons, no sag ----
function seg(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    px(Math.round(lerp(x0, x1, t)), Math.round(lerp(y0, y1, t)), c);
    px(Math.round(lerp(x0, x1, t)) + 1, Math.round(lerp(y0, y1, t)), c);
  }
}
function bird(x: number, y: number, s: number): void {
  seg(x - 10 * s, y + 3 * s, x, y - 5 * s, [40, 32, 56]);
  seg(x, y - 5 * s, x + 10 * s, y + 3 * s, [40, 32, 56]);
}
bird(300, 180, 1);
bird(352, 150, 0.8);
bird(640, 140, 0.9);
bird(700, 176, 0.7);
bird(430, 210, 0.7);

// ---- bottom band: the poster's type ----
rect(0, 800, 1023, 1023, [20, 27, 58]);
rect(0, 800, 1023, 804, gold);
rect(0, 812, 1023, 813, [120, 96, 60]);

// ---- 5x7 bitmap font ----
const GLYPHS: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "00000", "00100", "01000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "•": ["00000", "00000", "01100", "01100", "01100", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
};

function textWidth(text: string, scale: number, tracking: number): number {
  return text.length * (5 * scale + tracking) - tracking;
}

function drawText(text: string, x: number, y: number, scale: number, c: RGB, tracking = 2): void {
  let cx = x;
  for (const ch of text) {
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") {
          rect(cx + col * scale, y + r * scale, cx + col * scale + scale - 1, y + r * scale + scale - 1, c);
        }
      }
    }
    cx += 5 * scale + tracking;
  }
}

function drawCentered(text: string, y: number, scale: number, c: RGB, tracking = 2): void {
  const w = textWidth(text, scale, tracking);
  drawText(text, Math.round((W - w) / 2), y, scale, c, tracking);
}

const creamText: RGB = [250, 240, 214];
const goldText: RGB = [255, 217, 122];

drawCentered("SKY CITY ABOVE THE VALLEY OF CLOUDS", 826, 2, goldText, 3);
drawCentered("VELMORA", 852, 15, creamText, 14);
drawCentered("WHERE MORNING NEVER TOUCHES THE GROUND", 972, 3, creamText, 3);

// ---- PNG encode: filter 0, zlib level 9, CRC32 ----
const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  table[n] = c >>> 0;
}
function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const b of data) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0;
  buf.copy(raw, y * (1 + W * 4) + 1, y * W * 4, (y + 1) * W * 4);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", (() => {
    const d = Buffer.alloc(13);
    d.writeUInt32BE(W, 0);
    d.writeUInt32BE(H, 4);
    d[8] = 8; // bit depth
    d[9] = 6; // colour type RGBA
    return d;
  })()),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), png);
