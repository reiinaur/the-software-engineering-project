// Core typing gameplay scene.
// Implements typingEngine() and timer() from the pseudocode/IPO tables.
// REWRITTEN from the placeholder that called /api/users (a non-existent endpoint).
 
import Phaser from "phaser";
import { gameState } from "../utils/gameState.js";
 
export default class gameScene extends Phaser.Scene {
  constructor() {
    super("gameScene");
  }
 
  create() {
    const W = this.scale.width;
 
    // ── Typing engine state (mirrors typingEngine() data dictionary) ──
    this.cursorIndex    = 0;
    this.correctChars   = 0;
    this.incorrectChars = 0;
    this.totalChars     = 0;
    this.sessionActive  = true;
    this.deadlineMet    = false;
    this._ended         = false;
 
    // ── Timer state ───────────────────────────────────────────────
    this.timerDuration = gameState.timerDuration;
    this.startTime     = this.time.now;   // milliseconds
 
    // ── Header ───────────────────────────────────────────────────
    this.add.text(W / 2, 28, `THE TYPING TIMES  ·  ${gameState.articleTitle}`, {
      fontSize: "16px", fill: "#aaaaaa"
    }).setOrigin(0.5);
 
    // ── Timer bar ─────────────────────────────────────────────────
    // The track is the grey background; the bar shrinks left-to-right.
    this.add.rectangle(W / 2, 58, W - 60, 16, 0x333355);
    this._timerBar = this.add.rectangle(30, 58, W - 60, 16, 0x44aa77).setOrigin(0, 0.5);
 
    // ── Live stats ────────────────────────────────────────────────
    this._wpmText   = this.add.text(30,  82, "WPM: 0",  { fontSize: "15px", fill: "#fff" });
    this._phaseText = this.add.text(W - 30, 82, "CALM",  { fontSize: "15px", fill: "#44aa77" }).setOrigin(1, 0);
 
    // ── Passage display ───────────────────────────────────────────
    // Each character of the passage is its own Text object so we can
    // colour them individually: grey = untyped, green = correct, red = wrong.
    this._charTexts = [];
    const passage   = gameState.passage;
    const startX    = 40;
    let   curX      = startX;
    let   curY      = 150;
    const lineMax   = W - 80;
    const charSize  = 18;
    const lineH     = 32;
 
    passage.split("").forEach((ch, i) => {
      // Create a temporary text to measure its width before placing it.
      // Word-wrapping: if adding this char would exceed the line, drop to the next line.
      const tempT = this.add.text(0, 0, ch, { fontSize: `${charSize}px`, fontFamily: "monospace" });
      const chW   = tempT.width;
      tempT.destroy();
 
      if (curX + chW > lineMax && ch !== " ") {
        curX = startX;
        curY += lineH;
      }
 
      const t = this.add.text(curX, curY, ch, {
        fontSize: `${charSize}px`,
        fontFamily: "monospace",
        fill: "#666688",   // untyped colour
      });
      this._charTexts.push(t);
      curX += t.width;
    });
 
    // Cursor indicator — a thin rectangle that moves with the typing position
    this._cursor = this.add.rectangle(0, 0, 2, charSize + 4, 0xe94560);
 
    // Position the cursor under the first character
    this._updateCursor();
 
    // ── Keyboard input ────────────────────────────────────────────
    // keydown fires for every key press including Shift, Ctrl, etc.
    // We only process single-character keys (event.key.length === 1).
    this.input.keyboard.on("keydown", (event) => {
      if (!this.sessionActive || this._ended) return;
      if (event.key.length !== 1) return;
 
      const expectedKey = passage[this.cursorIndex];
      const isMatch     = event.key === expectedKey;
 
      if (isMatch) {
        this._charTexts[this.cursorIndex].setStyle({ fill: "#44aa77" });  // correct = green
        this.correctChars++;
        this.cursorIndex++;
      } else {
        this._charTexts[this.cursorIndex].setStyle({ fill: "#e94560" });  // wrong = red
        this.incorrectChars++;
      }
 
      this.totalChars = this.correctChars + this.incorrectChars;
      this._updateCursor();
 
      // Passage complete — player finished before timer ran out
      if (this.cursorIndex >= passage.length) {
        this.deadlineMet   = true;
        this.sessionActive = false;
        this._endSession();
      }
    });
 
    // ── 1-second repeating timer ──────────────────────────────────
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this._tick,
      callbackScope: this,
    });
 
    // ESC to quit back to level select
    this.input.keyboard.on("keydown-ESC", () => {
      if (!this._ended) {
        this.sessionActive = false;
        this.scene.start("levelSelectScene");
      }
    });
 
    this.add.text(W - 10, 580, "ESC to quit", {
      fontSize: "12px", fill: "#444466"
    }).setOrigin(1, 1);
  }
 
  _updateCursor() {
    if (this.cursorIndex < this._charTexts.length) {
      const t = this._charTexts[this.cursorIndex];
      this._cursor.setPosition(t.x, t.y + t.height / 2);
    }
  }
 
  _tick() {
    if (!this.sessionActive) return;
 
    const elapsed = (this.time.now - this.startTime) / 1000;
    const left    = Math.max(0, this.timerDuration - elapsed);
    const ratio   = left / this.timerDuration;
 
    // Shrink the timer bar proportionally to time remaining
    this._timerBar.width = (this.scale.width - 60) * ratio;
 
    // Update pressure phase — mirrors timer() CASE statement in pseudocode
    if (left > this.timerDuration * 0.4) {
      this._timerBar.setFillStyle(0x44aa77);
      this._phaseText.setText("CALM").setStyle({ fill: "#44aa77" });
    } else if (left > this.timerDuration * 0.15) {
      this._timerBar.setFillStyle(0xffaa00);
      this._phaseText.setText("WARNING").setStyle({ fill: "#ffaa00" });
    } else {
      this._timerBar.setFillStyle(0xe94560);
      this._phaseText.setText("DEADLINE!").setStyle({ fill: "#e94560" });
    }
 
    // Update live WPM every second: (correct chars / 5) / (elapsed minutes)
    if (elapsed > 0) {
      const liveWpm = Math.round((this.correctChars / 5) / (elapsed / 60));
      this._wpmText.setText(`WPM: ${liveWpm}`);
    }
 
    // Timer expired
    if (left <= 0) {
      this.sessionActive = false;
      this.deadlineMet   = false;
      this._endSession();
    }
  }
 
  _endSession() {
    if (this._ended) return;  // Guard: prevents double-call from both timer and completion
    this._ended = true;
 
    const elapsed  = (this.time.now - this.startTime) / 1000;
    const wpm      = elapsed > 0 ? Math.round((this.correctChars / 5) / (elapsed / 60)) : 0;
    const accuracy = this.totalChars > 0
      ? Math.round((this.correctChars / this.totalChars) * 10000) / 100
      : 0;
 
    // XP = WPM × (accuracy / 100) — rewards both speed and accuracy together
    const xpGain = Math.round(wpm * (accuracy / 100));
 
    // Coin calculation mirrors earnCoins() pseudocode
    let coinsEarned = 10;                   // basePay: always awarded for completing a session
    if (this.deadlineMet) coinsEarned += 5; // deadlineBonus
    if (accuracy > 98)    coinsEarned += 5; // acc%Bonus
    const levelPB = gameState.PBs?.[String(gameState.selectedLevel)] || 0;
    const isPB    = wpm > levelPB;
    if (isPB)             coinsEarned += 5; // wpmBonus
 
    // Write results to gameState so resultsScene can read them without re-fetching
    gameState.lastResult = {
      wpm,
      accuracy,
      xpGain,
      coinsEarned,
      isPB,
      deadlineMet: this.deadlineMet,
      levelNumber: gameState.selectedLevel,
    };
 
    // Short pause before transition so the player sees their last keystroke colour
    this.time.delayedCall(600, () => this.scene.start("resultsScene"));
  }
}