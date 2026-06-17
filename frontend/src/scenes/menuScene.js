import Phaser from "phaser";
import { GW, GH, CX, CY, FONT, colours, HEX, px, py } from "../utils/scale.js";
import {
  isLoggedIn,
  getUser,
  getStats,
  getShopState,
  clearSession,
} from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { renderMascot } from "../utils/shopUtils.js";

export default class menuScene extends Phaser.Scene {
  constructor() {
    super("menuScene");
  }

  create() {
    if (!this.anims.exists("bg_animation")) {
      this.anims.create({
        key: "bg_animation",
        frames: this.anims.generateFrameNumbers("background", {
          start: 0,
          end: 6,
        }),
        frameRate: 5,
        repeat: -1,
      });
    }

    const bg = this.add.sprite(0, 0, "background").setOrigin(0, 0);
    bg.setDisplaySize(GW, GH);
    bg.play("bg_animation");
    bg.setDepth(-1);

    const logo = this.add.image(px(6), py(15), "logo").setOrigin(0, 0);
    logo.setScale(0.23);

    if (isLoggedIn()) {
      const user = getUser();
      const stats = getStats();
      const shop = getShopState();
      
      Object.assign(gameState, {
        userId: user.userId,
        name: user.name,
        role: user.role,
        rankLevel: stats.rankLevel,
        xpTotal: stats.xpTotal,
        coinBalance: stats.coinBalance,
        finLevels: stats.finLevels,
        PBs: stats.PBs,
        shopOwned: shop.owned ?? {
          accessories: [],
          decor: [],
          screenTheme: [],
        },
        shopEquipped: shop.equipped ?? {
          accessories: null,
          decor: null,
          screenTheme: null,
        },
      });

      // 🟢 Fix: Ensure flat lookup arrays are initialized for shop validation lists
      gameState.ownedItems = [
        ...(gameState.shopOwned.accessories || []),
        ...(gameState.shopOwned.screenTheme || [])
      ];

      this._drawLoggedInUI();
    } else {
      this._drawLoggedOutUI();
    }
  }

  _drawLoggedOutUI() {
    const btnStartNew = this.add
      .image(px(9), py(57), "btn-start-new")
      .setOrigin(0, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 }); // 🟢 Added Sound
        this.scene.start("loginScene", { mode: "signup" });
      });

    btnStartNew.on("pointerover", function () {
      this.setScale(1.05);
    });

    btnStartNew.on("pointerout", function () {
      this.setScale(1.0);
    });

    const btnLogin = this.add
      .image(px(9), py(66), "btn-login")
      .setOrigin(0, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 }); // 🟢 Added Sound
        this.scene.start("loginScene", { mode: "login" });
      });

    btnLogin.on("pointerover", function () {
      this.setScale(1.05);
    });

    btnLogin.on("pointerout", function () {
      this.setScale(1.0);
    });
  }

  _drawLoggedInUI() {
    const rank = gameState.rankLevel;

    // 1. Rank Text
    const rankText = this.add
      .text(px(78), py(11), `RANK ${rank}`, {
        fontFamily: "custom-font",
        fontSize: FONT.sm,
        color: colours.main,
        fontStyle: "bold",
      })
      .setDepth(10)      
      .setOrigin(1, 0.5);
    
    rankText.setStroke(colours.empty, 4);

    // 2. XP Progress Bar Calculations
    const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500];
    const rankStart = XP_THRESHOLDS[rank - 1] || 0;
    const rankEnd = XP_THRESHOLDS[rank] || 1500;
    const progress = Math.min((gameState.xpTotal - rankStart) / (rankEnd - rankStart), 1);
    
    const barX = px(79);
    const barY = py(11);
    const barW = px(10);
    const barH = py(2);

    const gfx = this.add.graphics();
    gfx.setDepth(10); 

    gfx.fillStyle(HEX.empty);
    gfx.fillRoundedRect(barX, barY - barH / 2, barW, barH, 5);
    gfx.fillStyle(HEX.main);
    gfx.fillRoundedRect(barX, barY - barH / 2, barW * progress, barH, 5);

    // 4. CONDITIONAL ADMIN ICON
    if (gameState.role === "admin") {
      this.add
        .image(barX + barW + px(1), barY, "icon-admin") 
        .setScale(0.03)
        .setOrigin(0, 0.5) 
        .setDepth(10)      
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          this.sound.play("click", { volume: 0.2 }); // 🟢 Added Sound
          this.scene.start("adminScene");
        });
    }

    // main menu buttons
    // continue button -> level select  
    const btnContinue = this.add
      .image(px(11), py(57), "btn-continue")
      .setOrigin(0, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 }); // 🟢 Added Sound
        this.scene.start("levelSelectScene");
      });

    btnContinue.on("pointerover", function () {
      this.setScale(1.05);
    });

    btnContinue.on("pointerout", function () {
      this.setScale(1.0);
    });

    // shop button -> shop  
    const btnShop = this.add
      .image(px(11), py(66), "btn-shop")
      .setOrigin(0, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 }); // 🟢 Added Sound
        this.scene.start("shopScene");
      });

    btnShop.on("pointerover", function () {
      this.setScale(1.05);
    });

    btnShop.on("pointerout", function () {
      this.setScale(1.0);
    });

    // logout button -> clears session and returns to logged out version of menu
    const btnLogout = this.add
      .image(px(11), py(74), "btn-logout")
      .setOrigin(0, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("click", { volume: 0.2 }); // 🟢 Added Sound
        clearSession();
        Object.assign(gameState, {
          userId: null,
          name: null,
          role: null,
          rankLevel: 1,
          xpTotal: 0,
          coinBalance: 0,
          finLevels: [],
          PBs: {},
          ownedItems: []
        });
        this.scene.restart();
      }); // 🟢 Fix: Removed trailing context argument error from parameter tail block

    btnLogout.on("pointerover", function () {
      this.setScale(1.05);
    });

    btnLogout.on("pointerout", function () {
      this.setScale(1.0);
    });
  }

  _item(x, y, label, cb, color = colours.light) {
    const t = this.add
      .text(x, y, label, {
        fontFamily: "Helvetica, sans-serif",
        fontSize: FONT.sm,
        color,
      })
      .setInteractive({ useHandCursor: true });

    t.on("pointerover", () => t.setStyle({ color: colours.muted }));
    t.on("pointerout", () => t.setStyle({ color }));
    t.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 }); // 🟢 Added Sound
      cb();
    });
  }
}