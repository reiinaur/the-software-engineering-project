import Phaser from "phaser";
import bootScene        from "./scenes/bootScene.js";
import menuScene        from "./scenes/menuScene.js";
import loginScene       from "./scenes/loginScene.js";
import levelSelectScene from "./scenes/levelSelectScene.js";
import gameScene        from "./scenes/gameScene.js";
import resultsScene     from "./scenes/resultsScene.js";
import shopScene        from "./scenes/shopScene.js";
import adminScene       from "./scenes/adminScene.js";

const config = {
  type: Phaser.AUTO, 

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "game-container",
    width:  1920,
    height: 1080,
    min: { width: 320, height: 180 },
    max: { width: 1920, height: 1080 },
  },

  dom: {
    createContainer: true,
  },

  backgroundColor: "#ffffff",

  scene: [
    bootScene,        // preloads all assets before any scene runs
    menuScene,
    loginScene,
    levelSelectScene,
    gameScene,
    resultsScene,
    shopScene,
    adminScene,
  ],
};

new Phaser.Game(config);