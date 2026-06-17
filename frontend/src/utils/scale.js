export const GW = 1920;
export const GH = 1080;
export const CX = GW / 2;   
export const CY = GH / 2;  

export const px = (pct) => GW * (pct / 100);
export const py = (pct) => GH * (pct / 100);

export const FONT = {
  xs:   "22px",
  sm:   "28px",
  md:   "38px",
  lg:   "54px",
  xl:   "72px",
  xxl:  "96px",
  hero: "128px",
};

export const colours = {
  dark:    "#1a1a2e",
  main:    "#7565a8",
  empty:   "#f8f2f7",
  accent:  "#e94560",
  success: "#44aa77",
  warning: "#ffaa00",
  muted:   "#aaaaaa",
  white:   "#ffffff",
};

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

export const MASCOT_FRAME_W = 600;
export const MASCOT_FRAME_H = 600;
export const ACC_FRAME_W = MASCOT_FRAME_W;
export const ACC_FRAME_H = MASCOT_FRAME_H;
export const MOODS = ["calm", "worried", "panic", "fail", "tutorial"];
export const ACCESSORY_IDS = ["silly-hat", "detective-cap", "googly-eyes"];