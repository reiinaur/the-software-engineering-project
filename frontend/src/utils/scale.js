// shared layout constants and utility helpers used across all scenes.
// all values are in Phaser game units based on the 1920×1080 design res

export const GW = 1920; // game width
export const GH = 1080; // game height
export const CX = GW / 2; // horizontal centre
export const CY = GH / 2; // vertical centre

// converts a percentage of the game width/height into an absolute game-unit value
export const px = (pct) => GW * (pct / 100);
export const py = (pct) => GH * (pct / 100);

// named font sizes 
// used to keep typography consistent across scenes
export const FONT = {
  xs:   "22px",
  sm:   "28px",
  md:   "38px",
  lg:   "54px",
  xl:   "72px",
  xxl:  "96px",
  hero: "128px",
};

// CSS hex strings for Phaser text styles 
export const colours = {
  dark:    "#1a1a2e",
  main:    "#7565a8",
  empty:   "#f8f2f7",
  accent:  "#c96489",
  success: "#78908c",
  warning: "#ffaa00",
  muted:   "#aaaaaa",
  white:   "#ffffff",
};

// 0x-prefixed values for Phaser graphics 
export const HEX = {
  dark:    0x1a1a2e,
  main:    0x7565a8,
  empty:   0xf8f2f7,
  accent:  0xe94560,
  success: 0x44aa77,
  warning: 0xffaa00,
  muted:   0xaaaaaa,
  white:   0xffffff,
  shadow:  0xe0e0e0,
};

// frame dimensions shared by the mascot and accessory spritesheets
export const MASCOT_FRAME_W = 600;
export const MASCOT_FRAME_H = 600;
export const ACC_FRAME_W = MASCOT_FRAME_W; // accessory frames are the same size as the mascot
export const ACC_FRAME_H = MASCOT_FRAME_H;
export const MOODS = ["calm", "worried", "panic", "fail", "tutorial"]; // valid mascot animation mood keys