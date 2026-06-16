import Phaser from "phaser";
import { GW, GH, CX, CY, FONT, COLORS, HEX, px, py } from "../utils/scale.js";
import { gameState } from "../utils/gameState.js";
import { getGameBgKey, renderMascot, changeMascotMood } from "../utils/shopUtils.js";

// timer 
const TIMER_X    = px(95);
const TIMER_Y    = py(3.2);

// stats in menu bar area
const WPM_X      = px(65);
const WPM_Y      = py(8.3);
const ACC_X      = px(75);
const ACC_Y      = py(8.3);

// progress bar
const PROG_X     = 0;
const PROG_Y     = py(12.5);
const PROG_H     = py(0.7);    // height of bar in game units
const PROG_COLOR_CALM     = 0x44aa77;
const PROG_COLOR_WARNING  = 0xffaa00;
const PROG_COLOR_DEADLINE = 0xe94560;

// document typing area 
const DOC_LEFT   = px(7);     // left edge of where text starts
const DOC_TOP    = py(19);    // top of typing area
const DOC_RIGHT  = px(52);    // right edge (for word wrap)
const CHAR_SIZE  = 26;        // font size in game units for passage text
const LINE_H     = 44;        // line height in game units

// pigeon 
const MASCOT_X   = px(77);
const MASCOT_Y   = py(52);
const MASCOT_SCALE = 0.22;

// speech bubble 
const BUBBLE_Y   = py(16);
const BUBBLE_W   = px(38);
const BUBBLE_H   = py(13);
// ─────────────────────────────────────────────────────────────────────────────

const EMOTIONS = {
  calm:     "(ˊᵕˋ)",
  warning:  "(>_<)",
  deadline: "!(´Д`!)",
};

export default class gameScene extends Phaser.Scene {
  constructor() { super("gameScene"); }

  create() {
    // ── Background (theme-dependent hand-drawn image) ──────────────
    this.add.image(CX, CY, getGameBgKey());

    // typing engine state at beginning of gameplay
    this.cursorIndex    = 0;
    this.correctChars   = 0;
    this.incorrectChars = 0;
    this.totalChars     = 0;
    this.sessionActive  = true;
    this.deadlineMet    = false;
    this._ended         = false;
    this.pressurePhase  = "calm";
    this.timerDuration  = gameState.timerDuration;
    this.startTime      = this.time.now;
    this._equippedAcc   = gameState.shopEquipped?.accessories ?? null;

    // text for timer and other stats
    this._timerText = this.add.text(TIMER_X, TIMER_Y, "00:00", {
      fontFamily: "'Roboto Mono', monospace",
      fontSize:   "26px",       // small enough to fit in the drawn title bar
      color:      "#ffffff",    // adjust to match your title bar text colour
    }).setOrigin(1, 0.5);

    this._wpmText = this.add.text(WPM_X, WPM_Y, "WPM 0", {
      fontFamily: "'Roboto Mono', monospace", fontSize: "20px", color: "#444444"
    });
    this._accText = this.add.text(ACC_X, ACC_Y, "ACC 0%", {
      fontFamily: "'Roboto Mono', monospace", fontSize: "20px", color: "#444444"
    });

    // progress bar
    this._progBar = this.add.rectangle(PROG_X, PROG_Y, GW, PROG_H, PROG_COLOR_CALM)
      .setOrigin(0, 0);

    // passage text
    this._charTexts = [];
    const passage   = gameState.passage || "";
    let cx = DOC_LEFT, cy = DOC_TOP;

    passage.split("").forEach((ch) => {
      // Probe character width (Courier New is monospace so all are equal,
      // but we follow this pattern in case the font changes)
      const probe = this.add.text(0, -500, ch, {
        fontFamily: "'Courier New', monospace", fontSize: `${CHAR_SIZE}px`
      });
      const chW = probe.width;
      probe.destroy();

      if (cx + chW > DOC_RIGHT && ch !== " ") { cx = DOC_LEFT; cy += LINE_H; }

      const t = this.add.text(cx, cy, ch, {
        fontFamily: "'Courier New', monospace",
        fontSize:   `${CHAR_SIZE}px`,
        color:      "#bbbbbb",   // untyped = light grey
      });
      this._charTexts.push(t);
      cx += t.width;
    });

    // blinking cursor
    this._cursor = this.add.rectangle(0, 0, 3, CHAR_SIZE + 4, HEX.accent);
    this._updateCursor();
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { if (this._cursor) this._cursor.setVisible(!this._cursor.visible); }
    });
  
    this._mascotLayers = renderMascot(this, MASCOT_X, MASCOT_Y, MASCOT_SCALE, "calm");

    // speech bubble
    this._bubbleGfx = this.add.graphics();
    this._drawBubble();

    this._emotionText = this.add.text(
      BUBBLE_X + BUBBLE_W / 2,
      BUBBLE_Y + BUBBLE_H / 2,
      EMOTIONS.calm, {
      fontFamily: "'Roboto Mono', monospace",
      fontSize:   FONT.lg,
      color:      COLORS.dark,
    }).setOrigin(0.5);

    // collects keyboard input
    this.input.keyboard.on("keydown", (event) => {
      if (!this.sessionActive || this._ended || event.key.length !== 1) return;

      const expected = passage[this.cursorIndex];
      const isMatch  = event.key === expected;

      if (isMatch) {
        this._charTexts[this.cursorIndex].setStyle({ color: "#1a1a2e", fontStyle: "bold" });
        this.correctChars++;
        this.cursorIndex++;
      } else {
        this._charTexts[this.cursorIndex].setStyle({ color: "#e94560", fontStyle: "bold" });
        this.incorrectChars++;
      }

      this.totalChars = this.correctChars + this.incorrectChars;
      this._updateCursor();

      if (this.cursorIndex >= passage.length) {
        this.deadlineMet   = true;
        this.sessionActive = false;
        this._endSession();
      }
    });

    // 1 seconf tick
    this.time.addEvent({ delay: 1000, loop: true, callback: this._tick, callbackScope: this });
  }

  _drawBubble() {
    this._bubbleGfx.clear();
    this._bubbleGfx.fillStyle(0xffffff);
    this._bubbleGfx.fillRoundedRect(BUBBLE_X, BUBBLE_Y, BUBBLE_W, BUBBLE_H, 14);
    this._bubbleGfx.lineStyle(2, 0x333333);
    this._bubbleGfx.strokeRoundedRect(BUBBLE_X, BUBBLE_Y, BUBBLE_W, BUBBLE_H, 14);
    // Tail pointing down-left toward mascot
    const tx = BUBBLE_X + 60;
    this._bubbleGfx.fillTriangle(tx, BUBBLE_Y + BUBBLE_H, tx + 22, BUBBLE_Y + BUBBLE_H, tx - 8, BUBBLE_Y + BUBBLE_H + 20);
    this._bubbleGfx.lineStyle(2, 0x333333);
    this._bubbleGfx.lineBetween(tx, BUBBLE_Y + BUBBLE_H, tx - 8, BUBBLE_Y + BUBBLE_H + 20);
    this._bubbleGfx.lineBetween(tx + 22, BUBBLE_Y + BUBBLE_H, tx - 8, BUBBLE_Y + BUBBLE_H + 20);
  }

  _updateCursor() {
    if (this.cursorIndex < this._charTexts.length) {
      const t = this._charTexts[this.cursorIndex];
      this._cursor.setPosition(t.x - 1, t.y + t.height / 2).setVisible(true);
    } else {
      this._cursor?.setVisible(false);
    }
  }

  _tick() {
    if (!this.sessionActive) return;

    const elapsed = (this.time.now - this.startTime) / 1000;
    const left    = Math.max(0, this.timerDuration - elapsed);
    const ratio   = left / this.timerDuration;

    // Timer display
    const m = String(Math.floor(left / 60)).padStart(2, "0");
    const s = String(Math.floor(left % 60)).padStart(2, "0");
    this._timerText.setText(`${m}:${s}`);

    // Pressure phase
    const newPhase = left > this.timerDuration * 0.4 ? "calm"
                   : left > this.timerDuration * 0.15 ? "warning"
                   : "deadline";

    if (newPhase !== this.pressurePhase) {
      this.pressurePhase = newPhase;
      const col = newPhase === "calm"     ? PROG_COLOR_CALM
                : newPhase === "warning"  ? PROG_COLOR_WARNING
                : PROG_COLOR_DEADLINE;
      this._progBar.setFillStyle(col);
      this._emotionText.setText(EMOTIONS[newPhase]);
      // trigger pressure phase -> changes pigeon mood
      changeMascotMood(this, this._mascotLayers, newPhase, this._equippedAcc);
    }

    this._progBar.width = GW * ratio;

    if (elapsed > 0) {
      const wpm = Math.round((this.correctChars / 5) / (elapsed / 60));
      const acc = this.totalChars > 0
        ? Math.round((this.correctChars / this.totalChars) * 100) : 0;
      this._wpmText.setText(`WPM ${wpm}`);
      this._accText.setText(`ACC ${acc}%`);
    }

    if (left <= 0) {
      this.sessionActive = false;
      this.deadlineMet   = false;
      this._endSession();
    }
  }

  _endSession() {
    if (this._ended) return;
    this._ended = true;

    const elapsed  = (this.time.now - this.startTime) / 1000;
    const wpm      = elapsed > 0 ? Math.round((this.correctChars / 5) / (elapsed / 60)) : 0;
    const accuracy = this.totalChars > 0
      ? Math.round((this.correctChars / this.totalChars) * 10000) / 100 : 0;
    const xpGain   = Math.round(wpm * (accuracy / 100));

    let coins = 10;
    if (this.deadlineMet) coins += 5;
    if (accuracy > 98)    coins += 5;
    const isPB = wpm > (gameState.PBs?.[String(gameState.selectedLevel)] ?? 0);
    if (isPB)             coins += 5;

    gameState.lastResult = {
      wpm, accuracy, xpGain, coinsEarned: coins,
      isPB, deadlineMet: this.deadlineMet, levelNumber: gameState.selectedLevel,
    };

    this.time.delayedCall(700, () => this.scene.start("resultsScene"));
  }
}