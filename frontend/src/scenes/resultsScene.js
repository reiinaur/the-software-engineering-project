import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, COLORS, HEX, px, py } from "../utils/scale.js";
import { authHeader, getStats, updateStats, getShopState } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
import { renderMascot } from "../utils/shopUtils.js";

// complete screen layout
const C = {
  HEADER_X:      CX,          // "Article Complete!" header image centre
  HEADER_Y:      py(62),

  BYLINE_X:      px(5),       // "By [name]" text
  BYLINE_Y:      py(19),
  TOPIC_X:       CX,          // article title text (centred)
  TOPIC_Y:       py(19),
  DATE_X:        px(95),      // date text (right-aligned)
  DATE_Y:        py(19),

  COL1_X:        px(5),       // article text left column
  COL1_Y:        py(23),
  COL1_W:        px(42),      // width of left column
  COL2_X:        px(52),      // article text right column
  COL2_Y:        py(23),
  COL2_W:        px(42),
  COL_H:         py(33),      // max height before cutting off

  STAT_ROW_Y:    py(74),      // y of the four stat boxes
  STAT_WPM_X:    px(22),
  STAT_ACC_X:    px(38),
  STAT_XP_X:     px(54),
  STAT_SCORE_X:  px(70),

  BTN_NEXT_X:    px(36),      // "Go Next" button centre
  BTN_NEXT_Y:    py(89),
  BTN_RETRY_X:   px(64),      // "Try Again" button centre
  BTN_RETRY_Y:   py(89),
};

// failed screen layout
const F = {
  HEADER_X:      CX,
  HEADER_Y:      py(20),
  MASCOT_X:      CX,
  MASCOT_Y:      py(50),
  MASCOT_SCALE:  0.30,

  STAT_ROW_Y:    py(74),
  STAT_WPM_X:    px(22),
  STAT_ACC_X:    px(38),
  STAT_XP_X:     px(54),
  STAT_SCORE_X:  px(70),

  BTN_RETRY_X:   px(36),
  BTN_RETRY_Y:   py(89),
  BTN_HOME_X:    px(64),
  BTN_HOME_Y:    py(89),
};

export default class resultsScene extends Phaser.Scene {
  constructor() { super("resultsScene"); }

  async create() {
    const r = gameState.lastResult;

    if (r.deadlineMet) {
      this._buildCompleteScreen(r);
    } else {
      this._buildFailedScreen(r);
    }

    // Save score (both paths)
    await this._saveScore(r);
  }

  // success screen
  _buildCompleteScreen(r) {
    this.cameras.main.setBackgroundColor("#fafaf8");
    this.add.image(CX, CY, "ui-results-complete-bg");

    // ── Byline row (dynamic text over drawn dividers) ──────────────
    const today = new Date().toLocaleDateString("en-AU", {
      day: "numeric", month: "long", year: "numeric"
    });
    this.add.text(C.BYLINE_X, C.BYLINE_Y, `By ${gameState.name || "Anonymous"}`, {
      fontFamily: "Georgia, serif", fontSize: "22px", color: COLORS.dark
    });
    this.add.text(C.TOPIC_X, C.TOPIC_Y, gameState.articleTitle || "Article", {
      fontFamily: "Georgia, serif", fontSize: "22px", color: COLORS.dark, fontStyle: "italic"
    }).setOrigin(0.5, 0);
    this.add.text(C.DATE_X, C.DATE_Y, today, {
      fontFamily: "Georgia, serif", fontSize: "20px", color: COLORS.muted
    }).setOrigin(1, 0);

    // ── Passage as newspaper article body ─────────────────────────
    // Shows the article the player just typed — displayed as the published piece.
    const passage = gameState.passage || "";

    this.add.text(C.COL1_X, C.COL1_Y, passage, {
      fontFamily: "Georgia, serif", fontSize: "20px", color: COLORS.dark,
      wordWrap: { width: C.COL1_W }, lineSpacing: 5,
    }).setFixedSize(C.COL1_W, C.COL_H);

    // Approximate chars that fit column 1, show remainder in column 2
    const charsPerLine = Math.floor(C.COL1_W / 11);
    const linesInCol   = Math.floor(C.COL_H / 25);
    const charLimit    = charsPerLine * linesInCol;
    if (passage.length > charLimit) {
      this.add.text(C.COL2_X, C.COL2_Y, passage.slice(charLimit), {
        fontFamily: "Georgia, serif", fontSize: "20px", color: COLORS.dark,
        wordWrap: { width: C.COL2_W }, lineSpacing: 5,
      }).setFixedSize(C.COL2_W, C.COL_H);
    }

    // ── Hand-drawn "Article Complete!" header ─────────────────────
    this.add.image(C.HEADER_X, C.HEADER_Y, "header-article-complete").setOrigin(0.5);

    if (r.isPB) {
      this.add.text(C.HEADER_X, C.HEADER_Y + py(5), "★  New Personal Best!", {
        fontFamily: "Arial", fontSize: FONT.sm, color: "#888800", fontStyle: "bold"
      }).setOrigin(0.5);
    }

    // ── Stats (Phaser text — only numbers, no decorative labels) ──
    const score = Math.round(r.wpm * (r.accuracy / 100) * 1.5 * 100);
    this._stat(C.STAT_WPM_X,   C.STAT_ROW_Y, String(r.wpm));
    this._stat(C.STAT_ACC_X,   C.STAT_ROW_Y, `${r.accuracy}%`);
    this._stat(C.STAT_XP_X,    C.STAT_ROW_Y, `+${r.xpGain}`);
    this._stat(C.STAT_SCORE_X, C.STAT_ROW_Y, String(score));

    // ── Buttons (hand-drawn images) ────────────────────────────────
    this._imageBtn(C.BTN_NEXT_X,  C.BTN_NEXT_Y,  "btn-go-next",   () => this.scene.start("levelSelectScene"));
    this._imageBtn(C.BTN_RETRY_X, C.BTN_RETRY_Y, "btn-try-again", () => this.scene.start("gameScene"));
  }

  // failed screen
  _buildFailedScreen(r) {
    this.cameras.main.setBackgroundColor("#1a1a2e");
    this.add.image(CX, CY, "ui-results-failed-bg");
    this.add.image(F.HEADER_X, F.HEADER_Y, "header-mission-failed").setOrigin(0.5);

    // sad pigeon :(
    renderMascot(this, F.MASCOT_X, F.MASCOT_Y, F.MASCOT_SCALE, "fail");

    // Stats (even on fail, show what the player achieved — no SCORE on fail)
    this._stat(F.STAT_WPM_X,   F.STAT_ROW_Y, String(r.wpm),         "#ffffff");
    this._stat(F.STAT_ACC_X,   F.STAT_ROW_Y, `${r.accuracy}%`,       "#ffffff");
    this._stat(F.STAT_XP_X,    F.STAT_ROW_Y, `+0`,                   COLORS.muted);
    this._stat(F.STAT_SCORE_X, F.STAT_ROW_Y, "—",                    COLORS.muted);

    this._imageBtn(F.BTN_RETRY_X, F.BTN_RETRY_Y, "btn-try-again", () => this.scene.start("gameScene"));
    this._imageBtn(F.BTN_HOME_X,  F.BTN_HOME_Y,  "btn-go-home",   () => this.scene.start("menuScene"));
  }

  // save score
  async _saveScore(r) {
    // Show a small status indicator in a consistent corner
    const saveLbl = this.add.text(GW - 24, GH - 24, "saving...", {
      fontFamily: "Arial", fontSize: "18px", color: COLORS.muted
    }).setOrigin(1, 1);

    try {
      const res = await axios.post("/api/stats/submit-score", {
        levelNumber: r.levelNumber,
        wpm:         r.wpm,
        accuracy:    r.accuracy,
        xpGain:      r.deadlineMet ? r.xpGain : 0,  // no XP on fail
        coinsEarned: r.deadlineMet ? r.coinsEarned : 0,
        deadlineMet: r.deadlineMet,
      }, { headers: authHeader() });

      saveLbl.setText("✓ Saved").setStyle({ color: COLORS.success });

      const bal   = res.data.new_balances;
      const stats = getStats();
      updateStats({
        ...stats,
        xpTotal:     bal.xpTotal,
        coinBalance: bal.coinBalance,
        finLevels:   bal.unlockedLevels,
        rankLevel:   res.data.newRank ?? stats.rankLevel,
        PBs: r.isPB ? { ...stats.PBs, [String(r.levelNumber)]: r.wpm } : stats.PBs,
      });
      Object.assign(gameState, {
        xpTotal:     bal.xpTotal,
        coinBalance: bal.coinBalance,
        finLevels:   bal.unlockedLevels,
      });
      if (r.isPB) gameState.PBs[String(r.levelNumber)] = r.wpm;
      if (res.data.newRank) gameState.rankLevel = res.data.newRank;

    } catch {
      saveLbl.setText("⚠ Error").setStyle({ color: COLORS.accent });
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _stat(x, y, value, color = COLORS.dark) {
    // Just the number — labels (WPM, ACC%, etc.) are part of the hand-drawn background
    this.add.text(x, y, value, {
      fontFamily: "'Roboto Mono', monospace",
      fontSize:   FONT.xl,
      color,
      fontStyle:  "bold",
    }).setOrigin(0.5);
  }

  _imageBtn(x, y, key, callback) {
    const btn = this.add.image(x, y, key)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on("pointerover",  () => btn.setAlpha(0.8));
    btn.on("pointerout",   () => btn.setAlpha(1));
    btn.on("pointerdown",  callback);
  }
}