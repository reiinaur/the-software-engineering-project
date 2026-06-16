import Phaser from "phaser";
import { GW, GH, CX, CY, FONT, COLORS, HEX, px, py } from "../utils/scale.js";
import { isLoggedIn, getUser, getStats, getShopState, clearSession } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { applyTheme, renderMascot } from "../utils/shopUtils.js";

export default class menuScene extends Phaser.Scene {
  constructor() { super("menuScene"); }

  create() {
   
    if (!this.anims.exists("bg_animation")) {
      this.anims.create({
        key: "bg_animation",
        frames: this.anims.generateFrameNumbers("background", { start: 0, end: 11 }), // Change 11 to your total frames minus 1
        frameRate: 5, 
        repeat: -1     
      });
    }

    const bg = this.add.sprite(0, 0, "background").setOrigin(0, 0);
    bg.setDisplaySize(GW, GH); 
    bg.play("bg_animation");

    const logo = this.add.image(px(6), py(10), "logo").setOrigin(0, 0);
    logo.setScale(0.23);

    if (isLoggedIn()) {``
      const user  = getUser();
      const stats = getStats();
      const shop  = getShopState();
      Object.assign(gameState, {
        userId:      user.userId,
        name:        user.name,
        role:        user.role,
        rankLevel:   stats.rankLevel,
        xpTotal:     stats.xpTotal,
        coinBalance: stats.coinBalance,
        finLevels:   stats.finLevels,
        PBs:         stats.PBs,shopOwned:    shop.owned    ?? { accessories: [], decor: [], screenTheme: [] },
        shopEquipped: shop.equipped ?? { accessories: null, decor: null, screenTheme: null },
      });
      this._drawLoggedInUI(theme);
    } else {
      this._drawLoggedOutUI(theme);
    }
  }

  _drawLoggedOutUI() {
    this._item(px(9), py(50), "- start new", () => this.scene.start("loginScene", { mode: "signup" }));
    this._item(px(9), py(68), "- login",     () => this.scene.start("loginScene", { mode: "login" }));
  }

  _drawLoggedInUI() {
    // ── Top-right: RANK + XP bar + person icon ─────────────────────
    const rank = gameState.rankLevel;

    this.add.text(px(61), py(5), `RANK ${rank}`, {
      fontFamily: "Arial",
      fontSize:   FONT.sm,  // 28px
      color:      COLORS.light,
      fontStyle:  "bold",
    }).setOrigin(1, 0.5);

    // XP progress bar
    const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500];
    const rankStart  = XP_THRESHOLDS[rank - 1] || 0;
    const rankEnd    = XP_THRESHOLDS[rank]     || 1500;
    const progress   = Math.min((gameState.xpTotal - rankStart) / (rankEnd - rankStart), 1);
    const barX       = px(62), barY = py(5), barW = px(10), barH = py(10);

    const gfx = this.add.graphics();
    gfx.fillStyle(HEX.shadow);
    gfx.fillRoundedRect(barX, barY - barH / 2, barW, barH, 5);
    gfx.fillStyle(HEX.light);
    gfx.fillRoundedRect(barX, barY - barH / 2, barW * progress, barH, 5);

    // Simple person icon (Phaser-drawn — swap for an icon asset if you prefer)
    const ix = 96, iy = 5;
    gfx.fillStyle(HEX.light);
    gfx.fillCircle(ix, iy - 8, 10);        // head
    gfx.fillRoundedRect(ix - 12, iy + 4, 24, 18, 4); // body

    // ── Menu items ─────────────────────────────────────────────────
    this._item(px(11), py(66), "- continue", () => this.scene.start("levelSelectScene"));
    this._item(px(11), py(74), "- shop",     () => this.scene.start("shopScene"));
    this._item(px(11), py(82), "- settings", () => this.scene.start("settingsScene"));
    this._item(px(11), py(90), "- logout",   () => {
      clearSession();
      Object.assign(gameState, {
        userId: null, name: null, role: null,
        rankLevel: 1, xpTotal: 0, coinBalance: 0, finLevels: [], PBs: {},
      });
      this.scene.restart();
    }, COLORS.muted);

    if (gameState.role === "admin") {
      this._item(px(11), py(58), "- admin ⚙", () => this.scene.start("adminScene"), COLORS.muted);
    }
  }

  _item(x, y, label, cb, color = COLORS.light) {
    const t = this.add.text(x, y, label, {
      fontFamily: "Helvetica, sans-serif",
      fontSize:   FONT.sm,    
      color,
    }).setInteractive({ useHandCursor: true });

    t.on("pointerover",  () => t.setStyle({ color: COLORS.muted }));
    t.on("pointerout",   () => t.setStyle({ color }));
    t.on("pointerdown",  cb);
  }
}