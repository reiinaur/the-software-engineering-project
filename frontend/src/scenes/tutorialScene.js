import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, colours, HEX, px, py } from "../utils/scale.js";
import { gameState } from "../utils/gameState.js";
import { authHeader, getStats, updateStats } from "../utils/auth.js";

// --- HEADER & MENUBAR POSITIONING (mirrored from gameScene) ---
const TIMER_X     = px(13);
const TIMER_Y     = py(12);

const WPM_X       = px(32);
const WPM_Y       = py(12);
const ACC_X       = px(59);
const ACC_Y       = py(12);

// --- TYPING PAPER DIMENSIONS (identical to gameScene) ---
const DOC_LEFT   = px(10);
const DOC_TOP    = py(22);
const DOC_RIGHT  = px(55);
const CHAR_SIZE  = 36;
const LINE_H     = 48;

// --- PIGEON ART ASSETS & COORDINATES (identical to gameScene) ---
const PIGEON_X   = px(82);
const PIGEON_Y   = py(63);

const BUBBLE_X   = px(79.4);
const BUBBLE_Y   = py(23.2);

// --- TUTORIAL STEPS ---
// passage: null = "press any key" intro slide; hint shown in bubble only
const STEPS = [
  {
    mood:    "calm",
    speech:  "Hi! I'm your editor.\nWelcome to The Typing Times!\n\nPress any key to continue →",
    passage: null,
  },
  {
    mood:    "calm",
    speech:  "Start with your left hand.\nType the home row keys:",
    passage: "asdf",
  },
  {
    mood:    "calm",
    speech:  "Now your right hand.\nThese keys sit under your fingers:",
    passage: "jkl;",
  },
  {
    mood:    "calm",
    speech:  "Let's try some real words.\nTake your time!",
    passage: "the and for",
  },
  {
    mood:    "calm",
    speech:  "One sentence and you're\nready for the newsroom!",
    passage: "type quickly and accurately",
  },
  {
    mood:    "calm",
    speech:  "You did it!\nType the phrase below\nto head to the newsroom.",
    passage: "go to newsroom", // 🟢 Replaced interactive button with actual typing string criteria
    isFinal: true,
  },
];

export default class tutorialScene extends Phaser.Scene {
  constructor() { super("tutorialScene"); }

  create() {
    // 1. Core Layout — identical background setup to gameScene
    this.cameras.main.setBackgroundColor('#e6ba88'); // always default theme in tutorial

    this.add.image(px(32), py(86), "paper").setScale(0.8);

    // 2. Header UI — same as gameScene but timer shows "TUTORIAL" and stats are static
    this._timerText = this.add.text(TIMER_X, TIMER_Y, "TUTORIAL", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    }).setOrigin(1, 0.5);

    this._stepText = this.add.text(WPM_X, WPM_Y, "STEP 1", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    }).setOrigin(0.5,0.5);

    this._hintText = this.add.text(ACC_X, ACC_Y, "", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    }).setOrigin(1,0.5);

    // 4. Pigeon setup — identical to gameScene
    this._createPigeonAnimations();

    this.pigeonSprite = this.add.sprite(PIGEON_X, PIGEON_Y, "pigeon-tutorial").setScale(0.4);
    this.pigeonSprite.play("anim-pigeon-tutorial");

    // Accessory overlay (respects whatever the player has equipped)
    this.accessorySprite = null;
    this.currentAcc = gameState.equipped?.accessory || "none";
    if (this.currentAcc !== "none" && this.textures.exists(`${this.currentAcc}-calm`)) {
      this.accessorySprite = this.add.sprite(PIGEON_X, PIGEON_Y, `${this.currentAcc}-calm`).setScale(0.4);
      this.accessorySprite.play(`anim-acc-${this.currentAcc}-calm`);
    }

    // 5. Speech bubble — same position as gameScene bubble
    this.speechBubble = this.add.image(px(79), py(25), "bubble").setScale(0.15);

    // 6. Cursor blink timer
    this._cursorVisible = true;
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { if (this._cursor) this._cursor.setVisible(!this._cursor.visible); }
    });

    // 7. Keyboard listener
    this._keyListener = null;
    this.input.keyboard.on("keydown", (e) => this._onKey(e));

    // 8. Per-step state
    this._stepIndex  = 0;
    this._charIndex  = 0;
    this._charTexts  = [];
    this._stepObjs   = []; // objects that get destroyed between steps
    this._cursor     = null;

    this._buildStep(0);
  }

  // ── Build a single step ──────────────────────────────────────────────────────

  _buildStep(idx) {
    // Destroy previous step's paper-area objects
    this._stepObjs.forEach((o) => o?.destroy());
    this._stepObjs = [];
    this._charTexts = [];
    this._charIndex = 0;

    const step = STEPS[idx];
    const typingSteps = STEPS.filter((s) => s.passage !== null);
    const typingIdx   = STEPS.slice(0, idx + 1).filter((s) => s.passage !== null).length;

    // Update header layout profiles
    if (step.passage !== null) {
      this._stepText.setText(`STEP ${typingIdx} OF ${typingSteps.length}`);
      this._hintText.setText(step.isFinal ? "FINAL STEP" : "TYPE BELOW");
    } else {
      this._stepText.setText("");
      this._hintText.setText("PRESS ANY KEY");
    }

    // Replace speech bubble text (destroy old one first)
    if (this._speechText) this._speechText.destroy();
    
    this._speechText = this.add.text(BUBBLE_X, BUBBLE_Y, step.speech, {
      fontFamily: "'Courier New', monospace",
      fontSize: "18px",
      fontStyle: "bold",
      color: colours.main,
      align: "center",
      wordWrap: { width: px(10) },
    }).setOrigin(0.5, 0.3);
    this._stepObjs.push(this._speechText);

    // ── Intro / "press any key" slide ───────────────────────────
    if (step.passage === null) {
      // No typing area — just wait for any key
      return;
    }

    // ── Unified Text Passage Generator (Handles Final Step now too) ───
    const passage = step.passage;
    let cx = DOC_LEFT, cy = DOC_TOP;

    const words = passage.split(/(\s+)/);
    words.forEach((word) => {
      if (word === "") return;

      if (/^\s+$/.test(word)) {
        word.split("").forEach((ch) => {
          const t = this.add.text(cx, cy, ch, {
            fontFamily: "'Courier New', monospace", fontSize: `${CHAR_SIZE}px`, fontStyle: "bold", color: "#a0a0a0",
          });
          this._charTexts.push(t);
          this._stepObjs.push(t);
          cx += t.width;
        });
      } else {
        let wordWidth = 0;
        word.split("").forEach((ch) => {
          const probe = this.add.text(0, -500, ch, {
            fontFamily: "'Courier New', monospace", fontStyle: "bold", fontSize: `${CHAR_SIZE}px`
          });
          wordWidth += probe.width;
          probe.destroy();
        });

        if (cx + wordWidth > DOC_RIGHT) { cx = DOC_LEFT; cy += LINE_H; }

        word.split("").forEach((ch) => {
          const t = this.add.text(cx, cy, ch, {
            fontFamily: "'Courier New', monospace", fontStyle: "bold", fontSize: `${CHAR_SIZE}px`, color: "#a0a0a0",
          });
          this._charTexts.push(t);
          this._stepObjs.push(t);
          cx += t.width;
        });
      }
    });

    // Cursor positioning
    if (this._cursor) this._cursor.destroy();
    this._cursor = this.add.rectangle(0, 0, 2, CHAR_SIZE + 4, HEX.muted || 0x7767a9);
    this._stepObjs.push(this._cursor);
    this._updateCursor();
  }

  // ── Key routing ──────────────────────────────────────────────────────────────

  _onKey(event) {
    const step = STEPS[this._stepIndex];

    // Intro slide: any key advances
    if (step.passage === null) {
      this._nextStep();
      return;
    }

    // Typing step validation context
    if (event.key.length !== 1) return;

    const passage  = step.passage;
    const expected = passage[this._charIndex];
    const isMatch  = event.key === expected;

    if (isMatch) {
      this._charTexts[this._charIndex].setStyle({ color: "#5c5284", fontStyle: "bold" });
      this._charIndex++;
      this._updateCursor();

      if (this._charIndex >= passage.length) {
        // Brief pause then advance to completion route cleanly
        this.time.delayedCall(400, () => this._nextStep());
      }
    } else {
      // Wrong key — flash red then back to grey
      this._charTexts[this._charIndex].setStyle({ color: colours.accent, fontStyle: "bold" });
      this.time.delayedCall(180, () => {
        if (this._charTexts[this._charIndex]) {
          this._charTexts[this._charIndex].setStyle({ color: "#a0a0a0", fontStyle: "bold" });
        }
      });
    }
  }

  // ── Cursor position (identical logic to gameScene) ───────────────────────────

  _updateCursor() {
    if (!this._cursor) return;
    if (this._charIndex < this._charTexts.length) {
      const t = this._charTexts[this._charIndex];
      this._cursor.setPosition(t.x - 1, t.y + t.height / 2).setVisible(true);
    } else {
      this._cursor?.setVisible(false);
    }
  }

  // ── Step progression ─────────────────────────────────────────────────────────

  _nextStep() {
    this._stepIndex++;
    if (this._stepIndex < STEPS.length) {
      this._buildStep(this._stepIndex);
    } else {
      this._completeTutorial();
    }
  }

  // ── Pigeon animations (identical to gameScene) ───────────────────────────────

  _createPigeonAnimations() {
    const anims = [
      { key: "anim-pigeon-tutorial",   asset: "pigeon-tutorial"}
    ];

    anims.forEach(anim => {
      if (!this.anims.exists(anim.key)) {
        this.anims.create({
          key: anim.key,
          frames: this.anims.generateFrameNumbers(anim.asset, { start: 0, end: 1 }),
          frameRate: 2,
          repeat: -1
        });
      }
    });

    const activeAcc = gameState.equipped?.accessory || "none";
    if (activeAcc !== "none") {
      ["calm", "warning", "deadline", "failure"].forEach(phase => {
        const accKey  = `anim-acc-${activeAcc}-${phase}`;
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

  // ── Tutorial completion — grant XP then go to level select ───────────────────

  async _completeTutorial() {
    try {
      const res = await axios.post("/api/stats/submit-score", {
        levelNumber:  1,
        wpm:          0,
        accuracy:     100,
        xpGain:       100,   // exactly enough to reach rank 2 threshold
        coinsEarned:  10,
        deadlineMet:  true,
      }, { headers: authHeader() });

      const bal = res.data.new_balances;
      gameState.rankLevel   = res.data.newRank;
      gameState.xpTotal     = bal.xpTotal;
      gameState.coinBalance = bal.coinBalance;
      gameState.finLevels   = bal.unlockedLevels;
      gameState.PBs         = bal.PBs;

      updateStats({
        ...getStats(),
        xpTotal:     bal.xpTotal,
        coinBalance: bal.coinBalance,
        finLevels:   bal.unlockedLevels,
        PBs:         bal.PBs,
      });
    } catch (e) {
      console.warn("Tutorial score submit failed", e);
    }
    this.scene.start("levelSelectScene");
  }

  shutdown() {
    this.input.keyboard.off("keydown");
  }
}