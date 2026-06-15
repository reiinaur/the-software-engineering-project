import Phaser from "phaser";
import axios from "axios";
import { authHeader, getStats, updateStats } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
 
export default class resultsScene extends Phaser.Scene {
  constructor() {
    super("resultsScene");
  }
 
  async create() {
    const W = this.scale.width;
    const r = gameState.lastResult;
 
    // ── Newspaper header ──────────────────────────────────────────
    this.add.text(W / 2, 45, "THE TYPING TIMES", {
      fontSize: "28px", fill: "#e94560", fontStyle: "bold"
    }).setOrigin(0.5);
 
    this.add.text(W / 2, 80, `ARTICLE PUBLISHED: ${gameState.articleTitle}`, {
      fontSize: "16px", fill: "#aaaaaa"
    }).setOrigin(0.5);
 
    this.add.line(0, 100, 0, 0, W, 0, 0x333355).setOrigin(0);
 
    // ── Stats grid ────────────────────────────────────────────────
    this._statBox(200, 210, "WPM",      `${r.wpm}`,           "#44aa77");
    this._statBox(400, 210, "ACCURACY", `${r.accuracy}%`,     "#44aa77");
    this._statBox(600, 210, "XP GAIN",  `+${r.xpGain}`,      "#ffaa00");
 
    this._statBox(300, 300, "COINS",    `+${r.coinsEarned}`,  "#ffaa00");
    this._statBox(500, 300, "DEADLINE", r.deadlineMet ? "MET ✓" : "MISSED ✗",
      r.deadlineMet ? "#44aa77" : "#e94560");
 
    if (r.isPB) {
      this.add.text(W / 2, 370, "🏆  NEW PERSONAL BEST!", {
        fontSize: "22px", fill: "#ffd700", fontStyle: "bold"
      }).setOrigin(0.5);
    }
 
    // ── Save to database ──────────────────────────────────────────
    const saveLabel = this.add.text(W / 2, 415, "Saving score...", {
      fontSize: "15px", fill: "#aaaaaa"
    }).setOrigin(0.5);
 
    try {
      const res = await axios.post("/api/stats/submit-score", {
        levelNumber: r.levelNumber,
        wpm:         r.wpm,
        accuracy:    r.accuracy,
        xpGain:      r.xpGain,
        coinsEarned: r.coinsEarned,
        deadlineMet: r.deadlineMet,
      }, { headers: authHeader() });
 
      saveLabel.setText("✓ Score saved").setStyle({ fill: "#44aa77" });
 
      // Sync updated balances back into localStorage and gameState
      const balances = res.data.new_balances;
      const stats    = getStats();
      updateStats({
        ...stats,
        xpTotal:     balances.xpTotal,
        coinBalance: balances.coinBalance,
        finLevels:   balances.unlockedLevels,
        rankLevel:   res.data.newRank ?? stats.rankLevel,
        PBs:         r.isPB
          ? { ...stats.PBs, [String(r.levelNumber)]: r.wpm }
          : stats.PBs,
      });
 
      // Keep gameState in sync for the next scene
      gameState.xpTotal     = balances.xpTotal;
      gameState.coinBalance = balances.coinBalance;
      gameState.finLevels   = balances.unlockedLevels;
      if (r.isPB) gameState.PBs[String(r.levelNumber)] = r.wpm;
      if (res.data.newRank) gameState.rankLevel = res.data.newRank;
 
    } catch (err) {
      saveLabel.setText("⚠ Error saving score").setStyle({ fill: "#e94560" });
    }
 
    // ── Navigation ────────────────────────────────────────────────
    this._btn(270, 520, "PLAY AGAIN",  () => this.scene.start("levelSelectScene"));
    this._btn(530, 520, "MAIN MENU",   () => this.scene.start("menuScene"));
  }
 
  _statBox(x, y, label, value, valueColour) {
    this.add.text(x, y - 18, label, {
      fontSize: "13px", fill: "#666688", fontStyle: "bold"
    }).setOrigin(0.5);
    this.add.text(x, y + 10, value, {
      fontSize: "26px", fill: valueColour, fontStyle: "bold"
    }).setOrigin(0.5);
  }
 
  _btn(x, y, label, cb) {
    const t = this.add.text(x, y, label, {
      fontSize: "20px", fill: "#fff",
      backgroundColor: "#e94560", padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    t.on("pointerover",  () => t.setAlpha(0.8));
    t.on("pointerout",   () => t.setAlpha(1));
    t.on("pointerdown",  cb);
  }
}