import Phaser from "phaser";
import { GW, GH, CX, FONT, colours } from "../utils/scale.js";

// bootScene runs first in the scene list and preloads every asset before any other scene starts
export default class bootScene extends Phaser.Scene {
  constructor() {
    super("bootScene");
  }

  preload() {
    // backgrounds and UI chrome
    this.load.spritesheet("background", "./src/assets/bg-sheet.png", {
      frameWidth: 1920,
      frameHeight: 1080,
    });
    this.load.image("logo", "./src/assets/logo.png");
    this.load.image("admin", "./src/assets/admin.png");
    this.load.image("level-select-bg", "./src/assets/level-select-bg.png");

    // pigeon mood variants
    this.load.spritesheet("pigeon-calm", "./src/assets/pigeon-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "pigeon-stressed",
      "./src/assets/pigeon-stressed.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet("pigeon-panic", "./src/assets/pigeon-panic.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("pigeon-failed", "./src/assets/pigeon-failed.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "pigeon-tutorial",
      "./src/assets/pigeon-tutorial.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );

    // accessory variants (silly hat)
    this.load.spritesheet("silly-hat-calm", "./src/assets/silly-hat-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "silly-hat-warning",
      "./src/assets/silly-hat-warning.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "silly-hat-deadline",
      "./src/assets/silly-hat-deadline.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "silly-hat-failure",
      "./src/assets/silly-hat-failure.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );

    // accessory variants (crown)
    this.load.spritesheet("crown-calm", "./src/assets/crown-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("crown-warning", "./src/assets/crown-warning.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("crown-deadline", "./src/assets/crown-deadline.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("crown-failure", "./src/assets/crown-failure.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });

    // accesory variants (top hat)
    this.load.spritesheet("top-hat-calm", "./src/assets/top-hat-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "top-hat-warning",
      "./src/assets/top-hat-warning.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "top-hat-deadline",
      "./src/assets/top-hat-deadline.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "top-hat-failure",
      "./src/assets/top-hat-failure.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );

    // navigation and action buttons
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

    // level select card images
    this.load.image("level-1", "./src/assets/level-1.png");
    this.load.image("level-2", "./src/assets/level-2.png");
    this.load.image("level-3", "./src/assets/level-3.png");
    this.load.image("level-4", "./src/assets/level-4.png");
    this.load.image("level-5", "./src/assets/level-5.png");

    // game scene assets
    this.load.image("bubble", "./src/assets/bubble.png");
    this.load.image("paper", "./src/assets/paper.png");
    this.load.image("default-typing-bg", "./src/assets/default-typing-bg.png");

    // results screen assets
    this.load.spritesheet("mission-failed", "./src/assets/mission-failed.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "article-complete",
      "./src/assets/article-complete.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.image("failed-bg", "./src/assets/failed-bg.png");
    this.load.image("newspaper", "./src/assets/newspaper.png");

    // shop scene assets
    this.load.image("shop-bg", "./src/assets/shop-bg.png");
    this.load.image(
      "silly-hat-placeholder",
      "./src/assets/silly-hat-placeholder.png",
    );
    this.load.image("crown-placeholder", "./src/assets/crown-placeholder.png");
    this.load.image(
      "top-hat-placeholder",
      "./src/assets/top-hat-placeholder.png",
    );
    this.load.image("default-placeholder","./src/assets/default-placeholder.png");
    this.load.image("vanilla-placeholder","./src/assets/vanilla-placeholder.png");
    this.load.image("lavendar-placeholder","./src/assets/lavendar-placeholder.png");
    this.load.image("cotton-candy-placeholder","./src/assets/cotton-candy-placeholder.png");
    this.load.image("forest-placeholder","./src/assets/forest-placeholder.png");

    // miscellaneous UI elements
    this.load.image("login-card", "./src/assets/login-card.png");
    this.load.image("signup-card", "./src/assets/signup-card.png");
    this.load.image("icon-admin", "./src/assets/icon-admin.png");
    this.load.image("icon-lock", "./src/assets/lock.png");
    this.load.image("flashcard", "./src/assets/flashcard.png");

    // custom bitmap font
    this.load.font("custom-font", "./src/assets/custom-font.ttf", "truetype");

    // audio
    this.load.audio("success", "./src/assets/you-did-it.mp3");
    this.load.audio("failed-sound", "./src/assets/failure.mp3");
    this.load.audio("bgm", "./src/assets/bgm.mp3");
    this.load.audio("click", "./src/assets/click.mp3");
  }

  create() {
    // start background music then immediately start to the main menu
    this.sound.play("bgm", { loop: true, volume: 0.25 });
    this.scene.start("menuScene");
  }
}
