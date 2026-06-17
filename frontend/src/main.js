import Phaser from "phaser";
import bootScene        from "./scenes/bootScene.js";
import menuScene        from "./scenes/menuScene.js";
import loginScene       from "./scenes/loginScene.js";
import levelSelectScene from "./scenes/levelSelectScene.js";
import gameScene        from "./scenes/gameScene.js";
import resultsScene     from "./scenes/resultsScene.js";
import shopScene        from "./scenes/shopScene.js";
import adminScene       from "./scenes/adminScene.js";
import tutorialScene from "./scenes/tutorialScene.js";
import './style.css';

const config = {
  // uses WebGL if the browser supports it, otherwise falls back to Canvas
  type: Phaser.AUTO, 

  scale: {
    mode: Phaser.Scale.FIT, // scales canvas to fit the window while keeping aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH, // centres horizontally and vertically
    parent: "game-container",
    width:  1920,
    height: 1080,
    min: { width: 320, height: 180 }, // smallest viewport before layout breaks
    max: { width: 1920, height: 1080 }, // largest viewport before layout breaks
  },

  backgroundColor: "#ffffff",
  
  input: {
    keyboard: {
      capture: [
        // capturing these prevents the browser's default behaviour
        Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
        Phaser.Input.Keyboard.KeyCodes.SPACE 
      ]
    }
  },

  scene: [
    bootScene, // preloads all assets before any scene runs
    menuScene,
    loginScene,
    levelSelectScene,
    tutorialScene,
    gameScene,
    resultsScene,
    shopScene,
    adminScene,
  ],
};

new Phaser.Game(config);