// bootScene is the ONLY place assets are loaded.
// Phaser's preload() waits for all loads before create() runs, so every
// subsequent scene has instant access to every asset — no per-scene loading.

import { GW, GH, CX, FONT, COLORS } from "../utils/scale.js";

export default class bootScene extends Phaser.Scene {
  constructor() { super("bootScene"); }

  preload() {
    // ── Loading bar ────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor("#ffffff");

    this.add.text(CX, GH * 0.38, "The Typing Times", {
      fontFamily: "Georgia, serif",
      fontSize:   FONT.xl,
      color:      COLORS.dark,
    }).setOrigin(0.5);

    const trackW = GW * 0.3;
    const trackX = CX - trackW / 2;
    const trackY = GH * 0.55;

    this.add.rectangle(CX, trackY, trackW, 10, 0xdddddd);
    const bar = this.add.rectangle(trackX, trackY, 0, 10, 0x1a1a2e).setOrigin(0, 0.5);

    const pctText = this.add.text(CX, trackY + 34, "0%", {
      fontFamily: "Arial", fontSize: FONT.xs, color: COLORS.muted
    }).setOrigin(0.5);

    this.load.on("progress", (v) => {
      bar.width = trackW * v;
      pctText.setText(`${Math.round(v * 100)}%`);
    });

    // ── Mascot variants ────────────────────────────────────────────
    this.load.image("mascot",         "assets/mascot.png");
    this.load.image("mascot-worried", "assets/mascot-worried.png");
    this.load.image("mascot-panic",   "assets/mascot-panic.png");

    // ── Accessory overlays ─────────────────────────────────────────
    // Each PNG is the same canvas size as the mascot, with the item
    // positioned correctly and everything else transparent.
    this.load.image("acc-silly-hat",     "assets/acc-silly-hat.png");
    this.load.image("acc-detective-cap", "assets/acc-detective-cap.png");
    this.load.image("acc-googly-eyes",   "assets/acc-googly-eyes.png");

    // ── Desk items ─────────────────────────────────────────────────
    this.load.image("desk-coffee-cup", "assets/desk-coffee-cup.png");
    this.load.image("desk-plant",      "assets/desk-plant.png");
    this.load.image("desk-newspaper",  "assets/desk-newspaper.png");

    // ── Full-scene hand-drawn assets ───────────────────────────────
    this.load.image("login-card",       "assets/login-card.png");
    this.load.image("signup-card",      "assets/signup-card.png");
    this.load.image("admin-clipboard",  "assets/admin-clipboard.png");
    this.load.image("settings-cabinet", "assets/settings-cabinet.png");
    this.load.image("keyboard-guide",   "assets/keyboard-guide.png");

    // ── Audio (uncomment when you have the files) ─────────────────
    // this.load.audio("bgm-menu",  "assets/audio/bgm-menu.mp3");
    // this.load.audio("sfx-type",  "assets/audio/sfx-type.wav");
    // this.load.audio("sfx-error", "assets/audio/sfx-error.wav");
    // this.load.audio("sfx-coin",  "assets/audio/sfx-coin.wav");
  }

  create() {
    this.scene.start("menuScene");
  }
}