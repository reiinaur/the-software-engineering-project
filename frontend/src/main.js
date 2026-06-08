import Phaser from "phaser";
import menuScene from "./scenes/menuScene.js";
import loginScene from "./scenes/loginScene.js";
import gameScene from "./scenes/gameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'body',
  dom: {
    createContainer: true // Allows dynamic overlay injections
  },
  // Load scenes in sequence index
  scene: [menuScene, loginScene, gameScene]
};

new Phaser.Game(config);
