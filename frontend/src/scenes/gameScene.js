import Phaser from "phaser";
import { GW, GH, CX, CY, FONT, colours, HEX, px, py } from "../utils/scale.js";
import { gameState } from "../utils/gameState.js";

// background fill colour for each purchasable screen theme
const THEMES = {
  default: '#e6ba88',
  vanilla: '#f8f2f7',
  lavendar: '#bcafda',
  cottoncandy: '#f0b2c7',
  forest: '#577875'
};

// header / HUD positions
const TIMER_X     = px(11);         
const TIMER_Y     = py(9);         

const WPM_X       = px(45);         
const WPM_Y       = py(8.3);
const ACC_X       = px(53);         
const ACC_Y       = py(8.3);

// progress bar geometry and phase colours
const PROG_X      = px(7);          
const PROG_Y      = py(11.8);       
const PROG_W      = px(51.3);       
const PROG_H      = py(0.7);        
const PROG_COLOUR_CALM     = HEX.success;
const PROG_COLOUR_WARNING  = HEX.warning;
const PROG_COLOUR_DEADLINE = HEX.accent;

// typing paper layout bounds
const DOC_LEFT   = px(10);         
const DOC_TOP    = py(22);         
const DOC_RIGHT  = px(55);         
const CHAR_SIZE  = 36;             
const LINE_H     = 48;             

// pigeon and speech bubble positions
const PIGEON_X   = px(78);
const PIGEON_Y   = py(60);
const BUBBLE_X   = px(83);         
const BUBBLE_Y   = py(28);

// emotion strings displayed inside the speech bubble at each pressure phasev
const EMOTIONS = {
  calm:     "( ˊ ᵕ ˋ )",
  warning:  "!( ˊ ᵕ ˋ )",       
  deadline: "!(´Д`!)",
};

export default class gameScene extends Phaser.Scene {
  constructor() { super("gameScene"); }

  create() {
    // apply the player's equipped screen theme as the camera background colour
    const equippedTheme = gameState.shopEquipped?.screenTheme || "default";
    this.cameras.main.setBackgroundColor(THEMES[equippedTheme] || THEMES.default);
    
    this.add.image(px(32), py(86), "paper").setScale(0.8);

    // initialise all typing engine state variables
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

    // HUD text objects — timer, wpm, and accuracy
    this._timerText = this.add.text(TIMER_X, TIMER_Y, "00:00", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    }).setOrigin(1, 0.5);

    this._wpmText = this.add.text(WPM_X, WPM_Y, "WPM 00%", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    });

    this._accText = this.add.text(ACC_X, ACC_Y, "ACC 00%", {
      fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#292929", fontStyle: "bold"
    });

    // progress bar — background track then coloured fill drawn on top
    this._progBarBackground = this.add.rectangle(PROG_X, PROG_Y, PROG_W, PROG_H, 0xdddddd).setOrigin(0, 0);
    this._progBar = this.add.rectangle(PROG_X, PROG_Y, PROG_W, PROG_H, PROG_COLOUR_CALM).setOrigin(0, 0);

    // passage rendering: word-aware line wrap
    this._charTexts = [];
    const passage   = gameState.passage;
    let cx = DOC_LEFT, cy = DOC_TOP;

    const words = passage.split(/(\s+)/);

    words.forEach((word) => {
      if (word === "") return;
      if (/^\s+$/.test(word)) {
        // whitespace characters are placed directly without wrapping checks
        word.split("").forEach((ch) => {
          const t = this.add.text(cx, cy, ch, {
            fontFamily: "'Courier New', monospace", fontSize: `${CHAR_SIZE}px`, fontStyle: "bold", color: "#a0a0a0",
          });
          this._charTexts.push(t);
          cx += t.width;
        });
      } else {
        // measure the whole word first using off-screen probe objects, then wrap if needed
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

    // blinking cursor rectangle that tracks the current character position
    this._cursor = this.add.rectangle(0, 0, 2, CHAR_SIZE + 4, HEX.muted || 0x7767a9);
    this._updateCursor();
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => { if (this._cursor) this._cursor.setVisible(!this._cursor.visible); }
    });
  
    // set up pigeon animations and sprites
    this._createPigeonAnimations();
    
    this.pigeonSprite = this.add.sprite(PIGEON_X, PIGEON_Y, "pigeon-calm").setScale(0.4);
    this.pigeonSprite.play("anim-pigeon-calm");

    // accessory overlay — rendered on top of the pigeon at the same position
    this.accessorySprite = null;

    const validAcc = ["silly-hat", "crown", "top-hat"];

    this.currentAcc = validAcc.includes(gameState.shopEquipped?.accessories)
      ? gameState.shopEquipped.accessories
      : "none";

    const targetTexKey = `${this.currentAcc}-calm`;

    if (this.currentAcc !== "none" && this.textures.exists(targetTexKey)) {
      this.accessorySprite = this.add.sprite(PIGEON_X, PIGEON_Y, targetTexKey).setScale(0.4);
      this.accessorySprite.play(`anim-acc-${this.currentAcc}-calm`);
    }

    this.speechBubble = this.add.image(px(83), py(28), "bubble").setScale(0.15);

    this._emotionText = this.add.text(BUBBLE_X, BUBBLE_Y, EMOTIONS.calm, {
      fontFamily: "'Roboto Mono', monospace", fontSize: "22px", color: colours.main,
    }).setOrigin(0.5);

    // keyboard input handler
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

      // if the player has typed the full passage, end the session as a success
      if (this.cursorIndex >= passage.length) {
        this.deadlineMet   = true;
        this.sessionActive = false;
        this._endSession();
      }
    });

    // small delay before starting the clock so the first tick isn't at t=0
    this.time.delayedCall(10, () => {
      this.startTime = this.time.now;
      this.time.addEvent({ delay: 1000, loop: true, callback: this._tick, callbackScope: this });
    });
  }

  _createPigeonAnimations() {
    // register the four base pigeon mood animations if they haven't been created yet
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

    // also register phase-specific accessory animations for whatever the player has equipped
    const activeAcc = gameState.shopEquipped?.accessories || "none";
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

      // snap on first placement, then tween smoothly for subsequent moves
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

    // update the mm:ss countdown display
    const m = String(Math.floor(left / 60)).padStart(2, "0");
    const s = String(Math.floor(left % 60)).padStart(2, "0");
    this._timerText.setText(`${m}:${s}`);

    // determine the current pressure phase based on remaining time thresholds
    const newPhase = left > this.timerDuration * 0.5 ? "calm"
                   : left > this.timerDuration * 0.2 ? "warning"
                   : "deadline";

    // only update visuals when the phase actually changes to avoid redundant calls
    if (newPhase !== this.pressurePhase) {
      this.pressurePhase = newPhase;
      const col = newPhase === "calm"     ? PROG_COLOUR_CALM
                : newPhase === "warning"  ? PROG_COLOUR_WARNING
                : PROG_COLOUR_DEADLINE;
      this._progBar.setFillStyle(col);
      this._emotionText.setText(EMOTIONS[newPhase]);
      
      // swap pigeon and accessory animations to match the new phase
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

    // recalculate and display live wpm and accuracy stats
    if (elapsed > 0) {
      const wpm = Math.round((this.correctChars / 5) / (elapsed / 60));
      const acc = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 0;
      this._wpmText.setText(`WPM ${String(wpm).padStart(2, "0")}%`);
      this._accText.setText(`ACC ${String(acc).padStart(2, "0")}%`);
    }

    if (left <= 0) {
      this.sessionActive = false;
      this.deadlineMet   = false; // timer ran out before the passage was completed
      this._endSession();
    }
  }

  _endSession() {
    if (this._ended) return; // guard against being called twice
    this._ended = true;

    const elapsed  = (this.time.now - this.startTime) / 1000;
    const wpm      = elapsed > 0 ? Math.round((this.correctChars / 5) / (elapsed / 60)) : 0;
    const accuracy = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 10000) / 100 : 0;
    const xpGain   = Math.round(wpm * (accuracy / 100));

    // base coin reward with bonuses for completing on time, high accuracy, and a new PB
    let coins = 10;
    if (this.deadlineMet) coins += 5;
    if (accuracy > 98)    coins += 5;
    const isPB = wpm > (gameState.PBs?.[String(gameState.selectedLevel)] ?? 0);
    if (isPB)             coins += 5;

    // write the result to gameState so resultsScene can read it
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