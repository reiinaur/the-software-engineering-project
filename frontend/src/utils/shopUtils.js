import { gameState } from "./gameState.js";
import { MOODS, ACCESSORY_IDS } from "./scale.js";

export const CATALOGUE = {
  accessories: [
    { id: "sillyHat",     assetKey: "silly-hat",     label: "Silly Hat",     cost: 80,  desc: "For the sillier times.."   },
    { id: "detectiveCap", assetKey: "detective-cap", label: "Detective Cap", cost: 120, desc: "Increases WPM by feel."      },
    { id: "googlyEyes",   assetKey: "googly-eyes",   label: "Googly Eyes",   cost: 60,  desc: "Hard to type. Worth it."    },
  ],
  screenTheme: [
    { id: "default",     assetKey: "item-theme-default", label: "Default",     cost: 0,   desc: "Classic look."             },
    { id: "matcha",      assetKey: "item-theme-matcha",  label: "Matcha",      cost: 100, desc: "Calm green tones."         },
    { id: "dark",        assetKey: "item-theme-dark",    label: "Dusty Dark",  cost: 100, desc: "Night shift edition."      },
  ],
};

export const TAB_LABELS = {
  accessories: "ACCESSORIES",
  screenTheme: "THEMES",
};

// Maps catalogue category → backend equip field name
export const EQUIP_FIELD = {
  accessories: "equippedAccessories",
  screenTheme: "equippedScreenTheme",
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