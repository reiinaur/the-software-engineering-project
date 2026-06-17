import Phaser from "phaser";
import { GW, GH, CX, CY, FONT, colours, HEX, px, py } from "../utils/scale.js";
import { gameState } from "../utils/gameState.js";

// --- SHOP SYSTEM HEX THEMES ---
const THEMES = {
  default: '#e6ba88',
  vanilla: '#f8f2f7',
  lavendar: '#bcafda',
  cottoncandy: '#f0b2c7',
  forest: '#577875'
};

// --- HEADER & MENUBAR POSITIONING ---
const TIMER_X     = px(11);         
const TIMER_Y     = py(9);         

const WPM_X       = px(45);         
const WPM_Y       = py(8.3);
const ACC_X       = px(53);         
const ACC_Y       = py(8.3);

// --- RESTRICTED PROGRESS BAR ---
const PROG_X      = px(7);          
const PROG_Y      = py(11.8);       
const PROG_W      = px(51.3);       
const PROG_H      = py(0.7);        
const PROG_COLOUR_CALM     = HEX.success;
const PROG_COLOUR_WARNING  = HEX.warning;
const PROG_COLOUR_DEADLINE = HEX.accent;

// --- TYPING PAPER DIMENSIONS ---
const DOC_LEFT   = px(10);         
const DOC_TOP    = py(22);         
const DOC_RIGHT  = px(55);         
const CHAR_SIZE  = 36;             
const LINE_H     = 48;             

// --- PIGEON ART ASSETS & COORDINATES ---
const PIGEON_X   = px(78);
const PIGEON_Y   = py(60);

const BUBBLE_X   = px(83);         
const BUBBLE_Y   = py(28);

const EMOTIONS = {
  calm:     "( ˊ ᵕ ˋ )",
  warning:  "!( ˊ ᵕ ˋ )",       
  deadline: "!(´Д`!)",
};

export default class gameScene extends Phaser.Scene {
  constructor() { super("gameScene"); }

  create() {
    // 1. Core Layout Setup & Theme Processing
    const equippedTheme = gameState.shopEquipped?.screenTheme || "default";
    this.cameras.main.setBackgroundColor(THEMES[equippedTheme] || THEMES.default);
    
    this.add.image(px(32), py(86), "paper").setScale(0.8);

    // Engine state initialization
    this.cursorIndex    = 0;
    this.correctChars   = 0;
    this.incorrectChars = 0;
    this.totalChars     = 0;
    this.sessionActive  = true;
    this.deadlineMet    = false;
    this._ended         = false;
    this.pressurePhase  = "calm";
    this.timerDuration  = gameState.timerDuration || 60;
    this.startTime      = this.time.now;

    // 2. Text and UI Stats instantiation 
    this._timerText = this.add.text(TIMER_X, TIMER_Y, "00:00", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    }).setOrigin(1, 0.5);

    this._wpmText = this.add.text(WPM_X, WPM_Y, "WPM 00%", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    });
    this._accText = this.add.text(ACC_X, ACC_Y, "ACC 00%", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    });

    // 3. Progress Timer bar
    this._progBarBackground = this.add.rectangle(PROG_X, PROG_Y, PROG_W, PROG_H, 0xdddddd).setOrigin(0, 0);
    this._progBar = this.add.rectangle(PROG_X, PROG_Y, PROG_W, PROG_H, PROG_COLOUR_CALM).setOrigin(0, 0);

    // 4. Word-by-Word Intelligent Wrap Generation Loop
    this._charTexts = [];
    const passage   = gameState.passage;
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

        if (cx + wordWidth > DOC_RIGHT) {
          cx = DOC_LEFT;
          cy += LINE_H;
        }

        word.split("").forEach((ch) => {
          const t = this.add.text(cx, cy, ch, {
            fontFamily: "'Courier New', monospace", fontStyle: "bold", fontSize: `${CHAR_SIZE}px`, color: "#a0a0a0",
          });
          this._charTexts.push(t);
          cx += t.width;
        });
      }
    });

    // 5. Cursor Initialization Setup
    this._cursor = this.add.rectangle(0, 0, 2, CHAR_SIZE + 4, HEX.muted || 0x7767a9);
    this._updateCursor();
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { if (this._cursor) this._cursor.setVisible(!this._cursor.visible); }
    });
  
    // 6. Setup Pigeon Animations, Instantiation & Accessory Layers
    this._createPigeonAnimations();
    
    this.pigeonSprite = this.add.sprite(PIGEON_X, PIGEON_Y, "pigeon-calm").setScale(0.4);
    this.pigeonSprite.play("anim-pigeon-calm");

    // Dynamic Accessory Overlay Setup
    this.accessorySprite = null;
    this.currentAcc = gameState.equipped?.accessory || "none"; 

    if (this.currentAcc !== "none" && this.textures.exists(`${this.currentAcc}-calm`)) {
      this.accessorySprite = this.add.sprite(PIGEON_X, PIGEON_Y, `${this.currentAcc}-calm`).setScale(0.4);
      this.accessorySprite.play(`anim-acc-${this.currentAcc}-calm`);
    }

    this.speechBubble = this.add.image(px(83), py(28), "bubble").setScale(0.15);

    this._emotionText = this.add.text(BUBBLE_X, BUBBLE_Y, EMOTIONS.calm, {
      fontFamily: "'Roboto Mono', monospace", fontSize: "22px", color: colours.main,
    }).setOrigin(0.5);

    // 7. Typing Engine Input Routing Listeners
    this.input.keyboard.on("keydown", (event) => {
      if (!this.sessionActive || this._ended || event.key.length !== 1) return;

      const expected = passage[this.cursorIndex];
      const isMatch  = event.key === expected;

      if (isMatch) {
        this._charTexts[this.cursorIndex].setStyle({ color: "#5c5284", fontStyle: "bold" });
        this.correctChars++;
        this.cursorIndex++;
      } else {
        this._charTexts[this.cursorIndex].setStyle({ color: colours.accent, fontStyle: "bold" });
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

    this.time.delayedCall(10, () => {
      this.startTime = this.time.now;
      this.time.addEvent({ delay: 1000, loop: true, callback: this._tick, callbackScope: this });
    });
  }

  _createPigeonAnimations() {
    const anims = [
      { key: "anim-pigeon-calm", asset: "pigeon-calm" },
      { key: "anim-pigeon-stressed", asset: "pigeon-stressed" },
      { key: "anim-pigeon-panic", asset: "pigeon-panic" },
      { key: "anim-pigeon-failed", asset: "pigeon-failed" }
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

  _updateCursor() {
    if (this.cursorIndex < this._charTexts.length) {
      const t = this._charTexts[this.cursorIndex];
      const targetX = t.x - 1;
      const targetY = t.y + t.height / 2;

      if (this._cursor.x === 0 && this._cursor.y === 0) {
        this._cursor.setPosition(targetX, targetY).setVisible(true);
        return;
      }

      if (this._cursorTween) {
        this._cursorTween.stop();
      }

      this._cursorTween = this.tweens.add({
        targets: this._cursor,
        x: targetX,
        y: targetY,
        duration: 100,      
        ease: "Cubic.easeOut", 
        onStart: () => { this._cursor.setVisible(true); }
      });

    } else {
      this._cursor?.setVisible(false);
    }
  }

  _tick() {
    if (!this.sessionActive) return;

    const elapsed = (this.time.now - this.startTime) / 1000;
    const left    = Math.max(0, this.timerDuration - elapsed);
    const ratio   = left / this.timerDuration;

    const m = String(Math.floor(left / 60)).padStart(2, "0");
    const s = String(Math.floor(left % 60)).padStart(2, "0");
    this._timerText.setText(`${m}:${s}`);

    const newPhase = left > this.timerDuration * 0.5 ? "calm"
                   : left > this.timerDuration * 0.2 ? "warning"
                   : "deadline";

    if (newPhase !== this.pressurePhase) {
      this.pressurePhase = newPhase;
      const col = newPhase === "calm"     ? PROG_COLOUR_CALM
                : newPhase === "warning"  ? PROG_COLOUR_WARNING
                : PROG_COLOUR_DEADLINE;
      this._progBar.setFillStyle(col);
      this._emotionText.setText(EMOTIONS[newPhase]);
      
      if (newPhase === "calm") {
        this.pigeonSprite.play("anim-pigeon-calm");
        this.accessorySprite?.play(`anim-acc-${this.currentAcc}-calm`);
      } else if (newPhase === "warning") {
        this.pigeonSprite.play("anim-pigeon-stressed");
        this.accessorySprite?.play(`anim-acc-${this.currentAcc}-warning`);
      } else if (newPhase === "deadline") {
        this.pigeonSprite.play("anim-pigeon-panic");
        this.accessorySprite?.play(`anim-acc-${this.currentAcc}-deadline`);
      }
    }

    this._progBar.width = PROG_W * ratio;

    if (elapsed > 0) {
      const wpm = Math.round((this.correctChars / 5) / (elapsed / 60));
      const acc = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 0;
      this._wpmText.setText(`WPM ${String(wpm).padStart(2, "0")}%`);
      this._accText.setText(`ACC ${String(acc).padStart(2, "0")}%`);
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
    const accuracy = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 10000) / 100 : 0;
    const xpGain   = Math.round(wpm * (accuracy / 100));

    let coins = 10;
    if (this.deadlineMet) coins += 5;
    if (accuracy > 98)    coins += 5;
    const isPB = wpm > (gameState.PBs?.[String(gameState.selectedLevel)] ?? 0);
    if (isPB)             coins += 5;

    gameState.lastResult = {
      wpm, 
      accuracy, 
      xpGain, 
      coinsEarned: coins,
      isPB, 
      deadlineMet: this.deadlineMet, 
      levelNumber: gameState.selectedLevel,
      title: gameState.articleTitle || gameState.title || "Article Complete",
      topic: gameState.articleTopic || gameState.topic || "Typing Session"
    };

    this.scene.start("resultsScene");
  }
}