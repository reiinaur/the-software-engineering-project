import Phaser from "phaser";
import axios from "axios";
import { authHeader } from "../utils/auth.js";
import { gameState } from "../utils/gameState.js";
 
export default class levelSelectScene extends Phaser.Scene {
  constructor() {
    super("levelSelectScene");
  }
 
  create() {
    this.add.text(400, 55, "SELECT ASSIGNMENT", {
      fontSize: "30px", fill: "#e94560", fontStyle: "bold"
    }).setOrigin(0.5);
 
    this.add.text(400, 100, `Rank ${gameState.rankLevel}  ·  ${gameState.xpTotal} XP  ·  ${gameState.coinBalance} coins`, {
      fontSize: "16px", fill: "#aaaaaa"
    }).setOrigin(0.5);
 
    // Draw 5 level cards spaced horizontally
    const startX = 110;
    const gapX   = 145;
    for (let i = 1; i <= 5; i++) {
      this._drawCard(i, startX + (i - 1) * gapX, 320);
    }
 
    // Status text — shows "Loading..." while fetching from Flask
    this._statusText = this.add.text(400, 540, "", {
      fontSize: "16px", fill: "#e94560"
    }).setOrigin(0.5);
 
    this.add.text(40, 20, "← Back", {
      fontSize: "16px", fill: "#aaaaaa"
    }).setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.scene.start("menuScene"));
  }
 
  _drawCard(levelNum, x, y) {
    // A level is accessible only if the player's rankLevel >= that level number.
    // This mirrors the rank gate in loadLevel() pseudocode and the Flask route.
    const unlocked = gameState.rankLevel >= levelNum;
    const pb       = gameState.PBs?.[String(levelNum)];
 
    // Card background
    const cardBg = this.add.rectangle(x, y, 130, 220,
      unlocked ? 0x2a2a4a : 0x1e1e30
    ).setStrokeStyle(2, unlocked ? 0xe94560 : 0x444444);
 
    this.add.text(x, y - 80, `LEVEL ${levelNum}`, {
      fontSize: "14px",
      fill: unlocked ? "#ffffff" : "#555555",
      fontStyle: "bold",
    }).setOrigin(0.5);
 
    if (unlocked) {
      // Show personal best if one exists for this level
      this.add.text(x, y + 20, pb ? `PB: ${pb} WPM` : "Not played", {
        fontSize: "13px", fill: "#aaaaaa", align: "center"
      }).setOrigin(0.5);
 
      // Make clickable
      cardBg.setInteractive({ useHandCursor: true });
      cardBg.on("pointerover",  () => cardBg.setFillStyle(0x3a3a6a));
      cardBg.on("pointerout",   () => cardBg.setFillStyle(0x2a2a4a));
      cardBg.on("pointerdown",  () => this._selectLevel(levelNum));
 
      this.add.text(x, y + 70, "PLAY →", {
        fontSize: "14px", fill: "#e94560"
      }).setOrigin(0.5);
 
    } else {
      this.add.text(x, y, "🔒", { fontSize: "28px" }).setOrigin(0.5);
      this.add.text(x, y + 50, `Rank ${levelNum}\nRequired`, {
        fontSize: "12px", fill: "#555555", align: "center"
      }).setOrigin(0.5);
    }
  }
 
  async _selectLevel(levelNum) {
    this._statusText.setText("Loading assignment...");
 
    try {
      // Fetch passage from Flask. The authHeader() includes the JWT token.
      const res = await axios.get(`/api/levels/${levelNum}`, {
        headers: authHeader(),
      });
 
      // Write level data to the shared gameState so gameScene can read it
      gameState.selectedLevel  = levelNum;
      gameState.passage        = res.data.passage;
      gameState.articleTitle   = res.data.title;
      gameState.timerDuration  = res.data.timerDuration;
 
      this.scene.start("gameScene");
 
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load level.";
      this._statusText.setText(msg);
    }
  }
}