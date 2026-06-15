export const GW = 1920;   // game width
export const GH = 1080;   // game height
export const CX = GW / 2; // horizontal centre 
export const CY = GH / 2; // vertical centre   

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

export const COLORS = {
  dark:    "#1a1a2e",
  accent:  "#e94560",
  success: "#44aa77",
  warning: "#ffaa00",
  muted:   "#aaaaaa",
  light:   "#f5f4f0",
  white:   "#ffffff",
  shadow:  "#e0e0e0",
};

export const HEX = {
  dark:    0x1a1a2e,
  accent:  0xe94560,
  success: 0x44aa77,
  warning: 0xffaa00,
  muted:   0xaaaaaa,
  light:   0xf5f4f0,
  white:   0xffffff,
  shadow:  0xe0e0e0,
  black:   0x000000,
};