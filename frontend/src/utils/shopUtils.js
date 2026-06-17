import { gameState } from "./gameState.js";
import { MOODS } from "./scale.js";

// display labels shown on each shop tab
export const TAB_LABELS = {
  accessories: "ACCESSORIES",
  screenTheme: "THEMES"
};

// maps frontend category keys to the exact Flask model column names used in equip requests
export const EQUIP_FIELD = {
  accessories: "equippedAccessories", 
  screenTheme: "equippedScreenTheme"      
};

// full item catalogue
export const CATALOGUE = {
  accessories: [
    {
      id: "none",
      label: "No Accessory",
      cost: 0,
      desc: "Remove all accessories from your pigeon.",
      assetKey: "none"
    },
    {
      id: "silly-hat",
      label: "Silly Hat",
      cost: 30,
      desc: "A silly hat to brighten your pigeon's work day.",
      assetKey: "silly-hat"
    },
    {
      id: "crown",
      label: "Royal Crown",
      cost: 75,
      desc: "Treat your bird like the true royalty they are.",
      assetKey: "crown"
    },
    {
      id: "top-hat",
      label: "Top Hat",
      cost: 50,
      desc: "An elegant, classy hat for an equally elegant bird.",
      assetKey: "top-hat"
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

// renders the mascot sprite and optional accessory overlay at the given position
export function renderMascot(scene, x, y, scale = 1, mood = "calm") {
  const layers = [];

  // base mascot sprite
  const mascotTexKey = `mascot-${mood}`;
  const base = scene.add.sprite(x, y, mascotTexKey)
    .setScale(scale)
    .setOrigin(0.5);

  if (scene.anims.exists(mascotTexKey)) {
    base.play(mascotTexKey);
  }
  layers.push(base);

  // accessory overlay — only rendered if the player has something equipped
  const equippedId = gameState.shopEquipped?.accessories;
  if (equippedId) {
    const item = CATALOGUE.accessories.find((i) => i.id === equippedAccId);
    if (item?.assetKey) {
      // prefer the mood-specific sheet 
      // fall back to the generic one if unavailable
      const moodKey    = `${item.assetKey}-${mood}`;
      const genericKey = `${item.assetKey}`;
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

// swaps the textures of an existing mascot layer array in-place without destroying and recreating sprites
// call this whenever the pressure phase changes rather than re-rendering the whole mascot
export function changeMascotMood(scene, layers, mood, equippedAccId = null) {
  const [base, acc] = layers;

  // swap the base mascot to the matching mood sheet
  const mascotKey = `mascot-${mood}`;
  if (base && scene.textures.exists(mascotKey)) {
    base.setTexture(mascotKey);
    if (scene.anims.exists(mascotKey)) base.play(mascotKey);
  }

  // swap the accessory to its mood-matching variant 
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