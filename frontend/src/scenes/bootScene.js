// bootScene is the ONLY place assets are loaded
// reduces load time as scenes can access assets immediately

import { GW, GH, CX, FONT, COLORS } from "../utils/scale.js";

export default class bootScene extends Phaser.Scene {
  constructor() { super("bootScene"); }

  preload() {
    // loading bar
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

    // bg
    this.load.spritesheet("background", "./src/assets/bgSheet.png", {
        frameWidth: 1920,
        frameHeight: 1080
      });

    // logo
    this.load.image("logo", "./src/assets/logo.png");

    // pigeon variants
    this.load.image("mascot", "assets/pigeon-calm.png");
    this.load.image("mascot-worried", "assets/mascot-worried.png");
    this.load.image("pigeonPanic", "assets/pigeon-panic.png");

    // accessory overlays
    this.load.image("acc-silly-hat",     "assets/acc-silly-hat.png");
    this.load.image("acc-detective-cap", "assets/acc-detective-cap.png");
    this.load.image("acc-googly-eyes",   "assets/acc-googly-eyes.png");

    // misc assets
    this.load.image("login-card", "assets/login-card.png");
    this.load.image("signup-card", "assets/signup-card.png");
    this.load.image("admin-clipboard", "assets/admin-clipboard.png");
    this.load.image("keyboard-guide",   "assets/keyboard-guide.png");

    // audio (uncomment when you have the files) 
    // this.load.audio("bgm-menu",  "assets/audio/bgm-menu.mp3");
  }

  create() {
    this.scene.start("menuScene");
  }
}