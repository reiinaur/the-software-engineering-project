import { gameState } from "./gameState.js";
import { MOODS, ACCESSORY_IDS } from "./scale.js";

// --- SHOP LABELS CONFIGURATION ---
export const TAB_LABELS = {
  accessories: "ACCESSORIES",
  screenTheme: "THEMES"
};

// --- BACKEND FIELD MAPPINGS ---
// Updated to match your exact Flask model arrays/columns!
export const EQUIP_FIELD = {
  accessories: "equippedAccessories", 
  screenTheme: "equippedColours"      
};

// --- ITEMS CATALOGUE ---
export const CATALOGUE = {
  accessories: [
    {
      id: "none",
      label: "No Accessory",
      cost: 0,
      desc: "Remove all accessories from your pigeon.",
      assetKey: "none-placeholder"
    },
    {
      id: "silly-hat",
      label: "Silly Hat",
      cost: 30,
      desc: "A silly hat to brighten your pigeon's work day.",
      assetKey: "silly-hat-placeholder"
    },
    {
      id: "crown",
      label: "Royal Crown",
      cost: 75,
      desc: "Treat your bird like the true royalty they are.",
      assetKey: "crown-placeholder"
    },
    {
      id: "top-hat",
      label: "Top Hat",
      cost: 50,
      desc: "An elegant, classy hat for an equally elegant bird.",
      assetKey: "top-hat-placeholder"
    }
  ],
  screenTheme: [
    {
      id: "default",
      label: "Parchment",
      cost: 0,
      desc: "The standard warm, comfortable background.",
      assetKey: "default-placeholder"
    },
    {
      id: "vanilla",
      label: "Vanilla",
      cost: 40,
      desc: "A vanilla white typing space for those who like light mode.",
      assetKey: "vanilla-placeholder"
    },
    {
      id: "lavendar",
      label: "Lavendar",
      cost: 25,
      desc: "A soft pastel purple typing environment.",
      assetKey: "lavendar-placeholder"
    },
    {
      id: "cottoncandy",
      label: "Cotton Candy",
      cost: 35,
      desc: "A cute pink color.",
      assetKey: "cotton-candy-placeholder"
    },
    {
      id: "forest",
      label: "Forest Green",
      cost: 60,
      desc: "If you want to immerse in nature... I guess?",
      assetKey: "forest-placeholder"
    }
  ]
};

// ── Theme configs ─────────────────────────────────────────────────────────────
// Determines which game-bg-*.png is shown in the game scene.
// Other scenes are NOT themed — they always use their own hand-drawn background.

export const GAME_BG_KEY = {
  default: "game-bg-default",
  matcha:  "game-bg-matcha",
  dark:    "game-bg-dark",
};

export function getGameBgKey() {
  const theme = gameState.shopEquipped?.screenTheme ?? "default";
  return GAME_BG_KEY[theme] ?? "game-bg-default";
}

// ── Mascot rendering ──────────────────────────────────────────────────────────
//
// Returns an array of Phaser Sprites: [baseMascot, accessoryOverlay?]
// Both are animated at 2fps. The accessory is layered on top at the same position.
//
// The accessory tries the mood-specific sheet first (e.g. acc-silly-hat-calm),
// then falls back to a generic sheet (acc-silly-hat) if the mood variant
// hasn't been drawn yet. This lets you add mood variants incrementally.
//
// scene: the Phaser Scene calling this
// x, y:  centre position in game units
// scale: display scale (1 = natural frame size)
// mood:  "calm" | "worried" | "panic" | "fail" | "tutorial"

export function renderMascot(scene, x, y, scale = 1, mood = "calm") {
  const layers = [];

  // ── Base mascot sprite ─────────────────────────────────────────
  const mascotTexKey = `mascot-${mood}`;
  const base = scene.add.sprite(x, y, mascotTexKey)
    .setScale(scale)
    .setOrigin(0.5);

  // Only play if the animation was registered in bootScene
  if (scene.anims.exists(mascotTexKey)) {
    base.play(mascotTexKey);
  }
  layers.push(base);

  // ── Accessory overlay ──────────────────────────────────────────
  const equippedId = gameState.shopEquipped?.accessories;
  if (equippedId) {
    const item = CATALOGUE.accessories.find((i) => i.id === equippedId);
    if (item?.assetKey) {
      // Try mood-specific sheet, fall back to generic
      const moodKey    = `acc-${item.assetKey}-${mood}`;
      const genericKey = `acc-${item.assetKey}`;
      const texKey     = scene.textures.exists(moodKey) ? moodKey : genericKey;

      if (scene.textures.exists(texKey)) {
        const acc = scene.add.sprite(x, y, texKey)
          .setScale(scale)
          .setOrigin(0.5);

        if (scene.anims.exists(texKey)) {
          acc.play(texKey);
        }
        layers.push(acc);
      }
    }
  }

  return layers;
}

// Changes the mood of an existing set of mascot layers in-place.
// Call this instead of destroying and re-rendering the mascot every tick.
// layers: the array returned by renderMascot
// mood:   new mood string

export function changeMascotMood(scene, layers, mood, equippedAccId = null) {
  const [base, acc] = layers;

  // Swap base mascot
  const mascotKey = `mascot-${mood}`;
  if (base && scene.textures.exists(mascotKey)) {
    base.setTexture(mascotKey);
    if (scene.anims.exists(mascotKey)) base.play(mascotKey);
  }

  // Swap accessory to mood-matching version
  if (acc && equippedAccId) {
    const item = CATALOGUE.accessories.find((i) => i.id === equippedAccId);
    if (item?.assetKey) {
      const moodKey    = `acc-${item.assetKey}-${mood}`;
      const genericKey = `acc-${item.assetKey}`;
      const texKey     = scene.textures.exists(moodKey) ? moodKey : genericKey;
      if (scene.textures.exists(texKey)) {
        acc.setTexture(texKey);
        if (scene.anims.exists(texKey)) acc.play(texKey);
      }
    }
  }
}