import Phaser from "phaser";
import { GW, GH, CX, FONT, colours } from "../utils/scale.js";

export default class bootScene extends Phaser.Scene {
  constructor() { super("bootScene"); }

  preload() {

    // bg
    this.load.spritesheet("background", "./src/assets/bg-sheet.png", {
        frameWidth: 1920,
        frameHeight: 1080
      });
    this.load.image("logo", "./src/assets/logo.png");
    this.load.image("admin", "./src/assets/admin.png");
    this.load.image("level-select-bg", "./src/assets/level-select-bg.png");

    // pigeon variants
    this.load.spritesheet("pigeon-calm", "./src/assets/pigeon-calm.png", {
        frameWidth: 1920,
        frameHeight: 1920
      });
    this.load.spritesheet("pigeon-stressed", "./src/assets/pigeon-stressed.png", {
        frameWidth: 1920,
        frameHeight: 1920
      });
    this.load.spritesheet("pigeon-panic", "./src/assets/pigeon-panic.png", {
        frameWidth: 1920,
        frameHeight: 1920
      });
    this.load.spritesheet("pigeon-failed", "./src/assets/pigeon-failed.png", {
        frameWidth: 1920,
        frameHeight: 1920
      });
    this.load.spritesheet("pigeon-tutorial", "./src/assets/pigeon-tutorial.png", {
        frameWidth: 1920,
        frameHeight: 1920
      });

    // buttons
    this.load.image("btn-start-new", "./src/assets/btn-start-new.png");
    this.load.image("btn-login", "./src/assets/btn-login.png");
    this.load.image("btn-logout", "./src/assets/btn-logout.png");
    this.load.image("btn-continue", "./src/assets/btn-continue.png");
    this.load.image("btn-shop", "./src/assets/btn-shop.png");
    this.load.image("btn-signup", "./src/assets/btn-signup.png");
    this.load.image("btn-loginconfirm", "./src/assets/btn-loginconfirm.png");
    this.load.image("btn-go-back", "./src/assets/btn-go-back.png");
    this.load.image("btn-go-home", "./src/assets/btn-go-home.png");
    this.load.image("btn-try-again", "./src/assets/btn-try-again.png");

    //levels
    this.load.image("level-1", "./src/assets/level-1.png");
    this.load.image("level-2", "./src/assets/level-2.png");
    this.load.image("level-3", "./src/assets/level-3.png");
    this.load.image("level-4", "./src/assets/level-4.png");
    this.load.image("level-5", "./src/assets/level-5.png");

    // game
    this.load.image("bubble", "./src/assets/bubble.png");
    this.load.image("paper", "./src/assets/paper.png");
    this.load.image("default-typing-bg", "./src/assets/default-typing-bg.png");

    //results
    this.load.spritesheet("mission-failed", "./src/assets/mission-failed.png", {
      frameWidth: 1920,
      frameHeight: 1920
    });
    this.load.spritesheet("article-complete", "./src/assets/article-complete.png", {
      frameWidth: 1920,
      frameHeight: 1920
    });
    this.load.image("failed-bg", "./src/assets/failed-bg.png");
    this.load.image("newspaper", "./src/assets/newspaper.png");

    // shop
    this.load.image("shop-bg", "./src/assets/shop-bg.png");

    // misc assets
    this.load.image("login-card", "./src/assets/login-card.png");
    this.load.image("signup-card", "./src/assets/signup-card.png");
    this.load.image("icon-admin", "./src/assets/icon-admin.png");
    this.load.image("icon-lock", "./src/assets/lock.png");
    this.load.font('custom-font', './src/assets/custom-font.ttf', 'truetype');

    // audio (uncomment when you have the files) 
    // this.load.audio("bgm-menu",  "assets/audio/bgm-menu.mp3");
  }

  create() {
    this.scene.start("menuScene");
  }
}