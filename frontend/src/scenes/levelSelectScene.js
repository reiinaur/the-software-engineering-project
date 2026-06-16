import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, COLORS, HEX, px, py } from "../utils/scale.js";
import { authHeader } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { renderMascot } from "../utils/shopUtils.js";

// ⚠️ Adjust these after measuring your background:
const TUTORIAL_BTN_X  = px(15);    // centre of drawn tutorial button
const TUTORIAL_BTN_Y  = py(82);
const TUTORIAL_BTN_W  = px(22);
const TUTORIAL_BTN_H  = py(8);

// centre X of each card (adjust spacing to match your drawn card slots):
const LEVEL_CARD_Y = py(50);
const LEVEL_CARD_W = px(13);
const LEVEL_CARD_H = py(38);
const LEVEL_CARDS_START_X = px(15);  // centre x of the first card
const LEVEL_CARD_GAP      = px(17);  // gap between card centres

// status text position (below cards)
const STATUS_X = CX;
const STATUS_Y = py(80);

export default class levelSelectScene extends Phaser.Scene {
  constructor() { super("levelSelectScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#ffffff");
    this.add.image(CX, CY, "ui-level-select-bg");

    // ── Tutorial button ─────────────────────────────────────────────
    // Uses the hand-drawn button image positioned over your layout.
    // The image is placed at the measured coordinates, then a hit zone sits on it.
    const tutBtn = this.add.image(TUTORIAL_BTN_X, TUTORIAL_BTN_Y, "btn-start-tutorial")
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    tutBtn.on("pointerover",  () => tutBtn.setAlpha(0.8));
    tutBtn.on("pointerout",   () => tutBtn.setAlpha(1));
    tutBtn.on("pointerdown",  () => this.scene.start("tutorialScene"));

    // ── Level cards ────────────────────────────────────────────────
    this._statusText = this.add.text(STATUS_X, STATUS_Y, "", {
      fontFamily: "'Roboto Mono', monospace", fontSize: FONT.sm, color: COLORS.accent
    }).setOrigin(0.5);

    for (let i = 1; i <= 5; i++) {
      this._drawCard(i, LEVEL_CARDS_START_X + (i - 1) * LEVEL_CARD_GAP, LEVEL_CARD_Y);
    }

    // Back arrow / button — either a hit area over your drawn back button,
    // or a programmatic button if your background doesn't include one
    this.add.text(px(3), py(5), "←", {
      fontFamily: "Arial", fontSize: FONT.lg, color: COLORS.dark
    }).setInteractive({ useHandCursor: true }).on("pointerdown", () => this.scene.start("menuScene"));
  }

  _drawCard(levelNum, x, y) {
    const unlocked = gameState.rankLevel >= levelNum;
    const pb       = gameState.PBs?.[String(levelNum)];

    const gfx = this.add.graphics();

    if (unlocked) {
      // Unlocked card: transparent fill with accent border
      gfx.lineStyle(3, HEX.accent);
      gfx.strokeRoundedRect(x - LEVEL_CARD_W / 2, y - LEVEL_CARD_H / 2,
                            LEVEL_CARD_W, LEVEL_CARD_H, 12);

      // "LEVEL N" label (only if your background doesn't already show it)
      this.add.text(x, y - LEVEL_CARD_H / 2 + py(3), `LEVEL ${levelNum}`, {
        fontFamily: "'Roboto Mono', monospace", fontSize: FONT.sm,
        color: COLORS.dark, fontStyle: "bold"
      }).setOrigin(0.5, 0);

      if (pb) {
        this.add.text(x, y + py(6), `PB: ${pb} WPM`, {
          fontFamily: "'Roboto Mono', monospace", fontSize: FONT.xs, color: COLORS.muted
        }).setOrigin(0.5);
      }

      // Make the whole card area clickable
      const hit = this.add.zone(x, y, LEVEL_CARD_W, LEVEL_CARD_H)
        .setInteractive({ useHandCursor: true });

      hit.on("pointerover",  () => { gfx.clear(); gfx.lineStyle(4, HEX.accent); gfx.strokeRoundedRect(x - LEVEL_CARD_W/2, y - LEVEL_CARD_H/2, LEVEL_CARD_W, LEVEL_CARD_H, 12); });
      hit.on("pointerout",   () => { gfx.clear(); gfx.lineStyle(3, HEX.accent); gfx.strokeRoundedRect(x - LEVEL_CARD_W/2, y - LEVEL_CARD_H/2, LEVEL_CARD_W, LEVEL_CARD_H, 12); });
      hit.on("pointerdown",  () => this._loadLevel(levelNum));

    } else {
      // Locked card: dimmed border, lock emoji
      gfx.lineStyle(2, HEX.muted);
      gfx.strokeRoundedRect(x - LEVEL_CARD_W / 2, y - LEVEL_CARD_H / 2,
                            LEVEL_CARD_W, LEVEL_CARD_H, 12);

      this.add.text(x, y - LEVEL_CARD_H / 2 + py(3), `LEVEL ${levelNum}`, {
        fontFamily: "'Roboto Mono', monospace", fontSize: FONT.sm, color: COLORS.muted
      }).setOrigin(0.5, 0);

      this.add.text(x, y, "🔒", { fontSize: "48px" }).setOrigin(0.5);

      this.add.text(x, y + py(8), `Rank ${levelNum} required`, {
        fontFamily: "Arial", fontSize: FONT.xs, color: COLORS.muted
      }).setOrigin(0.5);
    }
  }

  async _loadLevel(levelNum) {
    this._statusText.setText("Loading assignment...");
    try {
      const res = await axios.get(`/api/levels/${levelNum}`, { headers: authHeader() });
      Object.assign(gameState, {
        selectedLevel: levelNum,
        passage:       res.data.passage,
        articleTitle:  res.data.title,
        timerDuration: res.data.timerDuration,
      });
      this.scene.start("gameScene");
    } catch (err) {
      this._statusText.setText(err.response?.data?.message || "Failed to load level.");
    }
  }
}