import Phaser from "phaser";
import { GW, GH, CX, CY, FONT, colours, HEX, px, py } from "../utils/scale.js";
import { gameState } from "../utils/gameState.js";
import { renderMascot } from "../utils/shopUtils.js";

// Mascot position in your tutorial background
const MASCOT_X     = px(78);
const MASCOT_Y     = py(52);
const MASCOT_SCALE = 0.24;

// Speech bubble position
const BUBBLE_X = px(54);
const BUBBLE_Y = py(14);
const BUBBLE_W = px(40);
const BUBBLE_H = py(18);

// Typing passage area (centred in the left/middle area of your background)
const PASSAGE_X    = px(7);
const PASSAGE_Y    = py(52);
const PASSAGE_W    = px(40);
const CHAR_SIZE    = 34;   // bigger than game scene — easier to read for tutorial
const LINE_H       = 56;

// Step progress indicator
const STEP_IND_X = CX;
const STEP_IND_Y = py(91);

// "Go to Newsroom" button position (last step)
const BTN_NEWSROOM_X = CX;
const BTN_NEWSROOM_Y = py(86);

const STEPS = [
  {
    mood:    "tutorial",
    speech:  "Hi! I'm your editor.\nWelcome to The Typing Times!",
    passage: null,
    hint:    "Press any key to continue →",
  },
  {
    mood:    "tutorial",
    speech:  "Let's start with your left hand.\nType the home row keys:",
    passage: "asdf",
    hint:    "Type what you see below:",
  },
  {
    mood:    "tutorial",
    speech:  "Great! Now your right hand.\nThese keys sit under your fingers:",
    passage: "jkl;",
    hint:    "Type what you see below:",
  },
  {
    mood:    "tutorial",
    speech:  "Now let's try some real words.\nTake your time!",
    passage: "the and for",
    hint:    "Type what you see below:",
  },
  {
    mood:    "calm",
    speech:  "Excellent! One sentence and\nyou're ready for the newsroom.",
    passage: "type quickly and accurately",
    hint:    "Type what you see below:",
  },
  {
    mood:    "calm",
    speech:  "You did it! Head to the newsroom\nfor your first assignment.",
    passage: null,
    hint:    null,  // null hint = show "Go to Newsroom" button
  },
];

export default class tutorialScene extends Phaser.Scene {
  constructor() { super("tutorialScene"); }

  create() {
    this.cameras.main.setBackgroundColor("#ffffff");
    this.add.image(CX, CY, "ui-tutorial-bg");

    this._stepIndex     = 0;
    this._charIndex     = 0;
    this._charTexts     = [];
    this._mascotLayers  = [];
    this._stepObjects   = [];   // track objects from current step so we can destroy on advance

    this._buildStep(0);
  }

  _buildStep(stepIdx) {
    // Destroy objects from the previous step
    this._stepObjects.forEach((o) => o?.destroy());
    this._stepObjects = [];

    const step = STEPS[stepIdx];
    this._charIndex = 0;
    this._charTexts = [];

    // ── Mascot (re-render per step for mood changes) ───────────────
    this._mascotLayers.forEach((l) => l?.destroy());
    this._mascotLayers = renderMascot(this, MASCOT_X, MASCOT_Y, MASCOT_SCALE, step.mood);
    this._mascotLayers.forEach((l) => this._stepObjects.push(l));

    // ── Speech bubble ─────────────────────────────────────────────
    const bubbleGfx = this.add.graphics();
    this._stepObjects.push(bubbleGfx);
    bubbleGfx.fillStyle(0xffffff);
    bubbleGfx.fillRoundedRect(BUBBLE_X, BUBBLE_Y, BUBBLE_W, BUBBLE_H, 14);
    bubbleGfx.lineStyle(2, 0x333333);
    bubbleGfx.strokeRoundedRect(BUBBLE_X, BUBBLE_Y, BUBBLE_W, BUBBLE_H, 14);
    // Bubble tail
    const tx = BUBBLE_X + 60;
    bubbleGfx.fillTriangle(tx, BUBBLE_Y + BUBBLE_H, tx + 22, BUBBLE_Y + BUBBLE_H, tx - 8, BUBBLE_Y + BUBBLE_H + 22);

    const speechText = this.add.text(
      BUBBLE_X + BUBBLE_W / 2,
      BUBBLE_Y + BUBBLE_H / 2,
      step.speech, {
      fontFamily: "Georgia, serif",
      fontSize:   FONT.sm,
      color:      colours.dark,
      align:      "center",
      wordWrap:   { width: BUBBLE_W - 40 },
    }).setOrigin(0.5);
    this._stepObjects.push(speechText);

    // ── Step indicator ("Step 2 of 5") ────────────────────────────
    const maxTypingSteps = STEPS.filter((s) => s.passage !== null).length;
    const currentTyping  = STEPS.slice(0, stepIdx + 1).filter((s) => s.passage !== null).length;
    if (step.passage !== null) {
      const stepInd = this.add.text(STEP_IND_X, STEP_IND_Y,
        `Step ${currentTyping} of ${maxTypingSteps}`, {
        fontFamily: "Arial", fontSize: FONT.xs, color: colours.muted
      }).setOrigin(0.5);
      this._stepObjects.push(stepInd);
    }

    if (step.passage === null && step.hint === null) {
      // ── Final step: show "Go to Newsroom" button ─────────────────
      const btn = this.add.text(BTN_NEWSROOM_X, BTN_NEWSROOM_Y,
        "→  Go to Newsroom", {
        fontFamily: "Georgia, serif",
        fontSize:   FONT.lg,
        color:      colours.dark,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on("pointerover",  () => btn.setStyle({ color: colours.muted }));
      btn.on("pointerout",   () => btn.setStyle({ color: colours.dark }));
      btn.on("pointerdown",  () => this.scene.start("levelSelectScene"));
      this._stepObjects.push(btn);

      // No keyboard handling for this step
      if (this._keyListener) this.input.keyboard.off("keydown", this._keyListener);
      return;
    }

    if (step.passage === null) {
      // ── "Press any key" step ──────────────────────────────────────
      const hintText = this.add.text(CX, py(82), step.hint ?? "Press any key to continue →", {
        fontFamily: "Arial", fontSize: FONT.xs, color: colours.muted
      }).setOrigin(0.5);
      this._stepObjects.push(hintText);

      // Blink hint
      this.tweens.add({
        targets: hintText, alpha: 0, duration: 600, yoyo: true, repeat: -1
      });

      this._setKeyListener(() => this._nextStep());
      return;
    }

    // ── Typing step ───────────────────────────────────────────────
    if (step.hint) {
      const hint = this.add.text(PASSAGE_X, PASSAGE_Y - py(6), step.hint, {
        fontFamily: "Arial", fontSize: FONT.xs, color: colours.muted
      });
      this._stepObjects.push(hint);
    }

    // Render passage characters
    let cx = PASSAGE_X, cy = PASSAGE_Y;
    const passage = step.passage;

    passage.split("").forEach((ch) => {
      const probe = this.add.text(0, -500, ch, {
        fontFamily: "'Courier New', monospace", fontSize: `${CHAR_SIZE}px`
      });
      const chW = probe.width;
      probe.destroy();

      if (cx + chW > PASSAGE_X + PASSAGE_W && ch !== " ") { cx = PASSAGE_X; cy += LINE_H; }

      const t = this.add.text(cx, cy, ch, {
        fontFamily: "'Courier New', monospace",
        fontSize:   `${CHAR_SIZE}px`,
        color:      "#bbbbbb",
      });
      this._charTexts.push(t);
      this._stepObjects.push(t);
      cx += t.width;
    });

    // Cursor
    this._cursor = this.add.rectangle(0, 0, 3, CHAR_SIZE + 4, HEX.accent);
    this._stepObjects.push(this._cursor);
    this._updateCursor();
    if (this._blinkTimer) this._blinkTimer.destroy();
    this._blinkTimer = this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { if (this._cursor) this._cursor.setVisible(!this._cursor.visible); }
    });

    // Key handler for typing
    this._setKeyListener((event) => {
      if (event.key.length !== 1) return;

      const expected = passage[this._charIndex];
      const isMatch  = event.key === expected;

      if (isMatch) {
        this._charTexts[this._charIndex].setStyle({ color: "#1a1a2e", fontStyle: "bold" });
        this._charIndex++;
        this._updateCursor();

        if (this._charIndex >= passage.length) {
          // Short success pause, then advance
          if (this._keyListener) this.input.keyboard.off("keydown", this._keyListener);
          this.time.delayedCall(500, () => this._nextStep());
        }
      } else {
        // Wrong key — flash the current character red briefly, don't advance cursor
        this._charTexts[this._charIndex].setStyle({ color: "#e94560" });
        this.time.delayedCall(180, () => {
          if (this._charTexts[this._charIndex]) {
            this._charTexts[this._charIndex].setStyle({ color: "#bbbbbb" });
          }
        });
      }
    });
  }

  _updateCursor() {
    if (!this._cursor) return;
    if (this._charIndex < this._charTexts.length) {
      const t = this._charTexts[this._charIndex];
      this._cursor.setPosition(t.x - 1, t.y + t.height / 2).setVisible(true);
    } else {
      this._cursor.setVisible(false);
    }
  }

  _nextStep() {
    this._stepIndex++;
    if (this._stepIndex < STEPS.length) {
      this._buildStep(this._stepIndex);
    } else {
      this.scene.start("levelSelectScene");
    }
  }

  _setKeyListener(fn) {
    if (this._keyListener) this.input.keyboard.off("keydown", this._keyListener);
    this._keyListener = fn;
    this.input.keyboard.on("keydown", fn);
  }

  shutdown() {
    if (this._keyListener) this.input.keyboard.off("keydown", this._keyListener);
    if (this._blinkTimer)  this._blinkTimer.destroy();
  }
}