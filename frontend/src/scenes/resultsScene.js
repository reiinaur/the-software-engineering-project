import Phaser from "phaser";
import axios from "axios";
import { CX, CY, GW, GH, colours, HEX, px, py } from "../utils/scale.js";
import { authHeader, getStats, updateStats } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";

// Success/Newspaper Screen Layout
const C = {
  // Newspaper Text Area (Left)
  PAPER_X: px(7),           // Start of text
  PAPER_W: px(43),          // Slightly narrowed width wrapping to adjust for rightward shifts
  
  MASTHEAD_Y: py(12),       // "The Typing Times"
  INFO_BAR_X: px(12),       // Shifted to line up with the card border
  INFO_BAR_Y: py(39),       // By [user] | Title | Date
  HEADLINE_X: px(12),       // Shifted to the right a bit
  HEADLINE_Y: py(50),       // Bold Title
  BODY_X: px(12),           // Shifted to the right a bit
  BODY_Y: py(58),           // Start of passage text

  TEXT_ANGLE: -0.8,

  // Stats Sidebar (Right)
  SIDEBAR_X: px(81),        // Center of the sidebar
  HEADER_Y: py(25),         // "Article Complete!"
  
  STAT_START_Y: py(48),     // Base stat Y when PB is present
  STAT_SPACING: py(6),      // Gap between rows
  
  BTN_Y: py(75),            // Button row
};

// Failed Screen Layout
const F = {
  HEADER_Y: py(25),
  PIGEON_X: CX,
  PIGEON_Y: CY,
  STAT_Y: py(71),           // Shifted up for button breathing room
  BTN_Y: py(86),            // Explicit button Y row placement
};

// Font Constants
const FONT_FAMILY = '"Courier Prime", "Courier New", monospace';
const HEADLINE_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'; // Clean, ultra-bold headline choice
const THEME_COLOR = "#7767a9"; // Unified newspaper header color

export default class resultsScene extends Phaser.Scene {
  constructor() { super("resultsScene"); }

  async create() {
    const r = gameState.lastResult;
    
    // Register animations locally in this scene to ensure they play correctly
    this._createPigeonAnimations();

    if (r.deadlineMet) {
      this._buildCompleteScreen(r);
    } else {
      this._buildFailedScreen(r);
    }

    await this._saveScore(r);
  }

  _createPigeonAnimations() {
    const sets = [
        { key: "anim-pigeon-failed", asset: "pigeon-failed" },
        { key: "anim-header-failed", asset: "mission-failed" },
        { key: "anim-header-success", asset: "article-complete" }
    ];

    sets.forEach(set => {
      if (!this.anims.exists(set.key)) {
        this.anims.create({
          key: set.key,
          frames: this.anims.generateFrameNumbers(set.asset, { start: 0, end: 1 }),
          frameRate: 2,
          repeat: -1
        });
      }
    });
  }

  // --- SUCCESS / NEWSPAPER SCREEN ---
  _buildCompleteScreen(r) {
    this.cameras.main.setBackgroundColor('#e6ba88');
    this.add.image(CX, CY, "newspaper"); 

    // updates local game state PBs so level select displays it immediately
    if (r.isPB) {
      if (!gameState.PBs) gameState.PBs = {};
      gameState.PBs[String(r.levelNumber)] = r.wpm;
    }

    // Info Bar (By [User] | [Title] | [Time]) with tabbed formatting to space across the entire section
    const infoText = `By ${gameState.name || "User"}\t\t\t|\t\t\t${gameState.articleTitle || "Session"}\t\t\t|\t\t\t${r.wpm} WPM`;
    this.add.text(C.INFO_BAR_X, C.INFO_BAR_Y, infoText, {
      fontFamily: FONT_FAMILY, fontSize: "30px", color: THEME_COLOR, fontStyle: "bold"
    })
    .setAngle(C.TEXT_ANGLE);

    // ── FIXED HEADLINE: Switched to thick Helvetica with fake bold stroke fail-safe ──
    this.add.text(C.HEADLINE_X, C.HEADLINE_Y, gameState.articleTitle || "Article Complete", {
      fontFamily: HEADLINE_FONT, 
      fontSize: "42px", 
      color: THEME_COLOR, 
      fontStyle: "bold",
      stroke: THEME_COLOR,
      strokeThickness: 1.5 // Outlines itself to guarantee a heavy, thick appearance
    })
    .setAngle(C.TEXT_ANGLE);

    this.add.text(C.BODY_X, C.BODY_Y, gameState.passage, {
      fontFamily: FONT_FAMILY, fontSize: "30px", color: THEME_COLOR, fontStyle: "bold",
      wordWrap: { width: C.PAPER_W },
      lineSpacing: 4
    })
    .setAngle(C.TEXT_ANGLE);

    // 2. Stats Side (Right)
    this.add.sprite(C.SIDEBAR_X, C.HEADER_Y, "article-complete").play("anim-header-success").setScale(0.4);

    // Conditional layout adjusting logic: If no new PB occurs, shift the vertical list coordinates up
    let dynamicStatStartY = C.STAT_START_Y;
    
    // ── SHIFT LOGIC ADJUSTMENTS ──
    let statsX = C.SIDEBAR_X - 70;
    let valuesX = C.SIDEBAR_X + 85;

    if (r.isPB) {
        this.add.text(C.SIDEBAR_X, C.HEADER_Y + 156, "★ NEW PB!", {
            fontFamily: "custom-font", fontSize: "20px", color: "#9d8ecb", fontStyle: "bold"
        }).setOrigin(0.5);
    } else {
        // Shifting stats row slightly higher since the PB banner is omitted
        dynamicStatStartY -= py(6);
        
        // Apply your custom alignment corrections (+3px right, +2px down) when there is NO PB
        statsX += 3;
        valuesX += 3;
        dynamicStatStartY += 2;
    }
    
    this._statRow(statsX, valuesX, dynamicStatStartY, "WPM", String(r.wpm));
    this._statRow(statsX, valuesX, dynamicStatStartY + C.STAT_SPACING, "ACC", `${r.accuracy}%`);
    this._statRow(statsX, valuesX, dynamicStatStartY + C.STAT_SPACING * 2, "XP", `+${r.xpGain}`);
    
    const totalScore = Math.round(r.wpm * (r.accuracy / 100) * 100);
    this._statRow(statsX, valuesX, dynamicStatStartY + C.STAT_SPACING * 3, "SCORE", String(totalScore));

    // Hand-drawn buttons (Scaled down to 0.3)
    this._imageBtn(C.SIDEBAR_X - 70, C.BTN_Y, "btn-try-again", () => this.scene.start("gameScene")).setScale(0.3);
    this._imageBtn(C.SIDEBAR_X + 70, C.BTN_Y, "btn-go-home", () => this.scene.start("menuScene")).setScale(0.3);
  }

  // failed screen
  _buildFailedScreen(r) {
    this.add.image(CX, CY, "failed-bg");
    
    // Header setup as an animated sprite at 2 FPS
    this.add.sprite(CX, F.HEADER_Y, "mission-failed").play("anim-header-failed").setScale(0.4);

    // Sad Pigeon Animation
    this.pigeon = this.add.sprite(F.PIGEON_X, F.PIGEON_Y + 10, "pigeon-failed").setScale(0.25);
    this.pigeon.play("anim-pigeon-failed");

    // Horizontal Stat Row (Shifted up to F.STAT_Y for clean layout layout clearance)
    const stats = [
        { label: "WPM", val: r.wpm },
        { label: "ACC", val: `${r.accuracy}%` },
        { label: "XP", val: "+0" }
    ];

    stats.forEach((s, i) => {
        const x = CX + (i - 1) * 150;
        this.add.text(x, F.STAT_Y, s.label, { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#aaa" }).setOrigin(0.5);
        this.add.text(x, F.STAT_Y + 25, s.val, { fontFamily: FONT_FAMILY, fontSize: "22px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    });

    // Shrunk down to 0.3 layout scale profiles
    this._imageBtn(CX - 100, F.BTN_Y, "btn-try-again", () => this.scene.start("gameScene")).setScale(0.3);
    this._imageBtn(CX + 100, F.BTN_Y, "btn-go-home", () => this.scene.start("menuScene")).setScale(0.3);
  }

  // --- HELPERS ---

  // ── FIXED STAT ROW: Added fontStyle and stroke to labels and values to look thicker ──
  _statRow(lx, rx, y, label, value) {
    this.add.text(lx, y, label, {
      fontFamily: FONT_FAMILY, 
      fontSize: "20px", 
      color: THEME_COLOR,
      fontStyle: "bold",
      stroke: THEME_COLOR,
      strokeThickness: 0.5 // Subtle stroke multiplier to make label heavier
    }).setOrigin(0, 0.5);

    this.add.text(rx, y, value, {
      fontFamily: FONT_FAMILY, 
      fontSize: "20px", 
      color: THEME_COLOR, 
      fontStyle: "bold",
      stroke: THEME_COLOR,
      strokeThickness: 0.8 // Slightly thicker stroke to make user numbers pop!
    }).setOrigin(1, 0.5);
  }

  _imageBtn(x, y, key, callback) {
    const btn = this.add.image(x, y, key).setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => btn.setAlpha(0.8));
    btn.on("pointerout", () => btn.setAlpha(1));
    btn.on("pointerdown", callback);
    return btn;
  }

  async _saveScore(r) {
    try {
      const res = await axios.post("/api/stats/submit-score", {
        levelNumber: r.levelNumber,
        wpm: r.wpm,
        accuracy: r.accuracy,
        xpGain: r.deadlineMet ? r.xpGain : 0,
        coinsEarned: r.deadlineMet ? r.coinsEarned : 0,
        deadlineMet: r.deadlineMet,
      }, { headers: authHeader() });

      const bal = res.data.new_balances;
      updateStats({
        ...getStats(),
        xpTotal: bal.xpTotal,
        coinBalance: bal.coinBalance,
        finLevels: bal.unlockedLevels,
        PBs: bal.PBs
      });
    } catch (e) {
      console.error("Save failed", e);
    }
  }
}