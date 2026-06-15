import { gameState } from "./gameState.js";

export const CATALOGUE = {
  accessories: [
    {
      id:       "sillyHat",
      label:    "Silly Hat",
      cost:     80,
      desc:     "For the aspiring jester.",
      assetKey: "acc-silly-hat",   
    },
    {
      id:       "detectiveCap",
      label:    "Detective Cap",
      cost:     120,
      desc:     "Increases WPM by feel.",
      assetKey: "acc-detective-cap",
    },
    {
      id:       "googlyEyes",
      label:    "Googly Eyes",
      cost:     60,
      desc:     "Hard to type. Worth it.",
      assetKey: "acc-googly-eyes",
    },
  ],
  screenTheme: [
    {
      id:    "matchaGreen",
      label: "Matcha",
      cost:  100,
      desc:  "Calm green tones.",
      assetKey: null,   // themes are pure colour configs, no image asset needed
    },
    {
      id:    "dustyDark",
      label: "Dusty Dark",
      cost:  100,
      desc:  "Night shift edition.",
      assetKey: null,
    },
    {
      id:    "creamPaper",
      label: "Cream Paper",
      cost:  80,
      desc:  "Classic newsprint.",
      assetKey: null,
    },
  ],
};

// Tab display labels (what the user sees in the shop)
export const TAB_LABELS = {
  accessories: "ACCESSORIES",
  screenTheme: "THEMES",
};

// Maps catalogue category key → backend equip column name.
// Used when calling POST /api/shop/equip.
export const EQUIP_FIELD = {
  accessories: "equippedAccessories",
  screenTheme: "equippedScreenTheme",
};

// ── Theme configs ─────────────────────────────────────────────────────────────
// Each theme defines colours for all major UI elements.
// Applied in scenes via applyTheme(scene).

export const THEME_CONFIGS = {
  default: {
    sceneBg:  "#ffffff",
    dark:     "#1a1a2e",
    accent:   "#e94560",
    light:    "#f5f4f0",
    hexBg:    0xffffff,
    hexDark:  0x1a1a2e,
    hexAccent:0xe94560,
  },
  matchaGreen: {
    sceneBg:  "#f0f5f0",
    dark:     "#2d4a2d",
    accent:   "#44aa77",
    light:    "#e8f0e8",
    hexBg:    0xf0f5f0,
    hexDark:  0x2d4a2d,
    hexAccent:0x44aa77,
  },
  dustyDark: {
    sceneBg:  "#1a1a2e",
    dark:     "#e8e8f0",
    accent:   "#e94560",
    light:    "#2a2a4a",
    hexBg:    0x1a1a2e,
    hexDark:  0xe8e8f0,
    hexAccent:0xe94560,
  },
  creamPaper: {
    sceneBg:  "#faf6f0",
    dark:     "#3d2b1f",
    accent:   "#8b5e3c",
    light:    "#f0ebe0",
    hexBg:    0xfaf6f0,
    hexDark:  0x3d2b1f,
    hexAccent:0x8b5e3c,
  },
};

// Returns the active theme config based on what the player has equipped.
export function getTheme() {
  const equippedTheme = gameState.shopEquipped?.screenTheme;
  return THEME_CONFIGS[equippedTheme] ?? THEME_CONFIGS.default;
}

// Applies the active theme's background colour to a Phaser scene.
// Call at the top of every scene's create() for consistent theming.
export function applyTheme(scene) {
  const theme = getTheme();
  scene.cameras.main.setBackgroundColor(theme.sceneBg);
  return theme;
}

// ── Mascot rendering ─────────────────────────────────────────────────────────
//
// Renders the mascot at (x, y) with the currently equipped accessory overlaid.
// Returns an array of Phaser GameObjects so the caller can group/destroy them.
//
// expression: "calm" | "worried" | "panic"
// scale: number (1.0 = natural size)

export function renderMascot(scene, x, y, scale = 1, expression = "calm") {
  const mascotKey = {
    calm:    "mascot",
    worried: "mascot-worried",
    panic:   "mascot-panic",
  }[expression] ?? "mascot";

  const layers = [];

  // 1. Base mascot
  const base = scene.add.image(x, y, mascotKey).setScale(scale).setOrigin(0.5);
  layers.push(base);

  // 2. Accessory overlay (same position and scale as base)
  const equippedAcc = gameState.shopEquipped?.accessories;
  if (equippedAcc) {
    const item = CATALOGUE.accessories.find((i) => i.id === equippedAcc);
    if (item?.assetKey && scene.textures.exists(item.assetKey)) {
      const acc = scene.add.image(x, y, item.assetKey).setScale(scale).setOrigin(0.5);
      layers.push(acc);
    }
  }

  return layers;   // caller can push to a destroy list or add to a container
}

// Renders equipped desk items at fixed positions in the game scene's right panel.
// deskX, deskY: top-left corner of the desk area.
export function renderDeskItems(scene, deskX, deskY) {
  const layers = [];
  const equipped = gameState.shopEquipped?.decor;
  if (!equipped) return layers;

  const item = CATALOGUE.decor.find((i) => i.id === equipped);
  if (item?.assetKey && scene.textures.exists(item.assetKey)) {
    const img = scene.add.image(deskX, deskY, item.assetKey)
      .setScale(0.18)
      .setOrigin(0.5);
    layers.push(img);
  }
  return layers;
}