import Phaser from "phaser";
import { GW, GH, CX, FONT, colours } from "../utils/scale.js";

// bootScene runs first in the scene list and preloads every asset before any other scene starts
export default class bootScene extends Phaser.Scene {
  constructor() {
    super("bootScene");
  }

  preload() {
    // backgrounds and UI chrome
    this.load.spritesheet("background", "/assets/bg-sheet.png", {
      frameWidth: 1920,
      frameHeight: 1080,
    });
    this.load.image("logo", "/assets/logo.png");
    this.load.image("admin", "/assets/admin.png");
    this.load.image("level-select-bg", "/assets/level-select-bg.png");

    // pigeon mood variants
    this.load.spritesheet("pigeon-calm", "/assets/pigeon-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "pigeon-stressed",
      "/assets/pigeon-stressed.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet("pigeon-panic", "/assets/pigeon-panic.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("pigeon-failed", "/assets/pigeon-failed.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "pigeon-tutorial",
      "/assets/pigeon-tutorial.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );

    // accessory variants (silly hat)
    this.load.spritesheet("silly-hat-calm", "/assets/silly-hat-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "silly-hat-warning",
      "/assets/silly-hat-warning.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "silly-hat-deadline",
      "/assets/silly-hat-deadline.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "silly-hat-failure",
      "/assets/silly-hat-failure.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );

    // accessory variants (crown)
    this.load.spritesheet("crown-calm", "/assets/crown-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("crown-warning", "/assets/crown-warning.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("crown-deadline", "/assets/crown-deadline.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet("crown-failure", "/assets/crown-failure.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });

    // accesory variants (top hat)
    this.load.spritesheet("top-hat-calm", "/assets/top-hat-calm.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "top-hat-warning",
      "/assets/top-hat-warning.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "top-hat-deadline",
      "/assets/top-hat-deadline.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.spritesheet(
      "top-hat-failure",
      "/assets/top-hat-failure.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );

    // navigation and action buttons
    this.load.image("btn-start-new", "/assets/btn-start-new.png");
    this.load.image("btn-login", "/assets/btn-login.png");
    this.load.image("btn-logout", "/assets/btn-logout.png");
    this.load.image("btn-continue", "/assets/btn-continue.png");
    this.load.image("btn-shop", "/assets/btn-shop.png");
    this.load.image("btn-signup", "/assets/btn-signup.png");
    this.load.image("btn-loginconfirm", "/assets/btn-loginconfirm.png");
    this.load.image("btn-go-back", "/assets/btn-go-back.png");
    this.load.image("btn-go-home", "/assets/btn-go-home.png");
    this.load.image("btn-try-again", "/assets/btn-try-again.png");

    // level select card images
    this.load.image("level-1", "/assets/level-1.png");
    this.load.image("level-2", "/assets/level-2.png");
    this.load.image("level-3", "/assets/level-3.png");
    this.load.image("level-4", "/assets/level-4.png");
    this.load.image("level-5", "/assets/level-5.png");

    // game scene assets
    this.load.image("bubble", "/assets/bubble.png");
    this.load.image("paper", "/assets/paper.png");
    this.load.image("default-typing-bg", "/assets/default-typing-bg.png");

    // results screen assets
    this.load.spritesheet("mission-failed", "/assets/mission-failed.png", {
      frameWidth: 1920,
      frameHeight: 1920,
    });
    this.load.spritesheet(
      "article-complete",
      "/assets/article-complete.png",
      {
        frameWidth: 1920,
        frameHeight: 1920,
      },
    );
    this.load.image("failed-bg", "/assets/failed-bg.png");
    this.load.image("newspaper", "/assets/newspaper.png");

    // shop scene assets
    this.load.image("shop-bg", "/assets/shop-bg.png");
    this.load.image(
      "silly-hat-placeholder",
      "/assets/silly-hat-placeholder.png",
    );
    this.load.image("crown-placeholder", "/assets/crown-placeholder.png");
    this.load.image(
      "top-hat-placeholder",
      "/assets/top-hat-placeholder.png",
    );
    this.load.image("default-placeholder","/assets/default-placeholder.png");
    this.load.image("vanilla-placeholder","/assets/vanilla-placeholder.png");
    this.load.image("lavendar-placeholder","/assets/lavendar-placeholder.png");
    this.load.image("cotton-candy-placeholder","/assets/cotton-candy-placeholder.png");
    this.load.image("forest-placeholder","/assets/forest-placeholder.png");

    // miscellaneous UI elements
    this.load.image("login-card", "/assets/login-card.png");
    this.load.image("signup-card", "/assets/signup-card.png");
    this.load.image("icon-admin", "/assets/icon-admin.png");
    this.load.image("icon-lock", "/assets/lock.png");
    this.load.image("flashcard", "/assets/flashcard.png");

    // custom bitmap font
    this.load.font("custom-font", "/assets/custom-font.ttf", "truetype");

    // audio
    this.load.audio("success", "/assets/you-did-it.mp3");
    this.load.audio("failed-sound", "/assets/failure.mp3");
    this.load.audio("bgm", "/assets/bgm.mp3");
    this.load.audio("click", "/assets/click.mp3");
  }

  create() {
    // start background music then immediately start to the main menu
    this.sound.play("bgm", { loop: true, volume: 0.25 });
    this.scene.start("menuScene");
  }
}
