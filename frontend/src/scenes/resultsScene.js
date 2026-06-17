import Phaser from "phaser";
import axios from "axios";
import { CX, CY, GW, GH, colours, HEX, px, py } from "../utils/scale.js";
import { authHeader, getStats, updateStats } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";

// background colours per theme
const THEMES = {
  default: '#e6ba88',
  vanilla: '#f8f2f7',
  lavendar: '#bcafda',
  cottoncandy: '#f0b2c7',
  forest: '#577875'
};

// success / newspaper screen layout constants
const C = {
  PAPER_X: px(7),           
  PAPER_W: px(43),          
  INFO_BAR_Y: py(40),       
  HEADLINE_X: px(13),       
  HEADLINE_Y: py(50),       
  BODY_X: px(13),           
  BODY_Y: py(57),           
  SIDEBAR_X: px(77),        
  HEADER_Y: py(25),         
  STAT_START_Y: py(46),     
  STAT_SPACING: py(6),      
  BTN_Y: py(75),            
};

// failed screen layout constants
const F = {
  HEADER_Y: py(25),
  PIGEON_X: CX,
  PIGEON_Y: CY,
  STAT_Y: py(71),           
  BTN_Y: py(82),            
};

// font constants
const FONT_FAMILY = '"Courier Prime", "Courier New", monospace';
const HEADLINE_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'; 
const THEME_COLOR = "#7767a9"; 

export default class resultsScene extends Phaser.Scene {
  constructor() { super("resultsScene"); }

  async create() {
    const r = gameState.lastResult;
    
    // animations must be registered locally in case the scene is the first to run after a refresh
    this._createPigeonAnimations();

    if (r.deadlineMet) {
      this._buildCompleteScreen(r);
    } else {
      this._buildFailedScreen(r);
    }

    // save the score to the server regardless of pass/fail
    await this._saveScore(r);
  }

  _createPigeonAnimations() {
    // register all result-screen animations — pigeon, header banners, and any active accessory
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

    // register the failure overlay animation for whatever accessory the player has equipped
    const activeAcc = gameState.equipped?.accessory || "none";
    if (activeAcc !== "none") {
      const phases = ["calm", "warning", "deadline", "failure"];
      phases.forEach(phase => {
        const accKey = `anim-acc-${activeAcc}-${phase}`;
        const assetKey = `${activeAcc}-${phase}`;

        if (!this.anims.exists(accKey) && this.textures.exists(assetKey)) {
          this.anims.create({
            key: accKey,
            frames: this.anims.generateFrameNumbers(assetKey, { start: 0, end: 1 }),
            frameRate: 2,
            repeat: -1
          });
        }
      });
    }
  }

  _buildCompleteScreen(r) {
    this.sound.play("success", { volume: 0.5 });
    
    // match the background colour to the theme active during the game run
    const equippedTheme = gameState.equipped?.theme || "default";
    this.cameras.main.setBackgroundColor(THEMES[equippedTheme] || THEMES.default);
    
    this.add.image(CX, CY, "newspaper").setAngle(0.9); 

    // update the local PB record immediately so the level select card shows the new value
    if (r.isPB) {
      if (!gameState.PBs) gameState.PBs = {};
      gameState.PBs[String(r.levelNumber)] = r.wpm;
    }

    const leftEdge  = px(11.5);
    const rightEdge = px(57.5); 
    const centerPoint = rightEdge - px(18);

    // info bar — author, topic and wpm
    this.add.text(leftEdge, C.INFO_BAR_Y - 1, `By ${gameState.name || "User"}`, {
      fontFamily: FONT_FAMILY, fontSize: "24px", color: THEME_COLOR, fontStyle: "bold"
    }).setOrigin(0, 0.5);

    this.add.text(centerPoint, C.INFO_BAR_Y, `| ${r.topic || "Session"} |`, {
      fontFamily: FONT_FAMILY, fontSize: "24px", color: THEME_COLOR, fontStyle: "bold"
    }).setOrigin(0.5, 0.5);
    
    this.add.text(rightEdge, C.INFO_BAR_Y + 1, `${r.wpm} WPM`, {
      fontFamily: FONT_FAMILY, fontSize: "24px", color: THEME_COLOR, fontStyle: "bold"
    }).setOrigin(1, 0.5);

    // article headline
    this.add.text(C.HEADLINE_X, C.HEADLINE_Y, r.title || "Article Complete", {
      fontFamily: HEADLINE_FONT, 
      fontSize: "42px", 
      color: THEME_COLOR, 
      fontStyle: "bold",
      stroke: THEME_COLOR,
      strokeThickness: 1.5 
    });

    // full passage body text shown inside the newspaper graphic
    this.add.text(C.BODY_X, C.BODY_Y, gameState.passage, {
      fontFamily: FONT_FAMILY, fontSize: "30px", color: THEME_COLOR, fontStyle: "bold",
      wordWrap: { width: C.PAPER_W },
      lineSpacing: 4
    });

    // animated "article complete" header banner on the sidebar
    this.add.sprite(C.SIDEBAR_X+30, C.HEADER_Y, "article-complete").play("anim-header-success").setScale(0.35);

    let dynamicStatStartY = C.STAT_START_Y;
    let statsX = C.SIDEBAR_X - 70;
    let valuesX = C.SIDEBAR_X + 85;

    if (r.isPB) {
        this.add.text(C.SIDEBAR_X, C.HEADER_Y + 156, "★ NEW PB!", {
            fontFamily: "custom-font", fontSize: "20px", color: "#9d8ecb", fontStyle: "bold"
        }).setOrigin(0.5);
    } else {
        dynamicStatStartY -= py(3); // shift stats up when there's no PB badge to fill the space
    }
    
    // stat rows — wpm, accuracy, xp, and calculated total score
    this._statRow(statsX, valuesX, dynamicStatStartY, "WPM", String(r.wpm));
    this._statRow(statsX, valuesX, dynamicStatStartY + C.STAT_SPACING, "ACC", `${r.accuracy}%`);
    this._statRow(statsX, valuesX, dynamicStatStartY + C.STAT_SPACING * 2, "XP", `+${r.xpGain}`);
    
    const totalScore = Math.round(r.wpm * (r.accuracy / 100) * 100);
    this._statRow(statsX, valuesX, dynamicStatStartY + C.STAT_SPACING * 3, "SCORE", String(totalScore));

    this._imageBtn(C.SIDEBAR_X - 80, C.BTN_Y, "btn-try-again", () => this.scene.start("gameScene")).setScale(0.3);
    this._imageBtn(C.SIDEBAR_X + 80, C.BTN_Y, "btn-go-home", () => this.scene.start("menuScene")).setScale(0.3);
  }

  _buildFailedScreen(r) {
    this.sound.play("failed-sound", { volume: 0.5 });
    this.add.image(CX, CY, "failed-bg");
    
    this.add.sprite(CX, F.HEADER_Y, "mission-failed").play("anim-header-failed").setScale(0.4);

    // base pigeon in failure mood
    this.pigeon = this.add.sprite(F.PIGEON_X, F.PIGEON_Y + 10, "pigeon-failed").setScale(0.25);
    this.pigeon.play("anim-pigeon-failed");

    // accessory overlay in failure mode — only rendered if the texture was loaded
    const activeAcc = gameState.equipped?.accessory || "none";
    if (activeAcc !== "none" && this.textures.exists(`${activeAcc}-failure`)) {
      this.accessoryOverlay = this.add.sprite(F.PIGEON_X, F.PIGEON_Y + 10, `${activeAcc}-failure`).setScale(0.25);
      this.accessoryOverlay.play(`anim-acc-${activeAcc}-failure`);
    }

    // three-column mini stat display: wpm, accuracy and xp
    const stats = [
        { label: "WPM", val: r.wpm },
        { label: "ACC", val: `${r.accuracy}%` },
        { label: "XP", val: "+0" }
    ];

    stats.forEach((s, i) => {
        const x = CX + (i - 1) * 150; // spread evenly around centre
        this.add.text(x, F.STAT_Y, s.label, { fontFamily: FONT_FAMILY, fontSize: "16px", color: "#aaa" }).setOrigin(0.5);
        this.add.text(x, F.STAT_Y + 25, s.val, { fontFamily: FONT_FAMILY, fontSize: "22px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    });

    this._imageBtn(CX - 100, F.BTN_Y, "btn-try-again", () => this.scene.start("gameScene")).setScale(0.3);
    this._imageBtn(CX + 100, F.BTN_Y, "btn-go-home", () => this.scene.start("menuScene")).setScale(0.3);
  }

  _statRow(lx, rx, y, label, value) {
    // renders a left-aligned label and a right-aligned value on the same horizontal line
    this.add.text(lx, y, label, {
      fontFamily: FONT_FAMILY, fontSize: "20px", color: THEME_COLOR, fontStyle: "bold", stroke: THEME_COLOR, strokeThickness: 0.5
    }).setOrigin(0, 0.5);

    this.add.text(rx, y, value, {
      fontFamily: FONT_FAMILY, fontSize: "20px", color: THEME_COLOR, fontStyle: "bold", stroke: THEME_COLOR, strokeThickness: 0.8
    }).setOrigin(1, 0.5);
  }

  _imageBtn(x, y, key, callback) {
    const btn = this.add.image(x, y, key).setInteractive({ useHandCursor: true });
    btn.on("pointerover", () => btn.setAlpha(0.8));
    btn.on("pointerout", () => btn.setAlpha(1));
    btn.on("pointerdown", () => {
      this.sound.play("click", { volume: 0.2 });
      callback();
    });
    return btn;
  }

  async _saveScore(r) {
    try {
      // failed sessions still submit but xp and coins are zeroed out server-side
      const res = await axios.post("/api/stats/submit-score", {
        levelNumber: r.levelNumber,
        wpm: r.wpm,
        accuracy: r.accuracy,
        xpGain: r.deadlineMet ? r.xpGain : 0,
        coinsEarned: r.deadlineMet ? r.coinsEarned : 0,
        deadlineMet: r.deadlineMet,
      }, { headers: authHeader() });

      const bal = res.data.new_balances;
      
      // keep both coin fields in sync since different scenes read different keys
      gameState.rankLevel   = res.data.newRank;
      gameState.xpTotal     = bal.xpTotal;
      gameState.coinBalance = bal.coinBalance;
      gameState.coins       = bal.coinBalance;
      gameState.finLevels   = bal.unlockedLevels;
      gameState.PBs         = bal.PBs;

      
      // persist updated balances to localStorage so they survive page reloads
      updateStats({
        ...getStats(),
        rankLevel: res.data.newRank,
        xpTotal: bal.xpTotal,
        coinBalance: bal.coinBalance,
        finLevels: bal.unlockedLevels,
        PBs: bal.PBs
      });
    } catch (err) {
      console.error("Error saving score:", err);
    }
  }
}