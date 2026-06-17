import Phaser from "phaser";
import axios from "axios";
import { GW, GH, CX, CY, FONT, colours, HEX, px, py } from "../utils/scale.js";
import { authHeader } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";

// ── Paper card positions (centre of each blank paper on the corkboard) ──────
const PAPER_POSITIONS = [
  { x: 360, y: 473, angle: 1   },  // level 1
  { x: 605, y: 600, angle: 7   },  // level 2
  { x: 960, y: 510, angle: 0   },  // level 3
  { x: 1200, y: 600, angle: 3  },  // level 4
  { x: 1531, y: 523, angle: 0  },  // level 5
];

//tasks
const TASK_NAMES = [
  "Tutorial",
  "Basic Words",
  "Simple Passages",
  "More NESA\nPassages",
  "Grand Finale"
];

const TASK_DESCRIPTIONS = [
  "Learn how to touch type.",
  "Practice simple SE words until time is out.",
  "Read through vocabulary passages",
  "Challenging SE texts.",
  "Put all your skills to the ultimate test!"
];

const CARD_W         = 352;
const CARD_H         = 510;
const CARD_SCALE     = 1;
const CARD_HOVER_SCALE = 1.03;
const TWEEN_DURATION = 130;

const STATUS = { x: CX, y: py(94) };

export default class levelSelectScene extends Phaser.Scene {
  constructor() { super("levelSelectScene"); }

  create() {
    this.add.image(CX, CY, "level-select-bg");

    // ── Level paper cards ─────────────────────────────────────────
    for (let i = 1; i <= 5; i++) {
      this._placeCard(i, PAPER_POSITIONS[i - 1]);
    }

    // ── Status (loading indicator) ────────────────────────────────
    this._status = this.add.text(STATUS.x, STATUS.y, "", {
      fontFamily: "'custom-font', monospace",
      fontSize:   FONT.sm,
      color:      colours.main,
    }).setOrigin(0.5);

    // ── Back arrow ────────────────────────────────────────────────
    const btnBack = this.add
      .image(CX - 810, CY - 440, "btn-go-back")
      .setOrigin(0.5)
      .setDepth(10)
      .setScale(0.09)
      .setInteractive({ useHandCursor: true });

    btnBack.on("pointerover", () => btnBack.setScale(0.11));
    btnBack.on("pointerout", () => btnBack.setScale(0.09));
    btnBack.on("pointerdown",  () => this.scene.start("menuScene"));
  }

  _placeCard(levelNum, pos) {
    const unlocked = gameState.rankLevel >= levelNum;
    const pb       = gameState.PBs?.[String(levelNum)];
    const taskName = TASK_NAMES[levelNum - 1] || `Level ${levelNum}`;
    const taskDesc = TASK_DESCRIPTIONS[levelNum - 1] || "";

    // Create a container to hold paper sheet, task name, and records
    // Note: Inside a container, (0, 0) is the center of the container
    const container = this.add.container(pos.x, pos.y);
    container.setAngle(pos.angle);

    // ── Layer sorting logic — Swaps levels 3 and 4 so 3 overlaps 4 ──
    let defaultDepth = levelNum;
    if (levelNum === 3) {
      defaultDepth = 4;
    } else if (levelNum === 4) {
      defaultDepth = 3;
    }
    container.setDepth(defaultDepth);
    // ─────────────────────────────────────────────────────────────────

    // 1. The paper card image (centered at 0,0 inside container)
    const cardImg = this.add.image(0, 0, `level-${levelNum}`)
      .setOrigin(0.5)
      .setDisplaySize(CARD_W, CARD_H);
    container.add(cardImg);
    
    const baseTitleY = -CARD_H * 0.15 + 20;
    const titleY = unlocked ? baseTitleY : baseTitleY + 80;

    // 2. Task Name Text (positioned slightly upper half of paper)
    const textTask = this.add.text(0, titleY, taskName, {
      fontFamily: "'custom-font', monospace",
      fontSize:   "18px",
      fontWeight: "bold",
      color:      "#4a4080",
      align:      "center",
      wordWrap:   { width: CARD_W - 20 }
    }).setOrigin(0.5);
    container.add(textTask);

    const titleBottomY = textTask.y + (textTask.displayHeight / 2);
    const textDesc = this.add.text(0, titleBottomY + 15, taskDesc, {
      fontFamily: "'custom-font', monospace",
      fontSize:   "13px",
      color:      "#6b629c",
      align:      "center",
      wordWrap:   { width: CARD_W - 200 }
    }).setOrigin(0.5, 0);
    container.add(textDesc);

    // 3. Handle Lock State vs Record State
    if (!unlocked) {
      // Dim the image and text if locked
      textDesc.setAlpha(0.4);
      textTask.setAlpha(0.4);

      // Add lock emoji right in the center
      const lockIcon = this.add.image(0, -45, "icon-lock")
      .setScale(0.03)
      .setOrigin(0.5);
      container.add(lockIcon);
      return; 
    }

    // 4. PB text on unlocked card (positioned on lower half of paper)
    if (pb) {
      const textPB = this.add.text(0, CARD_H * 0.25, `PB: ${pb} WPM`, {
        fontFamily: "'custom-font', monospace",
        fontSize:   "16px",
        color:      "#b1afb0",
      }).setOrigin(0.5);
      container.add(textPB);
    } else {
      // Optional: default text if they haven't played it yet
      const textNoPB = this.add.text(0, CARD_H * 0.25, "Not Played", {
        fontFamily: "'custom-font', monospace",
        fontSize:   "14px",
        color:      "#888888",
      }).setOrigin(0.5);
      container.add(textNoPB);
    }

    // 5. Make the hit-area interactive based on the card image's dimensions
    container.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H), 
      Phaser.Geom.Rectangle.Contains
    );
    container.input.cursor = 'pointer';

    // ── Hover: scale the entire container ─────────────────────────
    container.on("pointerover", () => {
      this.tweens.killTweensOf(container);
      
      // REMOVED: container.setDepth(20) has been removed so depths stay locked!
      
      this.tweens.add({
        targets:  container,
        scaleX:   CARD_HOVER_SCALE,
        scaleY:   CARD_HOVER_SCALE,
        duration: TWEEN_DURATION,
        ease:     "Sine.easeOut",
      });
    });

    // ── Pointer out: scale back down ─────────────────────────
    container.on("pointerout", () => {
      this.tweens.killTweensOf(container);
      
      this.tweens.add({
        targets:  container,
        scaleX:   CARD_SCALE,
        scaleY:   CARD_SCALE,
        duration: TWEEN_DURATION,
        ease:     "Sine.easeOut",
      });
    });

    // ── Click: trigger level loading ─────────────────────────
    container.on("pointerdown", () => this._loadLevel(levelNum));
  }

  async _loadLevel(levelNum) {
    this._status.setText("Loading assignment...");
    this.input.enabled = false;

    try {
      const res = await axios.get(`/api/levels/${levelNum}`, { headers: authHeader() });
      Object.assign(gameState, {
        selectedLevel: levelNum,
        passage:       res.data.passage,
        articleTitle:  res.data.title,
        timerDuration: res.data.timerDuration,
      });
      this.scene.start("gameScene");
    } catch (err) {
      this._status.setText(err.response?.data?.message || "Failed to load. Try again.");
      this.input.enabled = true;
    }
  }
}